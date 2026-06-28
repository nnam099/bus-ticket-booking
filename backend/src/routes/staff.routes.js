const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = require('../config/prisma');
const { decryptTickets } = require('../utils/privacy');

const canAccessTrip = async (req, tripId) => {
  if (req.roles?.includes('BUS_OPERATOR')) {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, vehicle: { operator: { userId: req.user.id } } },
      select: { id: true },
    });
    return Boolean(trip);
  }

  if (req.roles?.includes('STAFF')) {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, tripStaffs: { some: { staffId: req.user.staff?.id } } },
      select: { id: true },
    });
    return Boolean(trip);
  }

  return false;
};

// GET /api/staff/trips/assigned
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
    if (!(await canAccessTrip(req, req.params.tripId))) {
      return res.status(403).json({ success: false, message: 'You cannot view passengers for this trip.' });
    }

    const activeTicketWhere = {
      tripSeat: { tripId: req.params.tripId },
      status: { in: ['PAID', 'CHECKED_IN', 'COMPLETED'] },
    };

    const [trip, passengers, tripSeats] = await Promise.all([
      prisma.trip.findUnique({
        where: { id: req.params.tripId },
        include: {
          route: true,
          vehicle: { include: { vehicleType: true } },
        },
      }),
      prisma.ticketDetail.findMany({
        where: activeTicketWhere,
        include: { tripSeat: { include: { seatLayout: true } } },
        orderBy: [
          { tripSeat: { seatLayout: { floor: 'asc' } } },
          { tripSeat: { seatLayout: { row: 'asc' } } },
          { tripSeat: { seatLayout: { col: 'asc' } } },
        ],
      }),
      prisma.tripSeat.findMany({
        where: { tripId: req.params.tripId },
        include: { seatLayout: true },
        orderBy: [
          { seatLayout: { floor: 'asc' } },
          { seatLayout: { row: 'asc' } },
          { seatLayout: { col: 'asc' } },
        ],
      }),
    ]);

    const decryptedPassengers = decryptTickets(passengers);
    const ticketBySeatId = new Map(decryptedPassengers.map((ticket) => [ticket.tripSeatId, ticket]));
    const seats = tripSeats.map((seat) => ({
      ...seat,
      ticket: ticketBySeatId.get(seat.id) || null,
    }));

    res.json({ success: true, data: { trip, passengers: decryptedPassengers, seats } });
  } catch (err) { next(err); }
});

// GET /api/staff/dashboard
router.get('/dashboard', authenticate, authorize('STAFF'), async (req, res, next) => {
  try {
    const staffId = req.user.staff?.id;
    if (!staffId) return res.status(403).json({ success: false, message: 'Invalid staff.' });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const [totalTrips, todayTrips, upcomingTrips] = await Promise.all([
      prisma.trip.count({
        where: { tripStaffs: { some: { staffId } } },
      }),
      prisma.trip.findMany({
        where: {
          tripStaffs: { some: { staffId } },
          departureTime: { gte: startOfToday, lt: endOfToday },
        },
        include: { route: true, vehicle: true },
        orderBy: { departureTime: 'asc' },
      }),
      prisma.trip.findMany({
        where: {
          tripStaffs: { some: { staffId } },
          departureTime: { gte: now },
        },
        include: { route: true, vehicle: true },
        orderBy: { departureTime: 'asc' },
        take: 5,
      })
    ]);

    const notifications = [
      { id: 1, title: 'Lưu ý vận hành', content: 'Vui lòng có mặt tại bến xe trước giờ khởi hành 30 phút.', date: new Date().toISOString() },
    ];

    res.json({
      success: true,
      data: {
        stats: { totalTrips, workingHours: totalTrips * 8 },
        todayTrips,
        upcomingTrips,
        notifications,
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
