// admin.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize, invalidateUserCache } = require('../middlewares/auth.middleware');
const prisma = require('../config/prisma');
const { decryptOrderTickets, decryptSensitiveValue, decryptTickets } = require('../utils/privacy');

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

const getDateRange = (query) => {
  const now = new Date();
  const { period = 'month', dateFrom, dateTo } = query;
  let startDate;
  let endDate;

  if (dateFrom) {
    startDate = new Date(`${dateFrom}T00:00:00`);
    endDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : new Date(`${dateFrom}T23:59:59.999`);
  } else if (period === 'day') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return { period, startDate, endDate };
};

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /api/admin/operators - Tất cả nhà xe (pending + approved)
router.get('/operators', async (req, res, next) => {
  try {
    const operators = await prisma.busOperator.findMany({
      orderBy: [{ isApproved: 'asc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: { id: true, email: true, phone: true, isActive: true, createdAt: true },
        },
        _count: {
          select: {
            routes: true,
            vehicles: true,
          },
        },
      },
    });
    res.json({ success: true, data: operators });
  } catch (err) { next(err); }
});

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
    if (isAdmin) {
      return res.status(403).json({ success: false, message: 'Không thể khóa hoặc mở khóa tài khoản của quản trị viên khác.' });
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

    // Xóa auth cache ngay lập tức để lock/unlock có hiệu lực tức thì
    await invalidateUserCache(req.params.id);

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
        customer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            _count: { select: { orders: true, reviews: true } },
          },
        },
        busOperator: {
          select: {
            id: true,
            companyName: true,
            isApproved: true,
            _count: { select: { routes: true, vehicles: true } },
          },
        },
        staff: {
          select: {
            id: true,
            fullName: true,
            role: true,
            operator: { select: { companyName: true } },
            _count: { select: { tripStaffs: true } },
          },
        },
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

    res.json({ success: true, data: { user, tickets: decryptTickets(tickets) } });
  } catch (err) { next(err); }
});

// GET /api/admin/users/:id/invoices - Xem hóa đơn của một user
router.get('/users/:id/invoices', async (req, res, next) => {
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
      return res.json({ success: true, data: { user, invoices: [] } });
    }

    const invoices = await prisma.order.findMany({
      where: { customerId: user.customer.id },
      include: {
        payments: {
          select: {
            id: true,
            method: true,
            gateway: true,
            gatewayTxnId: true,
            status: true,
            amount: true,
            paidAt: true,
            refundedAt: true,
            refundAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        ticketDetails: {
          include: {
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
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { user, invoices: invoices.map(decryptOrderTickets) } });
  } catch (err) { next(err); }
});

// GET /api/admin/stats - Thống kê hệ thống
// GET /api/admin/users/:id/routes - Xem tuyến/chuyến của nhân viên hoặc nhà xe
router.get('/users/:id/routes', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        phone: true,
        busOperator: { select: { id: true, companyName: true, hotline: true, isApproved: true } },
        staff: {
          select: {
            id: true,
            fullName: true,
            role: true,
            phone: true,
            operator: { select: { id: true, companyName: true, hotline: true } },
          },
        },
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    }

    if (user.busOperator) {
      const routes = await prisma.route.findMany({
        where: { operatorId: user.busOperator.id },
        orderBy: [{ originCity: 'asc' }, { destinationCity: 'asc' }],
        include: {
          _count: { select: { trips: true } },
          trips: {
            orderBy: { departureTime: 'desc' },
            take: 8,
            include: {
              vehicle: { select: { licensePlate: true, vehicleType: { select: { name: true } } } },
              _count: { select: { tripSeats: { where: { status: 'AVAILABLE' } } } },
            },
          },
        },
      });

      return res.json({ success: true, data: { type: 'BUS_OPERATOR', user, routes } });
    }

    if (user.staff) {
      const assignments = await prisma.tripStaff.findMany({
        where: { staffId: user.staff.id },
        orderBy: { trip: { departureTime: 'desc' } },
        include: {
          trip: {
            include: {
              route: { include: { operator: { select: { id: true, companyName: true, hotline: true } } } },
              vehicle: { select: { licensePlate: true, vehicleType: { select: { name: true } } } },
              _count: { select: { tripSeats: { where: { status: 'AVAILABLE' } } } },
            },
          },
        },
      });

      const routeMap = new Map();
      for (const assignment of assignments) {
        const route = assignment.trip.route;
        if (!routeMap.has(route.id)) {
          routeMap.set(route.id, { ...route, assignments: [] });
        }
        routeMap.get(route.id).assignments.push({ role: assignment.role, trip: assignment.trip });
      }

      return res.json({
        success: true,
        data: { type: 'STAFF', user, routes: Array.from(routeMap.values()), assignments },
      });
    }

    res.json({ success: true, data: { type: 'OTHER', user, routes: [], assignments: [] } });
  } catch (err) { next(err); }
});

router.get('/stats', async (req, res, next) => {
  try {
    const range = getDateRange(req.query);
    if (!range) return res.status(400).json({ success: false, message: 'Khoảng thời gian thống kê không hợp lệ.' });

    const { period, startDate, endDate } = range;
    const { operatorId, routeId } = req.query;
    const tripScope = {
      ...(operatorId ? { vehicle: { operatorId } } : {}),
      ...(routeId ? { routeId } : {}),
    };
    const ticketScope = { tripSeat: { trip: tripScope } };
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalUsers,
      totalOperators,
      totalTrips,
      totalTickets,
      totalRevenue,
      todayTrips,
      todayTickets,
      todayRevenue,
      pendingOperators,
      activeRoutes,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.busOperator.count({ where: { isApproved: true } }),
      prisma.trip.count({ where: { ...tripScope, departureTime: { gte: startDate, lte: endDate } } }),
      prisma.ticketDetail.count({
        where: { status: { in: ['PAID', 'CHECKED_IN', 'COMPLETED'] }, ...ticketScope, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.ticketDetail.aggregate({
        _sum: { price: true },
        where: { status: { in: ['PAID', 'CHECKED_IN', 'COMPLETED'] }, ...ticketScope, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.trip.count({ where: { ...tripScope, departureTime: { gte: todayStart, lte: todayEnd } } }),
      prisma.ticketDetail.count({
        where: { status: { in: ['PAID', 'CHECKED_IN', 'COMPLETED'] }, ...ticketScope, createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.ticketDetail.aggregate({
        _sum: { price: true },
        where: { status: { in: ['PAID', 'CHECKED_IN', 'COMPLETED'] }, ...ticketScope, createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.busOperator.count({ where: { isApproved: false } }),
      prisma.route.count({ where: { isActive: true, operator: { isApproved: true, user: { isActive: true } } } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOperators,
        totalTrips,
        totalTickets,
        totalRevenue: totalRevenue._sum.price || 0,
        todayTrips,
        todayTickets,
        todayRevenue: todayRevenue._sum.price || 0,
        pendingOperators,
        activeRoutes,
        filters: { period, startDate, endDate, operatorId: operatorId || null, routeId: routeId || null },
      },
    });
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
        include: {
          customer: { select: { fullName: true } },
          ticketDetail: {
            select: {
              id: true,
              publicCode: true,
              passengerName: true,
              passengerPhone: true,
              price: true,
              order: { select: { id: true, publicCode: true } },
              tripSeat: {
                select: {
                  seatLayout: { select: { seatCode: true, floor: true } },
                  trip: {
                    select: {
                      id: true,
                      departureTime: true,
                      estimatedArrival: true,
                      status: true,
                      route: {
                        select: {
                          originCity: true,
                          destinationCity: true,
                          operator: { select: { companyName: true, hotline: true } },
                        },
                      },
                      vehicle: {
                        select: {
                          licensePlate: true,
                          vehicleType: { select: { name: true } },
                        },
                      },
                      tripStaffs: {
                        select: {
                          role: true,
                          staff: { select: { fullName: true, phone: true, role: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);
    const data = reviews.map((review) => ({
      ...review,
      ticketDetail: review.ticketDetail ? {
        ...review.ticketDetail,
        passengerName: decryptSensitiveValue(review.ticketDetail.passengerName),
        passengerPhone: decryptSensitiveValue(review.ticketDetail.passengerPhone),
      } : null,
    }));
    res.json({ success: true, data, meta: { page, limit, total } });
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
