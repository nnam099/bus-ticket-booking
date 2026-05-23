const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống.'),
    body('email').trim().optional({ checkFalsy: true }).isEmail().withMessage('Email không hợp lệ.'),
    body('phone').trim().optional({ checkFalsy: true }).isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ.'),
    body().custom((_, { req }) => {
      if (!req.body.email && !req.body.phone) throw new Error('Vui long nhap email hoac so dien thoai.');
      return true;
    }),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự.'), // QD_ACC_02
  ],
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('identifier').trim().optional({ checkFalsy: true }).isString(),
    body('email').trim().optional({ checkFalsy: true }).isString(),
    body('phone').trim().optional({ checkFalsy: true }).isString(),
    body().custom((_, { req }) => {
      if (!req.body.identifier && !req.body.email && !req.body.phone) throw new Error('Vui long nhap email hoac so dien thoai.');
      return true;
    }),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống.'),
  ],
  authController.login
);

// POST /api/auth/send-otp
router.post('/send-otp', authController.sendOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự.'),
  ],
  authController.resetPassword
);

module.exports = router;
