/**
 * Booking Service
 * Xử lý logic đặt vé, khóa ghế và giải phóng ghế (QD_BOOK_01, QD_BOOK_02, QD_BOOK_03)
 */

const prisma = require('../config/prisma');
const { redisClient } = require('../config/redis');
const { getIo } = require('../config/socket');
const QRCode = require('qrcode');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { createPublicCode, createQrPayload, activeTicketStatuses } = require('../utils/security');
const { encryptSensitiveValue } = require('../utils/privacy');
const { createNotification } = require('./notification.service');

const LOCK_MINUTES = parseInt(process.env.BOOKING_LOCK_MINUTES || '15', 10);
const MAX_SEATS = parseInt(process.env.MAX_SEATS_PER_BOOKING || '5', 10);
const MIN_BOOKING_LEAD_MINUTES = parseInt(process.env.MIN_BOOKING_LEAD_MINUTES || '15', 10);
const CANCELLATION_DEADLINE_DAYS = 3;
const CUSTOMER_REFUND_RATE = 0.9;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Khóa ghế tạm thời (QD_BOOK_01)
 * Dùng Redis để đảm bảo race-condition safe
 */
const lockSeats = async (tripId, seatIds, customerId) => {
  // Kiểm tra giới hạn số ghế (QD_BOOK_03)
  if (seatIds.length > MAX_SEATS) {
    throw new Error(`Chỉ được đặt tối đa ${MAX_SEATS} ghế trên một chuyến.`);
  }

  const minDepartureTime = new Date(Date.now() + MIN_BOOKING_LEAD_MINUTES * 60 * 1000);
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      status: 'SCHEDULED',
      departureTime: { gt: minDepartureTime },
      route: { isActive: true, operator: { isApproved: true, user: { isActive: true } } },
      vehicle: { isActive: true },
    },
    select: { id: true },
  });
  if (!trip) {
    throw new Error('Chuyến xe không còn nhận đặt vé.');
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
    await prisma.tripSeat.updateMany({
      where: { id: { in: seatIds }, tripId, status: 'PROCESSING', lockedBy: customerId },
      data: { status: 'AVAILABLE', lockedAt: null, lockedBy: null, lockExpiresAt: null },
    });
    throw new Error('Một hoặc nhiều ghế không còn khả dụng. Vui lòng chọn lại.');
  }

  // Broadcast realtime seat status change
  getIo()?.to(`trip:${tripId}`).emit('seats:updated', {
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

  getIo()?.to(`trip:${tripId}`).emit('seats:updated', { seatIds, status: 'AVAILABLE' });
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
    getIo()?.to(`trip:${tripId}`).emit('seats:updated', { seatIds: ids, status: 'AVAILABLE' });
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
      where: {
        id: { in: seatIds },
        tripId,
        lockedBy: customerId,
        status: 'PROCESSING',
        trip: {
          status: 'SCHEDULED',
          departureTime: { gt: new Date(Date.now() + MIN_BOOKING_LEAD_MINUTES * 60 * 1000) },
          route: { isActive: true, operator: { isApproved: true, user: { isActive: true } } },
          vehicle: { isActive: true },
        },
      },
      include: { trip: true },
    });

    if (seats.length !== seatIds.length) {
      throw new Error('Phiên giữ chỗ đã hết hạn hoặc chuyến xe không còn nhận đặt vé. Vui lòng đặt lại.');
    }

    const activeTickets = await tx.ticketDetail.findMany({
      where: {
        tripSeatId: { in: seatIds },
        status: { in: activeTicketStatuses },
      },
      select: { tripSeatId: true },
    });

    if (activeTickets.length > 0) {
      throw new Error('Mot so ghe da co ve dang hieu luc. Vui long chon ghe khac.');
    }

    const unitPrice = Number(seats[0].trip.basePrice);
    const totalAmount = unitPrice * seatIds.length;
    const isCashPayment = paymentMethod === 'CASH';

    // Create Order
    const orderId = crypto.randomUUID();
    const order = await tx.order.create({
      data: {
        id: orderId,
        publicCode: createPublicCode('HD', orderId),
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

      const ticketId = crypto.randomUUID();
      const publicCode = createPublicCode('VE', ticketId);
      const qrData = createQrPayload({ ticketId, ticketCode: publicCode, tripId, seatId });
      const qrCode = await QRCode.toDataURL(qrData);

      const ticket = await tx.ticketDetail.create({
        data: {
          id: ticketId,
          publicCode,
          orderId: order.id,
          tripSeatId: seatId,
          passengerName: encryptSensitiveValue(passenger.name.trim()),
          passengerPhone: encryptSensitiveValue(passenger.phone.trim()),
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
      getIo()?.to(`trip:${tripId}`).emit('seats:updated', { seatIds, status: 'BOOKED' });
    }

    return { order, tickets };
  });
};

/**
 * Hủy vé và hoàn tiền theo chính sách nhà xe.
 * Vé đã thanh toán chỉ được hủy trước giờ khởi hành tối thiểu 3 ngày.
 * Vé đã thanh toán được hoàn 90%.
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

  const now = new Date();
  const cancellationDeadline = new Date(ticket.tripSeat.trip.departureTime.getTime() - CANCELLATION_DEADLINE_DAYS * MS_PER_DAY);
  if (ticket.status === 'PAID' && now > cancellationDeadline) {
    throw new Error(`Vé chỉ được hủy trước giờ khởi hành ít nhất ${CANCELLATION_DEADLINE_DAYS} ngày.`);
  }
  if (ticket.status === 'PENDING' && ticket.tripSeat.trip.departureTime <= now) {
    throw new Error('Không thể hủy vé sau giờ khởi hành.');
  }

  const refundRate = ticket.status === 'PAID' ? CUSTOMER_REFUND_RATE : 0;
  const refundAmount = Math.floor(Number(ticket.price) * refundRate);
  const finalTicketStatus = ticket.status === 'PAID' ? 'REFUNDED' : 'CANCELLED';

  await prisma.$transaction(async (tx) => {
    await tx.ticketDetail.update({
      where: { id: ticketId },
      data: {
        status: finalTicketStatus,
        cancelledAt: new Date(),
        cancelReason: 'Khách hàng hủy vé',
      },
    });

    await tx.tripSeat.update({
      where: { id: ticket.tripSeatId },
      data: { status: 'AVAILABLE', lockedBy: null, lockedAt: null, lockExpiresAt: null },
    });

    const remainingActiveTickets = await tx.ticketDetail.count({
      where: {
        orderId: ticket.orderId,
        id: { not: ticketId },
        status: { in: [...activeTicketStatuses, 'COMPLETED'] },
      },
    });
    if (remainingActiveTickets === 0) {
      await tx.order.update({
        where: { id: ticket.orderId },
        data: { status: finalTicketStatus },
      });
    }

    if (ticket.status === 'PAID' && refundAmount > 0) {
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

  await redisClient.del(`seat_lock:${ticket.tripSeat.tripId}:${ticket.tripSeatId}`);
  getIo()?.to(`trip:${ticket.tripSeat.tripId}`).emit('seats:updated', {
    seatIds: [ticket.tripSeatId],
    status: 'AVAILABLE',
  });

  await createNotification({
    userId: ticket.order.customer.userId,
    title: ticket.status === 'PAID' ? 'Hủy vé thành công' : 'Đã hủy vé chờ thanh toán',
    message: refundAmount > 0
      ? `Vé của bạn đã được hủy. Số tiền hoàn lại là ${refundAmount.toLocaleString('vi-VN')}đ (${CUSTOMER_REFUND_RATE * 100}%).`
      : 'Vé chờ thanh toán đã được hủy và ghế đã được giải phóng.',
    type: ticket.status === 'PAID' ? 'REFUND' : 'BOOKING',
    link: '/my-tickets',
    metadata: { ticketId, orderId: ticket.orderId, refundAmount },
  });

  return {
    refundAmount,
    refundRate,
    cancellationDeadline,
    policy: {
      deadlineDays: CANCELLATION_DEADLINE_DAYS,
      refundPercent: CUSTOMER_REFUND_RATE * 100,
    },
  };
};

module.exports = { lockSeats, releaseSeats, releaseExpiredSeatLocks, confirmBooking, cancelTicket };
