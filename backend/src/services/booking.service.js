/**
 * Booking Service
 * Xử lý logic đặt vé, khóa ghế và giải phóng ghế (QD_BOOK_01, QD_BOOK_02, QD_BOOK_03)
 */

const prisma = require('../config/prisma');
const { redisClient } = require('../config/redis');
const { io } = require('../config/socket');
const QRCode = require('qrcode');
const logger = require('../utils/logger');

const LOCK_MINUTES = parseInt(process.env.BOOKING_LOCK_MINUTES || '15', 10);
const MAX_SEATS = parseInt(process.env.MAX_SEATS_PER_BOOKING || '5', 10);

/**
 * Khóa ghế tạm thời (QD_BOOK_01)
 * Dùng Redis để đảm bảo race-condition safe
 */
const lockSeats = async (tripId, seatIds, customerId) => {
  // Kiểm tra giới hạn số ghế (QD_BOOK_03)
  if (seatIds.length > MAX_SEATS) {
    throw new Error(`Chỉ được đặt tối đa ${MAX_SEATS} ghế trên một chuyến.`);
  }

  const lockExpiry = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
  const lockResults = [];

  // Dùng Lua script để atomic check-and-set trên Redis
  for (const seatId of seatIds) {
    const lockKey = `seat_lock:${tripId}:${seatId}`;
    const acquired = await redisClient.set(lockKey, customerId, {
      EX: LOCK_MINUTES * 60,
      NX: true, // only set if not exists
    });

    if (!acquired) {
      // Rollback already locked seats
      for (const lockedId of lockResults) {
        await redisClient.del(`seat_lock:${tripId}:${lockedId}`);
      }
      throw new Error(`Ghế ${seatId} đã được người khác chọn. Vui lòng chọn ghế khác.`);
    }
    lockResults.push(seatId);
  }

  // Update DB status to PROCESSING only if the seats are still available.
  const updated = await prisma.tripSeat.updateMany({
    where: { id: { in: seatIds }, tripId, status: 'AVAILABLE' },
    data: {
      status: 'PROCESSING',
      lockedAt: new Date(),
      lockedBy: customerId,
      lockExpiresAt: lockExpiry,
    },
  });

  if (updated.count !== seatIds.length) {
    for (const lockedId of lockResults) {
      await redisClient.del(`seat_lock:${tripId}:${lockedId}`);
    }
    throw new Error('Một hoặc nhiều ghế không còn khả dụng. Vui lòng chọn lại.');
  }

  // Broadcast realtime seat status change
  io?.to(`trip:${tripId}`).emit('seats:updated', {
    seatIds,
    status: 'PROCESSING',
  });

  logger.info(`Seats locked: ${seatIds.join(',')} for customer ${customerId} on trip ${tripId}`);
  return { seatIds, lockExpiresAt: lockExpiry };
};

/**
 * Giải phóng ghế (timeout hoặc hủy) - QD_BOOK_02
 */
const releaseSeats = async (tripId, seatIds, customerId) => {
  for (const seatId of seatIds) {
    const lockKey = `seat_lock:${tripId}:${seatId}`;
    const owner = await redisClient.get(lockKey);
    if (!customerId || owner === customerId) {
      await redisClient.del(lockKey);
    }
  }

  await prisma.tripSeat.updateMany({
    where: {
      id: { in: seatIds },
      tripId,
      ...(customerId ? { lockedBy: customerId } : {}),
    },
    data: { status: 'AVAILABLE', lockedAt: null, lockedBy: null, lockExpiresAt: null },
  });

  io?.to(`trip:${tripId}`).emit('seats:updated', { seatIds, status: 'AVAILABLE' });
  logger.info(`Seats released: ${seatIds.join(',')} on trip ${tripId}`);
};

const releaseExpiredSeatLocks = async () => {
  const expiredSeats = await prisma.tripSeat.findMany({
    where: {
      status: 'PROCESSING',
      lockExpiresAt: { lt: new Date() },
    },
    select: { id: true, tripId: true },
  });

  if (!expiredSeats.length) return 0;

  const seatIds = expiredSeats.map((seat) => seat.id);
  await prisma.tripSeat.updateMany({
    where: { id: { in: seatIds }, status: 'PROCESSING' },
    data: { status: 'AVAILABLE', lockedAt: null, lockedBy: null, lockExpiresAt: null },
  });

  const byTrip = expiredSeats.reduce((acc, seat) => {
    acc[seat.tripId] = acc[seat.tripId] || [];
    acc[seat.tripId].push(seat.id);
    return acc;
  }, {});

  for (const [tripId, ids] of Object.entries(byTrip)) {
    io?.to(`trip:${tripId}`).emit('seats:updated', { seatIds: ids, status: 'AVAILABLE' });
  }

  logger.info(`Released ${expiredSeats.length} expired seat locks`);
  return expiredSeats.length;
};

/**
 * Tạo đơn hàng và vé sau khi thanh toán thành công
 */
const confirmBooking = async ({ customerId, tripId, seatIds, passengerInfo, paymentMethod }) => {
  for (const seatId of seatIds) {
    const owner = await redisClient.get(`seat_lock:${tripId}:${seatId}`);
    if (owner !== customerId) {
      throw new Error('Phiên giữ chỗ đã hết hạn. Vui lòng đặt lại.');
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Verify seats are still locked by this customer
    const seats = await tx.tripSeat.findMany({
      where: { id: { in: seatIds }, tripId, lockedBy: customerId, status: 'PROCESSING' },
      include: { trip: true },
    });

    if (seats.length !== seatIds.length) {
      throw new Error('Phiên giữ chỗ đã hết hạn. Vui lòng đặt lại.');
    }

    const unitPrice = Number(seats[0].trip.basePrice);
    const totalAmount = unitPrice * seatIds.length;
    const isCashPayment = paymentMethod === 'CASH';

    // Create Order
    const order = await tx.order.create({
      data: {
        customerId,
        totalAmount,
        status: isCashPayment ? 'PAID' : 'PENDING',
      },
    });

    if (isCashPayment) {
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          method: paymentMethod,
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });
    }

    // Create Ticket Details and update seat status
    const tickets = [];
    for (let i = 0; i < seatIds.length; i++) {
      const seatId = seatIds[i];
      const passenger = passengerInfo[i] || passengerInfo[0];

      const qrData = JSON.stringify({ orderId: order.id, seatId, tripId, ts: Date.now() });
      const qrCode = await QRCode.toDataURL(qrData);

      const ticket = await tx.ticketDetail.create({
        data: {
          orderId: order.id,
          tripSeatId: seatId,
          passengerName: passenger.name,
          passengerPhone: passenger.phone,
          price: unitPrice,
          qrCode,
          status: isCashPayment ? 'PAID' : 'PENDING',
        },
      });
      tickets.push(ticket);

      if (isCashPayment) {
        await tx.tripSeat.update({
          where: { id: seatId },
          data: { status: 'BOOKED', lockedBy: null, lockedAt: null, lockExpiresAt: null },
        });

        await redisClient.del(`seat_lock:${tripId}:${seatId}`);
      }
    }

    if (isCashPayment) {
      io?.to(`trip:${tripId}`).emit('seats:updated', { seatIds, status: 'BOOKED' });
    }

    return { order, tickets };
  });
};

/**
 * Hủy vé và hoàn tiền theo chính sách nhà xe
 */
const cancelTicket = async (ticketId, customerId) => {
  const ticket = await prisma.ticketDetail.findFirst({
    where: { id: ticketId },
    include: {
      order: { include: { customer: true } },
      tripSeat: { include: { trip: true } },
    },
  });

  if (!ticket) throw new Error('Vé không tồn tại.');
  if (ticket.order.customerId !== customerId) throw new Error('Bạn không có quyền hủy vé này.');
  if (!['PENDING', 'PAID'].includes(ticket.status)) throw new Error('Vé không thể hủy ở trạng thái hiện tại.');

  const hoursUntilDeparture = (ticket.tripSeat.trip.departureTime - new Date()) / 1000 / 3600;

  let refundRate = 0;
  if (hoursUntilDeparture > 24) refundRate = 1.0;
  else if (hoursUntilDeparture >= 12) refundRate = 0.7;

  const refundAmount = Math.floor(Number(ticket.price) * refundRate);

  await prisma.$transaction(async (tx) => {
    await tx.ticketDetail.update({
      where: { id: ticketId },
      data: {
        status: refundAmount > 0 ? 'REFUNDED' : 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Khách hàng hủy vé',
      },
    });

    await tx.tripSeat.update({
      where: { id: ticket.tripSeatId },
      data: { status: 'AVAILABLE', lockedBy: null, lockExpiresAt: null },
    });

    if (refundAmount > 0) {
      await tx.payment.create({
        data: {
          orderId: ticket.orderId,
          amount: -refundAmount,
          method: 'REFUND',
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount,
        },
      });
    }
  });

  return { refundAmount, refundRate };
};

module.exports = { lockSeats, releaseSeats, releaseExpiredSeatLocks, confirmBooking, cancelTicket };
