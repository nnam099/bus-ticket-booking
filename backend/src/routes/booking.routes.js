const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const bookingController = require('../controllers/booking.controller');
const { bookingLimiter } = require('../middlewares/rateLimiter');

router.use(authenticate, authorize('CUSTOMER'));

// POST /api/bookings/lock - Khóa ghế tạm thời (QD_BOOK_01)
router.post('/lock', bookingLimiter, bookingController.lockSeats);

// POST /api/bookings/release - Giải phóng ghế (hủy giữ chỗ)
router.post('/release', bookingController.releaseSeats);

// POST /api/bookings/confirm - Xác nhận đặt vé sau thanh toán
router.post('/confirm', bookingLimiter, bookingController.confirmBooking);

// DELETE /api/bookings/tickets/:ticketId - Hủy vé
router.delete('/tickets/:ticketId', bookingController.cancelTicket);

module.exports = router;
