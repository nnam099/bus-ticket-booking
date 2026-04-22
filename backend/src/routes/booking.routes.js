const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { lockSeats, releaseSeats, confirmBooking, cancelTicket } = require('../services/booking.service');

// POST /api/bookings/lock - Khóa ghế tạm thời (QD_BOOK_01)
router.post('/lock', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { tripId, seatIds } = req.body;
    const customerId = req.user.customer?.id;
    if (!customerId) return res.status(403).json({ success: false, message: 'Chỉ khách hàng mới có thể đặt vé.' });

    const result = await lockSeats(tripId, seatIds, customerId);
    res.json({ success: true, message: `Giữ chỗ thành công. Bạn có ${process.env.BOOKING_LOCK_MINUTES || 15} phút để hoàn tất thanh toán.`, data: result });
  } catch (err) {
    if (err.message.includes('đã được')) return res.status(409).json({ success: false, message: err.message });
    if (err.message.includes('tối đa')) return res.status(400).json({ success: false, message: err.message });
    next(err);
  }
});

// POST /api/bookings/release - Giải phóng ghế (hủy giữ chỗ)
router.post('/release', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { tripId, seatIds } = req.body;
    await releaseSeats(tripId, seatIds);
    res.json({ success: true, message: 'Đã hủy giữ chỗ.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings/confirm - Xác nhận đặt vé sau thanh toán
router.post('/confirm', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { tripId, seatIds, passengerInfo, totalAmount, paymentMethod } = req.body;
    const customerId = req.user.customer?.id;

    const result = await confirmBooking({ customerId, tripId, seatIds, passengerInfo, totalAmount, paymentMethod });
    res.status(201).json({ success: true, message: 'Đặt vé thành công!', data: result });
  } catch (err) {
    if (err.message.includes('hết hạn')) return res.status(410).json({ success: false, message: err.message });
    next(err);
  }
});

// DELETE /api/bookings/tickets/:ticketId - Hủy vé
router.delete('/tickets/:ticketId', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const customerId = req.user.customer?.id;
    const result = await cancelTicket(req.params.ticketId, customerId);
    res.json({
      success: true,
      message: result.refundAmount > 0
        ? `Hủy vé thành công. Hoàn tiền: ${result.refundAmount.toLocaleString('vi-VN')}đ (${result.refundRate * 100}%)`
        : 'Hủy vé thành công. Không được hoàn tiền do hủy gần giờ khởi hành.',
      data: result,
    });
  } catch (err) {
    if (err.message.includes('không có quyền') || err.message.includes('không thể hủy')) {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
});

module.exports = router;
