const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { decryptTickets } = require('../utils/privacy');

router.get('/me', authenticate, async (req, res) => {
  const user = { ...req.user };
  delete user.passwordHash;
  res.json({ success: true, data: user });
});

router.put('/me', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { fullName, dateOfBirth, avatarUrl, phone } = req.body;
    if (!req.user.customer?.id) {
      return res.status(403).json({ success: false, message: 'Chi khach hang moi co the cap nhat ho so ca nhan.' });
    }
    if (fullName !== undefined && (!String(fullName).trim() || String(fullName).length > 100)) {
      return res.status(400).json({ success: false, message: 'Ho ten khong hop le.' });
    }
    if (phone !== undefined && phone !== '' && typeof phone !== 'string') {
      return res.status(400).json({ success: false, message: 'So dien thoai khong hop le.' });
    }
    const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    if (dateOfBirth && Number.isNaN(parsedDateOfBirth.getTime())) {
      return res.status(400).json({ success: false, message: 'Ngay sinh khong hop le.' });
    }
    await prisma.$transaction([
      prisma.customer.update({
        where: { userId: req.user.id },
        data: { fullName, dateOfBirth: parsedDateOfBirth, avatarUrl },
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
    res.json({ success: true, message: 'Cap nhat thong tin thanh cong.', data });
  } catch (err) { next(err); }
});

router.put('/me/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mat khau moi phai co it nhat 6 ky tu.' });
    }
    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) return res.status(400).json({ success: false, message: 'Mat khau hien tai khong dung.' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ success: true, message: 'Doi mat khau thanh cong.' });
  } catch (err) { next(err); }
});

router.get('/me/tickets', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const customerId = req.user.customer?.id;
    if (!customerId) {
      return res.status(403).json({ success: false, message: 'Chi khach hang moi co the xem ve ca nhan.' });
    }
    const tickets = await prisma.ticketDetail.findMany({
      where: { order: { customerId } },
      include: {
        tripSeat: { include: { trip: { include: { route: true } }, seatLayout: true } },
        order: true,
        review: { select: { id: true, rating: true, isApproved: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: decryptTickets(tickets) });
  } catch (err) { next(err); }
});

router.delete('/me', authenticate, async (req, res, next) => {
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { customer: { select: { id: true } } },
      });

      if (user?.customer?.id) {
        await tx.customer.update({
          where: { id: user.customer.id },
          data: {
            fullName: 'Anonymized user',
            dateOfBirth: null,
            avatarUrl: null,
          },
        });
        await tx.ticketDetail.updateMany({
          where: { order: { customerId: user.customer.id } },
          data: { passengerName: 'Anonymized passenger', passengerPhone: null },
        });
        await tx.review.updateMany({
          where: { customerId: user.customer.id },
          data: { comment: null },
        });
      }

      await tx.auditLog.updateMany({
        where: { userId: req.user.id },
        data: { ipAddress: null, userAgent: null, details: null },
      });

      await tx.user.update({
        where: { id: req.user.id },
        data: {
          isActive: false,
          isAnonymized: true,
          email: null,
          phone: null,
          passwordHash: 'ANONYMIZED',
        },
      });
    });
    res.json({ success: true, message: 'Tai khoan da duoc xoa.' });
  } catch (err) { next(err); }
});

module.exports = router;
