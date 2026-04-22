// staff.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = new PrismaClient();

// GET /api/staff/trips/assigned - Chuyến xe được phân công
router.get('/trips/assigned', authenticate, authorize('STAFF'), async (req, res, next) => {
  try {
    const staffId = req.user.staff?.id;
    const trips = await prisma.trip.findMany({
      where: { tripStaffs: { some: { staffId } } },
      include: { route: true, vehicle: { include: { vehicleType: true } } },
      orderBy: { departureTime: 'asc' },
    });
    res.json({ success: true, data: trips });
  } catch (err) { next(err); }
});

// GET /api/staff/trips/:tripId/passengers
router.get('/trips/:tripId/passengers', authenticate, authorize('STAFF', 'BUS_OPERATOR'), async (req, res, next) => {
  try {
    const passengers = await prisma.ticketDetail.findMany({
      where: { tripSeat: { tripId: req.params.tripId }, status: { in: ['PAID', 'COMPLETED'] } },
      include: { tripSeat: { include: { seatLayout: true } } },
    });
    res.json({ success: true, data: passengers });
  } catch (err) { next(err); }
});

module.exports = router;
