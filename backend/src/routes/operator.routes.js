const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const prisma = new PrismaClient();

// GET /api/operators - Danh sách nhà xe đã duyệt (public)
router.get('/', async (req, res, next) => {
  try {
    const operators = await prisma.busOperator.findMany({
      where: { isApproved: true },
      select: { id: true, companyName: true, hotline: true, logoUrl: true, address: true, description: true },
    });
    res.json({ success: true, data: operators });
  } catch (err) { next(err); }
});

// GET /api/operators/:id
router.get('/:id', async (req, res, next) => {
  try {
    const op = await prisma.busOperator.findUnique({
      where: { id: req.params.id },
      include: {
        routes: { where: { isActive: true } },
        vehicles: { where: { isActive: true }, include: { vehicleType: true } },
      },
    });
    if (!op) return res.status(404).json({ success: false, message: 'Không tìm thấy nhà xe.' });
    res.json({ success: true, data: op });
  } catch (err) { next(err); }
});

// GET /api/operators/me/dashboard - Thống kê doanh thu (QD NX-7)
router.get('/me/dashboard', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate;
    if (period === 'day') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else startDate = new Date(now.getFullYear(), 0, 1);

    const [totalTrips, totalTickets, revenue] = await Promise.all([
      prisma.trip.count({ where: { vehicle: { operatorId }, createdAt: { gte: startDate } } }),
      prisma.ticketDetail.count({
        where: { status: 'PAID', tripSeat: { trip: { vehicle: { operatorId } } }, createdAt: { gte: startDate } },
      }),
      prisma.ticketDetail.aggregate({
        _sum: { price: true },
        where: { status: { in: ['PAID', 'COMPLETED'] }, tripSeat: { trip: { vehicle: { operatorId } } }, createdAt: { gte: startDate } },
      }),
    ]);

    res.json({
      success: true,
      data: { totalTrips, totalTickets, totalRevenue: revenue._sum.price || 0, period, startDate },
    });
  } catch (err) { next(err); }
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
  } catch (err) { next(err); }
});

module.exports = router;
