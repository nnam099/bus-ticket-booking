// admin.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = require('../config/prisma');

const parsePagination = (query, defaultLimit = 50, maxLimit = 100) => {
  const page = Number.parseInt(query.page, 10) || 1;
  const limit = Number.parseInt(query.limit, 10) || defaultLimit;
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), maxLimit);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

const requestMeta = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /api/admin/operators/pending - Nhà xe chờ duyệt
router.get('/operators/pending', async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const where = { isApproved: false };
    const [operators, total] = await Promise.all([
      prisma.busOperator.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, phone: true } } },
      }),
      prisma.busOperator.count({ where }),
    ]);
    res.json({ success: true, data: operators, meta: { page, limit, total } });
  } catch (err) { next(err); }
});

// PATCH /api/admin/operators/:id/approve - Phê duyệt nhà xe
router.patch('/operators/:id/approve', async (req, res, next) => {
  try {
    const op = await prisma.$transaction(async (tx) => {
      const updated = await tx.busOperator.update({
        where: { id: req.params.id },
        data: { isApproved: true, approvedAt: new Date(), approvedBy: req.user.id },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'APPROVE_OPERATOR',
          resource: 'BusOperator',
          resourceId: updated.id,
          details: { companyName: updated.companyName },
          ...requestMeta(req),
        },
      });

      return updated;
    });
    res.json({ success: true, data: op });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/toggle-active - Khóa/mở khóa tài khoản
router.patch('/users/:id/toggle-active', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản đang đăng nhập.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });

    const isAdmin = user.userRoles.some((ur) => ur.role.name === 'ADMIN');
    if (user.isActive && isAdmin) {
      const activeAdmins = await prisma.user.count({
        where: {
          isActive: true,
          userRoles: { some: { role: { name: 'ADMIN' } } },
        },
      });
      if (activeAdmins <= 1) {
        return res.status(400).json({ success: false, message: 'Không thể khóa admin cuối cùng của hệ thống.' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: req.params.id },
        data: { isActive: !user.isActive },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: result.isActive ? 'UNLOCK_USER' : 'LOCK_USER',
          resource: 'User',
          resourceId: result.id,
          details: { previousIsActive: user.isActive, nextIsActive: result.isActive },
          ...requestMeta(req),
        },
      });

      return result;
    });
    res.json({ success: true, data: { id: updated.id, isActive: updated.isActive } });
  } catch (err) { next(err); }
});

// GET /api/admin/users - Lấy danh sách người dùng
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        isAnonymized: true,
        createdAt: true,
        updatedAt: true,
        userRoles: { include: { role: true } },
        customer: { select: { id: true, fullName: true, avatarUrl: true } },
        busOperator: { select: { id: true, companyName: true, isApproved: true } },
        staff: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

// GET /api/admin/users/:id/tickets - Xem vé/chuyến đã đặt của một user
router.get('/users/:id/tickets', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        phone: true,
        customer: { select: { id: true, fullName: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    }
    if (!user.customer) {
      return res.json({ success: true, data: { user, tickets: [] } });
    }

    const tickets = await prisma.ticketDetail.findMany({
      where: { order: { customerId: user.customer.id } },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            payments: {
              select: { id: true, method: true, gateway: true, status: true, paidAt: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        tripSeat: {
          include: {
            seatLayout: { select: { seatCode: true, floor: true } },
            trip: {
              include: {
                route: {
                  include: {
                    operator: { select: { id: true, companyName: true, hotline: true } },
                  },
                },
                vehicle: {
                  select: {
                    id: true,
                    licensePlate: true,
                    vehicleType: { select: { name: true, seatCount: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { user, tickets } });
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
    const { page, limit, skip } = parsePagination(req.query);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, phone: true } } },
      }),
      prisma.auditLog.count(),
    ]);
    res.json({ success: true, data: logs, meta: { page, limit, total } });
  } catch (err) { next(err); }
});

// GET /api/admin/reviews/pending - Kiểm duyệt đánh giá
router.get('/reviews/pending', async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const where = { isApproved: false };
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { fullName: true } } },
      }),
      prisma.review.count({ where }),
    ]);
    res.json({ success: true, data: reviews, meta: { page, limit, total } });
  } catch (err) { next(err); }
});

// PATCH /api/admin/reviews/:id/approve
router.patch('/reviews/:id/approve', async (req, res, next) => {
  try {
    const review = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: req.params.id },
        data: { isApproved: true, approvedBy: req.user.id },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'APPROVE_REVIEW',
          resource: 'Review',
          resourceId: updated.id,
          details: { rating: updated.rating },
          ...requestMeta(req),
        },
      });

      return updated;
    });
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
});

// DELETE /api/admin/reviews/:id - Từ chối đánh giá chờ duyệt
router.delete('/reviews/:id', async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      select: { id: true, rating: true, comment: true, isApproved: true },
    });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
    }
    if (review.isApproved) {
      return res.status(400).json({ success: false, message: 'Không thể từ chối đánh giá đã được duyệt.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: review.id } });
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'REJECT_REVIEW',
          resource: 'Review',
          resourceId: review.id,
          details: { rating: review.rating, comment: review.comment },
          ...requestMeta(req),
        },
      });
    });

    res.json({ success: true, message: 'Đã từ chối đánh giá.' });
  } catch (err) { next(err); }
});

module.exports = router;
