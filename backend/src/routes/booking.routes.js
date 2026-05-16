const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const bookingController = require('../controllers/booking.controller');

// POST /api/bookings/lock - Khóa ghế tạm thời (QD_BOOK_01)
router.post('/lock', authenticate, authorize('CUSTOMER'), bookingController.lockSeats);

// POST /api/bookings/release - Giải phóng ghế (hủy giữ chỗ)
router.post('/release', authenticate, authorize('CUSTOMER'), bookingController.releaseSeats);

// POST /api/bookings/confirm - Xác nhận đặt vé sau thanh toán
router.post('/confirm', authenticate, authorize('CUSTOMER'), bookingController.confirmBooking);

// DELETE /api/bookings/tickets/:ticketId - Hủy vé
router.delete('/tickets/:ticketId', authenticate, authorize('CUSTOMER'), bookingController.cancelTicket);

module.exports = router;
