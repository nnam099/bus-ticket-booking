const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const otplib = require('otplib');
const { redisClient } = require('../config/redis');
const { sendOtpEmail } = require('../services/email.service');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Đăng ký khách hàng mới
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, phone, password, fullName } = req.body;

    // Check duplicate email/phone (QD_ACC_01)
    const existing = await prisma.user.findFirst({
      where: { OR: [email ? { email } : {}, phone ? { phone } : {}] },
    });
    if (existing) return res.status(409).json({ success: false, message: 'Email hoặc số điện thoại đã được sử dụng.' });

    const passwordHash = await bcrypt.hash(password, 12);

    const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        userRoles: { create: { roleId: customerRole.id } },
        customer: { create: { fullName } },
      },
      include: { customer: true, userRoles: { include: { role: true } } },
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      data: { token, user: formatUser(user) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, phone, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { OR: [email ? { email } : {}, phone ? { phone } : {}] },
      include: { userRoles: { include: { role: true } }, customer: true, busOperator: true, staff: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Email/SĐT hoặc mật khẩu không đúng.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: { token, user: formatUser(user) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/send-otp
 * Gửi OTP qua email/SMS
 */
const sendOtp = async (req, res, next) => {
  try {
    const { identifier, purpose } = req.body; // identifier = email or phone

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await prisma.otpCode.create({
      data: { userId: user.id, code, purpose, expiresAt },
    });

    // Cache in Redis for quick lookup
    await redisClient.setEx(`otp:${user.id}:${purpose}`, 300, code);

    // Send via email (if email)
    if (user.email && identifier === user.email) {
      await sendOtpEmail(user.email, code, purpose);
    }

    res.json({ success: true, message: 'Mã OTP đã được gửi.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { userId, code, purpose } = req.body;

    const cached = await redisClient.get(`otp:${userId}:${purpose}`);
    if (!cached || cached !== code) {
      return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    await redisClient.del(`otp:${userId}:${purpose}`);

    res.json({ success: true, message: 'Xác thực OTP thành công.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });
    // Always return 200 to prevent user enumeration
    if (user) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await redisClient.setEx(`otp:${user.id}:RESET_PASSWORD`, 300, code);
      if (user.email) await sendOtpEmail(user.email, code, 'RESET_PASSWORD');
    }
    res.json({ success: true, message: 'Nếu tài khoản tồn tại, OTP đã được gửi.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { userId, code, newPassword } = req.body;

    const cached = await redisClient.get(`otp:${userId}:RESET_PASSWORD`);
    if (!cached || cached !== code) {
      return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    await redisClient.del(`otp:${userId}:RESET_PASSWORD`);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công.' });
  } catch (err) {
    next(err);
  }
};

// Helpers
function generateToken(user) {
  const roles = user.userRoles?.map((ur) => ur.role.name) || [];
  return jwt.sign(
    { userId: user.id, roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function formatUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

module.exports = { register, login, sendOtp, verifyOtp, forgotPassword, resetPassword };
