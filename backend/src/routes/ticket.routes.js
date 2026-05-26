const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = require('../config/prisma');

const canAccessTrip = async (req, tripId) => {
  if (req.roles?.includes('ADMIN')) return true;

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

const normalizeLookupCode = (value, prefixes = []) => {
  const raw = String(value || '').trim();
  const upper = raw.toUpperCase();
  const matchedPrefix = prefixes.find((prefix) => upper.startsWith(`${prefix}-`));
  return matchedPrefix ? raw.slice(matchedPrefix.length + 1).trim() : raw;
};

const ticketInclude = {
  tripSeat: {
    include: {
      trip: {
        include: {
          route: { include: { operator: true } },
          vehicle: { include: { vehicleType: true } },
        },
      },
      seatLayout: true,
    },
  },
  order: {
    include: {
      customer: { include: { user: { select: { phone: true, email: true } } } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  },
};

const isPhoneMatched = (ticket, phone) => {
  const normalizedPhone = String(phone || '').replace(/\D/g, '');
  if (!normalizedPhone) return false;
  const candidatePhones = [
    ticket.passengerPhone,
    ticket.order?.customer?.user?.phone,
  ].filter(Boolean);
  return candidatePhones.some((candidate) => String(candidate).replace(/\D/g, '') === normalizedPhone);
};

// GET /api/tickets/lookup?code=VE-xxxx&phone=...
router.get('/lookup', async (req, res, next) => {
  try {
    const code = normalizeLookupCode(req.query.code, ['VE', 'TICKET']);
    const phone = req.query.phone;
    if (!code || !phone) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã vé và số điện thoại.' });
    }

    const ticket = await prisma.ticketDetail.findFirst({
      where: {
        OR: [
          { id: code },
          { id: { startsWith: code, mode: 'insensitive' } },
        ],
      },
      include: ticketInclude,
    });

    if (!ticket || !isPhoneMatched(ticket, phone)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vé phù hợp với thông tin đã nhập.' });
    }

    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

// GET /api/tickets/trip/:tripId - list tickets for a trip
router.get('/trip/:tripId', authenticate, authorize('STAFF', 'BUS_OPERATOR'), async (req, res, next) => {
  try {
    if (!(await canAccessTrip(req, req.params.tripId))) {
      return res.status(403).json({ success: false, message: 'You cannot view tickets for this trip.' });
    }

    const tickets = await prisma.ticketDetail.findMany({
      where: { tripSeat: { tripId: req.params.tripId }, status: { in: ['PAID', 'CHECKED_IN', 'COMPLETED'] } },
      include: { tripSeat: { include: { seatLayout: true } }, order: { include: { customer: true } } },
      orderBy: { tripSeat: { seatLayout: { seatCode: 'asc' } } },
    });
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
});

// GET /api/tickets/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const accessFilter = req.roles?.includes('ADMIN')
      ? {}
      : req.roles?.includes('CUSTOMER')
        ? { order: { customer: { userId: req.user.id } } }
        : req.roles?.includes('BUS_OPERATOR')
          ? { tripSeat: { trip: { vehicle: { operator: { userId: req.user.id } } } } }
          : req.roles?.includes('STAFF')
            ? { tripSeat: { trip: { tripStaffs: { some: { staffId: req.user.staff?.id } } } } }
            : { id: '__deny__' };

    const ticket = await prisma.ticketDetail.findFirst({
      where: { id: req.params.id, ...accessFilter },
      include: {
        ...ticketInclude,
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            isApproved: true,
            createdAt: true,
          },
        },
      },
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

// PATCH /api/tickets/:id/check-in
router.patch('/:id/check-in', authenticate, authorize('STAFF', 'BUS_OPERATOR'), async (req, res, next) => {
  try {
    const ticket = await prisma.ticketDetail.findUnique({
      where: { id: req.params.id },
      include: { tripSeat: true },
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    if (!(await canAccessTrip(req, ticket.tripSeat.tripId))) {
      return res.status(403).json({ success: false, message: 'You cannot check in this ticket.' });
    }
    if (ticket.status !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Ticket has not been paid.' });
    }

    const updated = await prisma.ticketDetail.update({
      where: { id: req.params.id },
      data: { checkedInAt: new Date(), status: 'CHECKED_IN' },
    });
    res.json({ success: true, message: 'Ticket check-in completed.', data: updated });
  } catch (err) { next(err); }
});

module.exports = router;
