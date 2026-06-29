const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = require('../config/prisma');

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

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  return { period, startDate, endDate };
};

// GET /api/operators - approved operators (public)
router.get('/', async (req, res, next) => {
  try {
    const operators = await prisma.busOperator.findMany({
      where: { isApproved: true },
      select: { id: true, companyName: true, hotline: true, logoUrl: true, address: true, description: true },
    });
    res.json({ success: true, data: operators });
  } catch (err) {
    next(err);
  }
});

// GET /api/operators/me/dashboard - operator revenue summary
router.get('/me/dashboard', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const range = getDateRange(req.query);
    if (!range) return res.status(400).json({ success: false, message: 'Khoảng thời gian thống kê không hợp lệ.' });

    const { period, startDate, endDate } = range;
    const { routeId } = req.query;
    const tripScope = {
      vehicle: { operatorId },
      ...(routeId ? { routeId } : {}),
    };
    const ticketScope = {
      tripSeat: {
        trip: tripScope,
      },
    };
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalTrips, totalTickets, revenue, 
      todayTrips, todayTickets, todayRevenue, upcomingTrips, routes,
      totalActiveVehicles, maintenanceVehicles, runningVehicles,
      totalActiveDrivers, driversOnLeave, delayedTrips, cancelledTrips
    ] = await Promise.all([
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
      prisma.trip.count({
        where: {
          ...tripScope,
          status: { in: ['SCHEDULED', 'BOARDING', 'DELAYED'] },
          departureTime: { gt: new Date() },
        },
      }),
      prisma.route.findMany({
        where: { operatorId, isActive: true },
        select: { id: true, originCity: true, destinationCity: true },
        orderBy: [{ originCity: 'asc' }, { destinationCity: 'asc' }],
      }),
      // Operational Stats
      prisma.vehicle.count({ where: { operatorId, isActive: true } }),
      prisma.vehicle.count({ where: { operatorId, isActive: true, status: 'IN_MAINTENANCE' } }),
      prisma.trip.findMany({ 
        where: { ...tripScope, status: { in: ['BOARDING', 'DEPARTED'] } }, 
        select: { vehicleId: true }, 
        distinct: ['vehicleId'] 
      }),
      prisma.staff.count({ where: { operatorId, role: 'DRIVER', user: { isActive: true } } }),
      prisma.staffLeave.findMany({
        where: { 
          staff: { operatorId, role: 'DRIVER' }, 
          status: 'APPROVED', 
          startDate: { lte: new Date() }, 
          endDate: { gte: new Date() } 
        },
        select: { staffId: true },
        distinct: ['staffId']
      }),
      prisma.trip.count({ where: { ...tripScope, status: 'DELAYED', departureTime: { gte: todayStart, lte: todayEnd } } }),
      prisma.trip.count({ where: { ...tripScope, status: 'CANCELLED', departureTime: { gte: todayStart, lte: todayEnd } } })
    ]);

    const runningVehiclesCount = runningVehicles.filter(v => v.vehicleId).length;
    const waitingVehiclesCount = Math.max(0, totalActiveVehicles - maintenanceVehicles - runningVehiclesCount);
    const driversOnLeaveCount = driversOnLeave.length;
    const driversOnDutyCount = Math.max(0, totalActiveDrivers - driversOnLeaveCount);

    res.json({
      success: true,
      data: {
        totalTrips,
        totalTickets,
        totalRevenue: revenue._sum.price || 0,
        todayTrips,
        todayTickets,
        todayRevenue: todayRevenue._sum.price || 0,
        upcomingTrips,
        routes,
        operations: {
          activeVehicles: totalActiveVehicles - maintenanceVehicles,
          runningVehicles: runningVehiclesCount,
          waitingVehicles: waitingVehiclesCount,
          maintenanceVehicles,
          driversOnDuty: driversOnDutyCount,
          driversOnLeave: driversOnLeaveCount,
          delayedTrips,
          cancelledTrips
        },
        filters: { period, startDate, endDate, routeId: routeId || null },
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/operators/me
router.put('/me', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const { companyName, hotline, address, description, logoUrl } = req.body;
    const op = await prisma.busOperator.update({
      where: { userId: req.user.id },
      data: { companyName, hotline, address, description, logoUrl },
    });
    res.json({ success: true, data: op });
  } catch (err) {
    next(err);
  }
});

// GET /api/operators/:id
router.get('/:id', async (req, res, next) => {
  try {
    const op = await prisma.busOperator.findUnique({
      where: { id: req.params.id, isApproved: true },
      include: {
        routes: { where: { isActive: true } },
        vehicles: { where: { isActive: true }, include: { vehicleType: true } },
      },
    });
    if (!op) return res.status(404).json({ success: false, message: 'Operator not found.' });
    res.json({ success: true, data: op });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// STAFF MANAGEMENT (BUS_OPERATOR)
// ==========================================

// GET /api/operators/me/staffs
router.get('/me/staffs', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const staffs = await prisma.staff.findMany({
      where: { operatorId },
      include: { user: { select: { email: true, phone: true, isActive: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: staffs });
  } catch (err) { next(err); }
});

// POST /api/operators/me/staffs
router.post('/me/staffs', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const { fullName, email, phone, role, password, licenseNo, address } = req.body;

    if (!email || !phone || !password || !fullName || !role) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email hoặc SĐT đã tồn tại.' });

    const staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } });
    
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash: await bcrypt.hash(password, 12),
        userRoles: { create: { roleId: staffRole.id } },
        staff: {
          create: {
            operatorId,
            fullName,
            role,
            licenseNo,
            address
          }
        }
      },
      include: { staff: true }
    });

    res.json({ success: true, message: 'Thêm nhân viên thành công.', data: user.staff });
  } catch (err) { next(err); }
});

// PATCH /api/operators/me/staffs/:id/toggle-active
router.patch('/me/staffs/:id/toggle-active', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id, operatorId },
      include: { user: true }
    });
    if (!staff) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên.' });

    const updatedUser = await prisma.user.update({
      where: { id: staff.userId },
      data: { isActive: !staff.user.isActive }
    });

    res.json({ success: true, message: updatedUser.isActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.' });
  } catch (err) { next(err); }
});

// PATCH /api/operators/me/staffs/:id/reset-password
router.patch('/me/staffs/:id/reset-password', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id, operatorId }
    });
    if (!staff) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên.' });

    await prisma.user.update({
      where: { id: staff.userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) }
    });

    res.json({ success: true, message: 'Đã cấp lại mật khẩu mới cho nhân viên thành công.' });
  } catch (err) { next(err); }
});

module.exports = router;
