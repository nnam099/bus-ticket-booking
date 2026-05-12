const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// GET /api/auth/csrf
router.get('/csrf', authController.getCsrfToken);

// POST /api/auth/register
router.post(
  '/register',
  [
    body().custom((_, { req }) => {
      if (!req.body.email && !req.body.phone) {
        throw new Error('Email hoặc số điện thoại là bắt buộc.');
      }
      return true;
    }),
    body('fullName').notEmpty().withMessage('Họ tên không được để trống.'),
    body('email').optional().isEmail().withMessage('Email không hợp lệ.'),
    body('phone').optional().isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Mật khẩu phải có ít nhất 8 ký tự.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
      .withMessage('Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.'),
  ],
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body().custom((_, { req }) => {
      if (!req.body.email && !req.body.phone) {
        throw new Error('Email hoặc số điện thoại là bắt buộc.');
      }
      return true;
    }),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống.'),
  ],
  authController.login
);

// POST /api/auth/send-otp
router.post(
  '/send-otp',
  [
    body('identifier').notEmpty().withMessage('Email hoặc số điện thoại là bắt buộc.'),
    body('purpose')
      .notEmpty()
      .withMessage('Mục đích OTP là bắt buộc.')
      .isIn(['REGISTER', 'RESET_PASSWORD', 'DELETE_ACCOUNT', 'PAYMENT'])
      .withMessage('Mục đích OTP không hợp lệ.'),
  ],
  authController.sendOtp
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  [
    body('userId').isUUID().withMessage('UserId không hợp lệ.'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('Mã OTP phải đủ 6 ký tự.')
      .matches(/^\d{6}$/)
      .withMessage('Mã OTP không hợp lệ.'),
    body('purpose')
      .notEmpty()
      .withMessage('Mục đích OTP là bắt buộc.')
      .isIn(['REGISTER', 'RESET_PASSWORD', 'DELETE_ACCOUNT', 'PAYMENT'])
      .withMessage('Mục đích OTP không hợp lệ.'),
  ],
  authController.verifyOtp
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [
    body('identifier').notEmpty().withMessage('Email hoặc số điện thoại là bắt buộc.'),
  ],
  authController.forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('userId').isUUID().withMessage('UserId không hợp lệ.'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('Mã OTP phải đủ 6 ký tự.')
      .matches(/^\d{6}$/)
      .withMessage('Mã OTP không hợp lệ.'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
      .withMessage('Mật khẩu mới phải có chữ hoa, chữ thường, số và ký tự đặc biệt.'),
  ],
  authController.resetPassword
);

module.exports = router;
