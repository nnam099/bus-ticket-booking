const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const otplib = require('otplib');
const { redisClient } = require('../config/redis');
const { sendOtpEmail } = require('../services/email.service');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const OTP_ATTEMPT_WINDOW_SECONDS = parseInt(process.env.OTP_ATTEMPT_WINDOW_SECONDS || '600', 10);
const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = parseInt(process.env.ACCESS_TOKEN_COOKIE_MAX_AGE_MS || '604800000', 10);
const CSRF_COOKIE_MAX_AGE_MS = parseInt(process.env.CSRF_COOKIE_MAX_AGE_MS || '86400000', 10);

const isProduction = process.env.NODE_ENV === 'production';

const getOtpAttemptsKey = (userId, purpose) => `otp_attempts:${userId}:${purpose}`;

const incrementOtpAttempts = async (userId, purpose) => {
  const attemptsKey = getOtpAttemptsKey(userId, purpose);
  const attempts = await redisClient.incr(attemptsKey);
  if (attempts === 1) {
    await redisClient.expire(attemptsKey, OTP_ATTEMPT_WINDOW_SECONDS);
  }
  return attempts;
};

const clearOtpAttempts = async (userId, purpose) => {
  await redisClient.del(getOtpAttemptsKey(userId, purpose));
};

const setAuthCookie = (res, token) => {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
    path: '/',
  });
};

const setCsrfCookie = (res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: CSRF_COOKIE_MAX_AGE_MS,
    path: '/',
  });
  return token;
};

/**
 * POST /api/auth/register
 * Đăng ký khách hàng mới
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, phone, password, fullName } = req.body;

    const orConditions = [];
    if (email) orConditions.push({ email });
    if (phone) orConditions.push({ phone });
    if (orConditions.length === 0) {
      return res.status(400).json({ success: false, message: 'Email hoặc số điện thoại là bắt buộc.' });
    }

    // Check duplicate email/phone (QD_ACC_01)
    const existing = await prisma.user.findFirst({
      where: { OR: orConditions },
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

    setAuthCookie(res, token);
    setCsrfCookie(res);

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

    const orConditions = [];
    if (email) orConditions.push({ email });
    if (phone) orConditions.push({ phone });
    if (orConditions.length === 0) {
      return res.status(400).json({ success: false, message: 'Email hoặc số điện thoại là bắt buộc.' });
    }

    const user = await prisma.user.findFirst({
      where: { OR: orConditions },
      include: { userRoles: { include: { role: true } }, customer: true, busOperator: true, staff: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Email/SĐT hoặc mật khẩu không đúng.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.' });
    }

    const token = generateToken(user);

    setAuthCookie(res, token);
    setCsrfCookie(res);

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { identifier, purpose } = req.body; // identifier = email or phone

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });
    if (!user) {
      return res.json({ success: true, message: 'Nếu tài khoản tồn tại, OTP đã được gửi.' });
    }

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

    res.json({ success: true, message: 'Nếu tài khoản tồn tại, OTP đã được gửi.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { userId, code, purpose } = req.body;

    const attempts = await incrementOtpAttempts(userId, purpose);
    if (attempts > OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.' });
    }

    const cached = await redisClient.get(`otp:${userId}:${purpose}`);
    if (!cached || cached !== code) {
      return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    await redisClient.del(`otp:${userId}:${purpose}`);
    await clearOtpAttempts(userId, purpose);

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { userId, code, newPassword } = req.body;

    const attempts = await incrementOtpAttempts(userId, 'RESET_PASSWORD');
    if (attempts > OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.' });
    }

    const cached = await redisClient.get(`otp:${userId}:RESET_PASSWORD`);
    if (!cached || cached !== code) {
      return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    await redisClient.del(`otp:${userId}:RESET_PASSWORD`);
    await clearOtpAttempts(userId, 'RESET_PASSWORD');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/csrf
 * Issue CSRF cookie for SPA clients
 */
const getCsrfToken = async (req, res, next) => {
  try {
    const token = setCsrfCookie(res);
    res.json({ success: true, data: { csrfToken: token } });
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

module.exports = { register, login, sendOtp, verifyOtp, forgotPassword, resetPassword, getCsrfToken };
