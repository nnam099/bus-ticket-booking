// user.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

// GET /api/users/me
router.get('/me', authenticate, async (req, res) => {
  const user = { ...req.user };
  delete user.passwordHash;
  res.json({ success: true, data: user });
});

// PUT /api/users/me
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { fullName, dateOfBirth, avatarUrl, phone } = req.body;
    await prisma.$transaction([
      prisma.customer.update({
        where: { userId: req.user.id },
        data: { fullName, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, avatarUrl },
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: { phone: phone === '' ? null : phone },
      }),
    ]);
    const updated = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { customer: true, userRoles: { include: { role: true } } },
    });
    const data = { ...updated };
    delete data.passwordHash;
    res.json({ success: true, message: 'Cập nhật thông tin thành công.', data });
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
router.get('/me/tickets', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const customerId = req.user.customer?.id;
    if (!customerId) {
      return res.status(403).json({ success: false, message: 'Chỉ khách hàng mới có thể xem vé cá nhân.' });
    }
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
