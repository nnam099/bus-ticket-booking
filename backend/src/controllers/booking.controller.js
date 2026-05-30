const { lockSeats: lockSeatsService, releaseSeats: releaseSeatsService, confirmBooking: confirmBookingService, cancelTicket: cancelTicketService } = require('../services/booking.service');
const { decryptTickets } = require('../utils/privacy');

const isValidSeatRequest = (tripId, seatIds) => (
  typeof tripId === 'string'
  && tripId.trim()
  && Array.isArray(seatIds)
  && seatIds.length > 0
  && new Set(seatIds).size === seatIds.length
  && seatIds.every((id) => typeof id === 'string' && id.trim())
);

const isValidVietnamPhone = (phone) => /^0\d{9}$/.test(String(phone || '').trim());

const lockSeats = async (req, res, next) => {
  try {
    const { tripId, seatIds } = req.body;
    const customerId = req.user.customer?.id;
    if (!customerId) return res.status(403).json({ success: false, message: 'Chỉ khách hàng mới có thể đặt vé.' });
    if (!isValidSeatRequest(tripId, seatIds)) {
      return res.status(400).json({ success: false, message: 'Thông tin giữ ghế không hợp lệ.' });
    }

    const result = await lockSeatsService(tripId, seatIds, customerId);
    res.json({ success: true, message: `Giữ chỗ thành công. Bạn có ${process.env.BOOKING_LOCK_MINUTES || 15} phút để hoàn tất thanh toán.`, data: result });
  } catch (err) {
    if (err.message.includes('đã được')) return res.status(409).json({ success: false, message: err.message });
    if (err.message.includes('tối đa')) return res.status(400).json({ success: false, message: err.message });
    next(err);
  }
};

const releaseSeats = async (req, res, next) => {
  try {
    const { tripId, seatIds } = req.body;
    const customerId = req.user.customer?.id;
    if (!isValidSeatRequest(tripId, seatIds)) {
      return res.status(400).json({ success: false, message: 'Thông tin hủy giữ chỗ không hợp lệ.' });
    }
    await releaseSeatsService(tripId, seatIds, customerId);
    res.json({ success: true, message: 'Đã hủy giữ chỗ.' });
  } catch (err) {
    next(err);
  }
};

const confirmBooking = async (req, res, next) => {
  try {
    const { tripId, seatIds, passengerInfo, paymentMethod } = req.body;
    const customerId = req.user.customer?.id;
    const validPaymentMethods = ['E_WALLET', 'BANK_CARD', 'BANK_TRANSFER'];
    const validPassengers = Array.isArray(passengerInfo)
      && passengerInfo.length === seatIds?.length
      && passengerInfo.every((p) => (
        p
        && typeof p.name === 'string'
        && p.name.trim()
        && isValidVietnamPhone(p.phone)
      ));

    if (!isValidSeatRequest(tripId, seatIds) || !validPassengers || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Thông tin đặt vé không hợp lệ. Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.' });
    }

    const result = await confirmBookingService({ customerId, tripId, seatIds, passengerInfo, paymentMethod });
    result.tickets = decryptTickets(result.tickets);
    res.status(201).json({ success: true, message: 'Đặt vé thành công!', data: result });
  } catch (err) {
    if (err.message.includes('hết hạn')) return res.status(410).json({ success: false, message: err.message });
    next(err);
  }
};

const cancelTicket = async (req, res, next) => {
  try {
    const customerId = req.user.customer?.id;
    const result = await cancelTicketService(req.params.ticketId, customerId);
    res.json({
      success: true,
      message: result.refundAmount > 0
        ? `Hủy vé thành công. Hoàn tiền: ${result.refundAmount.toLocaleString('vi-VN')}đ (${result.policy.refundPercent}%).`
        : 'Hủy vé thành công. Vé chưa thanh toán nên không phát sinh hoàn tiền.',
      data: result,
    });
  } catch (err) {
    if (
      err.message.includes('không có quyền')
      || err.message.includes('không thể hủy')
      || err.message.includes('chỉ được hủy')
    ) {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
};

module.exports = { lockSeats, releaseSeats, confirmBooking, cancelTicket };
