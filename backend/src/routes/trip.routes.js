const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const prisma = new PrismaClient();

// GET /api/trips/search - Tìm kiếm chuyến xe (public)
router.get('/search', async (req, res, next) => {
  try {
    const { origin, destination, date, minPrice, maxPrice, operatorId } = req.query;
    if (!origin || !destination || !date) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập điểm đi, điểm đến và ngày.' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where = {
      status: { in: ['SCHEDULED', 'BOARDING'] },
      departureTime: { gte: startOfDay, lte: endOfDay },
      route: {
        originCity: { contains: origin, mode: 'insensitive' },
        destinationCity: { contains: destination, mode: 'insensitive' },
        isActive: true,
      },
    };
    if (operatorId) where.vehicle = { operatorId };
    if (minPrice) where.basePrice = { gte: parseFloat(minPrice) };
    if (maxPrice) where.basePrice = { ...where.basePrice, lte: parseFloat(maxPrice) };

    const trips = await prisma.trip.findMany({
      where,
      include: {
        route: { include: { operator: { select: { companyName: true, hotline: true, logoUrl: true } } } },
        vehicle: { include: { vehicleType: { select: { name: true, seatCount: true } } } },
        _count: { select: { tripSeats: { where: { status: 'AVAILABLE' } } } },
      },
      orderBy: { departureTime: 'asc' },
    });

    res.json({ success: true, data: trips });
  } catch (err) {
    next(err);
  }
});

// GET /api/trips/:id - Chi tiết chuyến xe
router.get('/:id', async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        route: { include: { operator: true } },
        vehicle: { include: { vehicleType: { include: { seatLayouts: true } } } },
        tripSeats: {
          include: { seatLayout: true },
          orderBy: [{ seatLayout: { floor: 'asc' } }, { seatLayout: { row: 'asc' } }, { seatLayout: { col: 'asc' } }],
        },
        tripStaffs: { include: { staff: { select: { fullName: true, role: true } } } },
      },
    });
    if (!trip) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến xe.' });
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
});

// POST /api/trips - Tạo chuyến xe mới (BUS_OPERATOR only)
router.post('/', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const { routeId, vehicleId, departureTime, estimatedArrival, basePrice } = req.body;
    const operatorId = req.user.busOperator?.id;

    // Verify ownership
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, operatorId } });
    if (!vehicle) return res.status(403).json({ success: false, message: 'Xe không thuộc nhà xe của bạn.' });

    const trip = await prisma.$transaction(async (tx) => {
      const newTrip = await tx.trip.create({
        data: { routeId, vehicleId, departureTime: new Date(departureTime), estimatedArrival: new Date(estimatedArrival), basePrice },
      });

      // Auto-generate trip seats from vehicle seat layout
      const layouts = await tx.seatLayout.findMany({ where: { vehicleTypeId: vehicle.vehicleTypeId } });
      await tx.tripSeat.createMany({
        data: layouts.map((l) => ({ tripId: newTrip.id, seatLayoutId: l.id, status: 'AVAILABLE' })),
      });

      return newTrip;
    });

    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/trips/:id/status - Cập nhật trạng thái chuyến (Staff/Driver)
router.patch('/:id/status', authenticate, authorize('STAFF', 'BUS_OPERATOR'), async (req, res, next) => {
  try {
    const { status, cancelReason } = req.body;
    const validStatuses = ['BOARDING', 'ON_ROUTE', 'COMPLETED', 'DELAYED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
    }
    if (status === 'CANCELLED' && !cancelReason) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do hủy chuyến.' });
    }

    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: { status, cancelReason: cancelReason || null },
    });

    // If operator cancels trip, auto-refund all paid tickets (QD_OP_03)
    if (status === 'CANCELLED') {
      const bookingService = require('../services/booking.service');
      const paidTickets = await prisma.ticketDetail.findMany({
        where: { tripSeat: { tripId: trip.id }, status: 'PAID' },
      });
      for (const ticket of paidTickets) {
        await prisma.ticketDetail.update({ where: { id: ticket.id }, data: { status: 'REFUNDED', cancelledAt: new Date() } });
        await prisma.payment.create({
          data: { orderId: ticket.orderId, amount: -Number(ticket.price), method: 'REFUND', status: 'REFUNDED', refundedAt: new Date(), refundAmount: ticket.price },
        });
      }
    }

    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
