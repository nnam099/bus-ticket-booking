const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Bạn đã đăng nhập sai hoặc thử quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: { success: false, message: 'Bạn đã yêu cầu gửi mã OTP quá nhiều lần. Vui lòng thử lại sau 5 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: 'Bạn đã thực hiện quá nhiều thao tác đặt vé/giữ ghế. Vui lòng thử lại sau 1 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, otpLimiter, bookingLimiter };
