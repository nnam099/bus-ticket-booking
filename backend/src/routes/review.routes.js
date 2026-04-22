// review.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = new PrismaClient();

// POST /api/reviews - Đánh giá chuyến xe (phải có vé đã completed)
router.post('/', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { ticketDetailId, rating, comment } = req.body;
    const customerId = req.user.customer?.id;

    // Verify ticket ownership & completion
    const ticket = await prisma.ticketDetail.findFirst({
      where: { id: ticketDetailId, order: { customerId }, status: 'COMPLETED' },
    });
    if (!ticket) return res.status(403).json({ success: false, message: 'Chỉ có thể đánh giá chuyến đã hoàn thành.' });

    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Đánh giá phải từ 1 đến 5 sao.' });

    const review = await prisma.review.create({
      data: { ticketDetailId, customerId, rating, comment },
    });
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

// GET /api/reviews/operator/:operatorId
router.get('/operator/:operatorId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        isApproved: true,
        ticketDetail: { tripSeat: { trip: { vehicle: { operatorId: req.params.operatorId } } } },
      },
      include: { customer: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
    res.json({ success: true, data: { reviews, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length } });
  } catch (err) { next(err); }
});

module.exports = router;
