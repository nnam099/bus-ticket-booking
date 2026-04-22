const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Dữ liệu đã tồn tại. Vui lòng kiểm tra lại thông tin.',
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu.' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Lỗi hệ thống. Vui lòng thử lại sau.';

  res.status(status).json({ success: false, message });
};

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
