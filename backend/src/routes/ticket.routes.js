const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = new PrismaClient();

// GET /api/tickets/:id - Chi tiết vé
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const ticket = await prisma.ticketDetail.findUnique({
      where: { id: req.params.id },
      include: {
        tripSeat: { include: { trip: { include: { route: true } }, seatLayout: true } },
        order: { include: { customer: true } },
      },
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy vé.' });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

// PATCH /api/tickets/:id/check-in - Xác nhận khách lên xe (Staff/Driver)
router.patch('/:id/check-in', authenticate, authorize('STAFF', 'BUS_OPERATOR'), async (req, res, next) => {
  try {
    const ticket = await prisma.ticketDetail.findUnique({
      where: { id: req.params.id },
      include: { tripSeat: true },
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy vé.' });
    if (ticket.status !== 'PAID') return res.status(400).json({ success: false, message: 'Vé chưa được thanh toán.' });

    const updated = await prisma.ticketDetail.update({
      where: { id: req.params.id },
      data: { checkedInAt: new Date() },
    });
    res.json({ success: true, message: 'Xác nhận khách lên xe thành công.', data: updated });
  } catch (err) { next(err); }
});

// GET /api/tickets/trip/:tripId - Danh sách vé theo chuyến (Staff)
router.get('/trip/:tripId', authenticate, authorize('STAFF', 'BUS_OPERATOR'), async (req, res, next) => {
  try {
    const tickets = await prisma.ticketDetail.findMany({
      where: { tripSeat: { tripId: req.params.tripId }, status: { in: ['PAID', 'COMPLETED'] } },
      include: { tripSeat: { include: { seatLayout: true } }, order: { include: { customer: true } } },
      orderBy: { tripSeat: { seatLayout: { seatCode: 'asc' } } },
    });
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
});

module.exports = router;
