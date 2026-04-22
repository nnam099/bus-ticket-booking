// admin.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const prisma = new PrismaClient();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /api/admin/operators/pending - Nhà xe chờ duyệt
router.get('/operators/pending', async (req, res, next) => {
  try {
    const operators = await prisma.busOperator.findMany({
      where: { isApproved: false },
      include: { user: { select: { email: true, phone: true } } },
    });
    res.json({ success: true, data: operators });
  } catch (err) { next(err); }
});

// PATCH /api/admin/operators/:id/approve - Phê duyệt nhà xe
router.patch('/operators/:id/approve', async (req, res, next) => {
  try {
    const op = await prisma.busOperator.update({
      where: { id: req.params.id },
      data: { isApproved: true, approvedAt: new Date(), approvedBy: req.user.id },
    });
    res.json({ success: true, data: op });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/toggle-active - Khóa/mở khóa tài khoản
router.patch('/users/:id/toggle-active', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
    });
    res.json({ success: true, data: { id: updated.id, isActive: updated.isActive } });
  } catch (err) { next(err); }
});

// GET /api/admin/stats - Thống kê hệ thống
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalOperators, totalTrips, totalRevenue] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.busOperator.count({ where: { isApproved: true } }),
      prisma.trip.count(),
      prisma.ticketDetail.aggregate({ _sum: { price: true }, where: { status: { in: ['PAID', 'COMPLETED'] } } }),
    ]);
    res.json({ success: true, data: { totalUsers, totalOperators, totalTrips, totalRevenue: totalRevenue._sum.price || 0 } });
  } catch (err) { next(err); }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const logs = await prisma.auditLog.findMany({
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, phone: true } } },
    });
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
});

// GET /api/admin/reviews/pending - Kiểm duyệt đánh giá
router.get('/reviews/pending', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: false },
      include: { customer: { select: { fullName: true } } },
    });
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
});

// PATCH /api/admin/reviews/:id/approve
router.patch('/reviews/:id/approve', async (req, res, next) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: true, approvedBy: req.user.id },
    });
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
});

module.exports = router;
