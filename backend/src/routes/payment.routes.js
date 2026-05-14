const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { redisClient } = require('../config/redis');
const prisma = new PrismaClient();

const verifyPaymentSignature = (payload, signature) => {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
};

// POST /api/payments/initiate - Khởi tạo giao dịch thanh toán
router.post('/initiate', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { orderId, method, gateway } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: orderId, customer: { userId: req.user.id } },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: { orderId, amount: order.totalAmount, method, gateway, status: 'PENDING' },
    });

    // In a real system, you'd call VNPay/MoMo SDK here to get a payment URL
    // For now, return a mock payment URL
    const paymentUrl = `${process.env.CLIENT_URL}/payment/mock?paymentId=${payment.id}&amount=${order.totalAmount}`;

    res.json({ success: true, data: { paymentId: payment.id, paymentUrl } });
  } catch (err) { next(err); }
});

// POST /api/payments/callback - Webhook from payment gateway
router.post('/callback', async (req, res, next) => {
  try {
    if (!verifyPaymentSignature(req.body, req.headers['x-payment-signature'])) {
      return res.status(401).json({ success: false, message: 'Invalid payment signature.' });
    }

    const { paymentId, status, gatewayTxnId } = req.body;

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: {
            include: {
              ticketDetails: {
                include: { tripSeat: true },
              },
            },
          },
        },
      });

      if (!payment) {
        const error = new Error('Payment not found.');
        error.statusCode = 404;
        throw error;
      }

      if (payment.status === 'SUCCESS' || payment.status === 'REFUNDED') return;

      const isSuccess = status === 'success';
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          gatewayTxnId,
          paidAt: isSuccess ? new Date() : null,
        },
      });

      const ticketIds = payment.order.ticketDetails.map((ticket) => ticket.id);
      const seatIds = payment.order.ticketDetails.map((ticket) => ticket.tripSeatId);

      if (!isSuccess) {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: 'CANCELLED' } });
        await tx.ticketDetail.deleteMany({ where: { id: { in: ticketIds }, status: 'PENDING' } });
        await tx.tripSeat.updateMany({
          where: { id: { in: seatIds }, status: 'PROCESSING' },
          data: { status: 'AVAILABLE', lockedBy: null, lockedAt: null, lockExpiresAt: null },
        });

        for (const ticket of payment.order.ticketDetails) {
          await redisClient.del(`seat_lock:${ticket.tripSeat.tripId}:${ticket.tripSeatId}`);
        }
        return;
      }

      await tx.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
      await tx.ticketDetail.updateMany({ where: { orderId: payment.orderId }, data: { status: 'PAID' } });
      await tx.tripSeat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: 'BOOKED', lockedBy: null, lockedAt: null, lockExpiresAt: null },
      });

      for (const ticket of payment.order.ticketDetails) {
        await redisClient.del(`seat_lock:${ticket.tripSeat.tripId}:${ticket.tripSeatId}`);
      }
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/payments/order/:orderId
router.get('/order/:orderId', authenticate, async (req, res, next) => {
  try {
    if (!req.roles?.includes('ADMIN')) {
      const order = await prisma.order.findFirst({
        where: { id: req.params.orderId, customer: { userId: req.user.id } },
        select: { id: true },
      });
      if (!order) return res.status(403).json({ success: false, message: 'Không có quyền xem thanh toán này.' });
    }

    const payments = await prisma.payment.findMany({
      where: { orderId: req.params.orderId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
});

module.exports = router;
