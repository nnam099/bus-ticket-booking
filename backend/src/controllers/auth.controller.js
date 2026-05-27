const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');
const { redisClient } = require('../config/redis');
const { sendOtpEmail } = require('../services/email.service');
const { hashOtp, otpPurposes, timingSafeEqualString } = require('../utils/security');

const OTP_TTL_SECONDS = 5 * 60;
const MAX_OTP_ATTEMPTS = 5;

const generateOtpCode = () => crypto.randomInt(100000, 1000000).toString();

const buildIdentifierWhere = ({ identifier, email, phone }) => {
  const normalized = identifier?.trim();
  const clauses = [];
  if (email) clauses.push({ email });
  if (phone) clauses.push({ phone });
  if (normalized) clauses.push(normalized.includes('@') ? { email: normalized } : { phone: normalized });
  return clauses;
};

const findUserByIdentifier = async ({ identifier, email, phone }) => {
  const OR = buildIdentifierWhere({ identifier, email, phone });
  if (!OR.length) return null;
  return prisma.user.findFirst({ where: { OR } });
};

const incrementOtpAttempt = async (userId, purpose) => {
  const attemptsKey = `otp_attempts:${userId}:${purpose}`;
  const attempts = await redisClient.incr(attemptsKey);
  if (attempts === 1) await redisClient.expire(attemptsKey, OTP_TTL_SECONDS);
  return attempts;
};

const ensureOtpAttemptsAllowed = async (userId, purpose) => {
  const attempts = Number(await redisClient.get(`otp_attempts:${userId}:${purpose}`) || 0);
  return attempts < MAX_OTP_ATTEMPTS;
};

const consumeOtp = async ({ userId, purpose, code }) => {
  if (!otpPurposes.includes(purpose)) {
    const error = new Error('Muc dich OTP khong hop le.');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  if (!(await ensureOtpAttemptsAllowed(userId, purpose))) {
    const error = new Error('Ban da nhap sai OTP qua nhieu lan. Vui long yeu cau ma moi.');
    error.statusCode = 429;
    error.isOperational = true;
    throw error;
  }

  const cached = await redisClient.get(`otp:${userId}:${purpose}`);
  const submittedHash = hashOtp(userId, purpose, code);
  if (!cached || !timingSafeEqualString(cached, submittedHash)) {
    await incrementOtpAttempt(userId, purpose);
    const error = new Error('Ma OTP khong hop le hoac da het han.');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  await redisClient.del(`otp:${userId}:${purpose}`);
  await redisClient.del(`otp_attempts:${userId}:${purpose}`);
  await prisma.otpCode.updateMany({
    where: { userId, purpose, code: submittedHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
};

const issueOtp = async ({ user, identifier, purpose }) => {
  const code = generateOtpCode();
  const codeHash = hashOtp(user.id, purpose, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  await prisma.otpCode.create({
    data: { userId: user.id, code: codeHash, purpose, expiresAt },
  });
  await redisClient.setEx(`otp:${user.id}:${purpose}`, OTP_TTL_SECONDS, codeHash);
  await redisClient.del(`otp_attempts:${user.id}:${purpose}`);

  if (user.email && (!identifier || identifier === user.email)) {
    await sendOtpEmail(user.email, code, purpose);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, phone, password, fullName } = req.body;
    const existing = await prisma.user.findFirst({ where: { OR: buildIdentifierWhere({ email, phone }) } });
    if (existing) return res.status(409).json({ success: false, message: 'Email hoac so dien thoai da duoc su dung.' });

    const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
    if (!customerRole) {
      return res.status(500).json({ success: false, message: 'CUSTOMER role is not initialized. Please run seed.' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash: await bcrypt.hash(password, 12),
        userRoles: { create: { roleId: customerRole.id } },
        customer: { create: { fullName } },
      },
      include: { customer: true, userRoles: { include: { role: true } } },
    });

    res.cookie('token', generateToken(user), cookieOptions());
    res.status(201).json({ success: true, message: 'Dang ky thanh cong!', data: { user: formatUser(user) } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { identifier, email, phone, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { OR: buildIdentifierWhere({ identifier, email, phone }) },
      include: { userRoles: { include: { role: true } }, customer: true, busOperator: true, staff: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Email/SDT hoac mat khau khong dung.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tai khoan da bi khoa. Vui long lien he ho tro.' });
    }

    res.cookie('token', generateToken(user), cookieOptions());
    res.json({ success: true, message: 'Dang nhap thanh cong!', data: { user: formatUser(user) } });
  } catch (err) {
    next(err);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const { identifier, purpose } = req.body;
    if (!otpPurposes.includes(purpose)) {
      return res.status(400).json({ success: false, message: 'Muc dich OTP khong hop le.' });
    }

    const user = await findUserByIdentifier({ identifier });
    if (!user) return res.status(404).json({ success: false, message: 'Khong tim thay tai khoan.' });

    await issueOtp({ user, identifier, purpose });
    res.json({ success: true, message: 'Ma OTP da duoc gui.' });
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { userId, identifier, code, purpose } = req.body;
    const user = userId ? { id: userId } : await findUserByIdentifier({ identifier });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    await consumeOtp({ userId: user.id, purpose, code });
    res.json({ success: true, message: 'Xac thuc OTP thanh cong.' });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const user = await findUserByIdentifier({ identifier });
    if (user) await issueOtp({ user, identifier, purpose: 'RESET_PASSWORD' });
    res.json({ success: true, message: 'Neu tai khoan ton tai, OTP da duoc gui.' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { userId, identifier, code, newPassword } = req.body;
    const user = userId ? { id: userId } : await findUserByIdentifier({ identifier });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    await consumeOtp({ userId: user.id, purpose: 'RESET_PASSWORD', code });
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });

    res.json({ success: true, message: 'Dat lai mat khau thanh cong.' });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.json({ success: true, message: 'Dang xuat thanh cong.' });
};

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function generateToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }
  const roles = user.userRoles?.map((ur) => ur.role.name) || [];
  return jwt.sign(
    { userId: user.id, roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function formatUser(user) {
  const rest = { ...user };
  delete rest.passwordHash;
  return rest;
}

module.exports = { register, login, sendOtp, verifyOtp, forgotPassword, resetPassword, logout };
