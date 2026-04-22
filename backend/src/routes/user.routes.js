// user.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middlewares/auth.middleware');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// GET /api/users/me
router.get('/me', authenticate, async (req, res) => {
  const { passwordHash, ...user } = req.user;
  res.json({ success: true, data: user });
});

// PUT /api/users/me
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { fullName, dateOfBirth, avatarUrl } = req.body;
    await prisma.customer.update({
      where: { userId: req.user.id },
      data: { fullName, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, avatarUrl },
    });
    res.json({ success: true, message: 'Cập nhật thông tin thành công.' });
  } catch (err) { next(err); }
});

// PUT /api/users/me/password
router.put('/me/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (err) { next(err); }
});

// GET /api/users/me/tickets
router.get('/me/tickets', authenticate, async (req, res, next) => {
  try {
    const customerId = req.user.customer?.id;
    const tickets = await prisma.ticketDetail.findMany({
      where: { order: { customerId } },
      include: {
        tripSeat: { include: { trip: { include: { route: true } }, seatLayout: true } },
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
});

// DELETE /api/users/me - Xóa tài khoản (anonymize) - QD_ACC_04
router.delete('/me', authenticate, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isActive: false,
        isAnonymized: true,
        email: null,
        phone: null,
        passwordHash: 'ANONYMIZED',
      },
    });
    res.json({ success: true, message: 'Tài khoản đã được xóa.' });
  } catch (err) { next(err); }
});

module.exports = router;
