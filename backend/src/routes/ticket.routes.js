const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = require('../config/prisma');
const { parsePublicCode } = require('../utils/security');
const { decryptTicket, decryptTickets } = require('../utils/privacy');

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

const publicTicketInclude = {
  tripSeat: {
    include: {
      trip: {
        include: {
          route: { include: { operator: { select: { id: true, companyName: true, hotline: true } } } },
          vehicle: { include: { vehicleType: true } },
        },
      },
      seatLayout: true,
    },
  },
  order: { select: { id: true, publicCode: true, status: true } },
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

router.get('/lookup', async (req, res, next) => {
  try {
    const code = String(req.query.code || '').trim().toUpperCase();
    const phone = req.query.phone;
    if (!code || !phone) {
      return res.status(400).json({ success: false, message: 'Vui long nhap ma ve va so dien thoai.' });
    }
    if (!parsePublicCode(code, 'VE')) {
      return res.status(400).json({ success: false, message: 'Ma ve khong hop le.' });
    }

    const ticket = await prisma.ticketDetail.findFirst({
      where: { publicCode: code },
      include: publicTicketInclude,
    });

    const data = decryptTicket(ticket);
    if (!data || !isPhoneMatched(data, phone)) {
      return res.status(404).json({ success: false, message: 'Khong tim thay ve phu hop voi thong tin da nhap.' });
    }

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

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
    res.json({ success: true, data: decryptTickets(tickets) });
  } catch (err) { next(err); }
});

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
    res.json({ success: true, data: decryptTicket(ticket) });
  } catch (err) { next(err); }
});

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

    const checkedIn = await prisma.ticketDetail.updateMany({
      where: { id: req.params.id, status: 'PAID' },
      data: { checkedInAt: new Date(), status: 'CHECKED_IN' },
    });
    if (checkedIn.count !== 1) {
      return res.status(409).json({ success: false, message: 'Ticket has already been updated.' });
    }
    const updated = await prisma.ticketDetail.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Ticket check-in completed.', data: decryptTicket(updated) });
  } catch (err) { next(err); }
});

module.exports = router;
