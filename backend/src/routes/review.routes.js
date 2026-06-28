// review.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = require('../config/prisma');

// POST /api/reviews - Đánh giá chuyến xe (phải có vé đã completed)
router.post('/', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { ticketDetailId, rating, comment } = req.body;
    const customerId = req.user.customer?.id;
    const parsedRating = Number(rating);
    const normalizedComment = typeof comment === 'string' ? comment.trim() : comment;

    if (!ticketDetailId || !Number.isInteger(parsedRating)) {
      return res.status(400).json({ success: false, message: 'Thông tin đánh giá không hợp lệ.' });
    }
    if (comment !== undefined && comment !== null && typeof comment !== 'string') {
      return res.status(400).json({ success: false, message: 'Nội dung đánh giá không hợp lệ.' });
    }

    // Verify ticket ownership & completion
    const ticket = await prisma.ticketDetail.findFirst({
      where: { id: ticketDetailId, order: { customerId }, status: 'COMPLETED' },
      include: { review: { select: { id: true } } },
    });
    if (!ticket) return res.status(403).json({ success: false, message: 'Chỉ có thể đánh giá chuyến đã hoàn thành.' });
    if (ticket.review) return res.status(409).json({ success: false, message: 'Vé này đã được đánh giá.' });

    if (parsedRating < 1 || parsedRating > 5) return res.status(400).json({ success: false, message: 'Đánh giá phải từ 1 đến 5 sao.' });

    const review = await prisma.review.create({
      data: { ticketDetailId, customerId, rating: parsedRating, comment: normalizedComment || null },
    });
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

// GET /api/reviews/latest - Lấy các đánh giá mới nhất đã được duyệt cho trang chủ
router.get('/latest', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const reviews = await prisma.review.findMany({
      where: { isApproved: true },
      include: { 
        customer: { select: { fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({ success: true, data: reviews });
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
