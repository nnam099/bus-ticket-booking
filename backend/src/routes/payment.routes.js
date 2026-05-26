const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { redisClient } = require('../config/redis');
const prisma = require('../config/prisma');

const verifyPaymentSignature = (payload, signature) => {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!secret) return ['development', 'test'].includes(nodeEnv);
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

const PAYMENT_METHODS = ['E_WALLET', 'BANK_CARD', 'BANK_TRANSFER', 'CASH'];
const PAYMENT_STATUSES = ['success', 'failed'];

const applyPaymentResult = async ({ paymentId, status, gatewayTxnId }) => {
  let expiredBooking = false;
  let lockOwnerCustomerId;
  const lockKeysToClear = [];

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
    lockOwnerCustomerId = payment.order.customerId;

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
        where: { id: { in: seatIds }, status: 'PROCESSING', lockedBy: payment.order.customerId },
        data: { status: 'AVAILABLE', lockedBy: null, lockedAt: null, lockExpiresAt: null },
      });

      for (const ticket of payment.order.ticketDetails) {
        lockKeysToClear.push(`seat_lock:${ticket.tripSeat.tripId}:${ticket.tripSeatId}`);
      }
      return;
    }

    const now = new Date();
    const canCompleteBooking = payment.order.status === 'PENDING'
      && payment.order.ticketDetails.length > 0
      && payment.order.ticketDetails.every((ticket) => (
        ticket.status === 'PENDING'
        && ticket.tripSeat.status === 'PROCESSING'
        && ticket.tripSeat.lockedBy === payment.order.customerId
        && ticket.tripSeat.lockExpiresAt
        && ticket.tripSeat.lockExpiresAt > now
      ));

    if (!canCompleteBooking) {
      expiredBooking = true;
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED', gatewayTxnId, paidAt: null },
      });
      await tx.order.update({ where: { id: payment.orderId }, data: { status: 'CANCELLED' } });
      await tx.ticketDetail.deleteMany({ where: { id: { in: ticketIds }, status: 'PENDING' } });
      await tx.tripSeat.updateMany({
        where: { id: { in: seatIds }, status: 'PROCESSING', lockedBy: payment.order.customerId },
        data: { status: 'AVAILABLE', lockedBy: null, lockedAt: null, lockExpiresAt: null },
      });

      for (const ticket of payment.order.ticketDetails) {
        lockKeysToClear.push(`seat_lock:${ticket.tripSeat.tripId}:${ticket.tripSeatId}`);
      }
      return;
    }

    const bookedSeats = await tx.tripSeat.updateMany({
      where: { id: { in: seatIds }, status: 'PROCESSING', lockedBy: payment.order.customerId },
      data: { status: 'BOOKED', lockedBy: null, lockedAt: null, lockExpiresAt: null },
    });

    if (bookedSeats.count !== seatIds.length) {
      const error = new Error('Phiên giữ chỗ đã hết hạn. Thanh toán không thể hoàn tất.');
      error.statusCode = 409;
      error.isOperational = true;
      throw error;
    }

    await tx.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
    await tx.ticketDetail.updateMany({ where: { orderId: payment.orderId }, data: { status: 'PAID' } });

    for (const ticket of payment.order.ticketDetails) {
      lockKeysToClear.push(`seat_lock:${ticket.tripSeat.tripId}:${ticket.tripSeatId}`);
    }
  });

  for (const lockKey of lockKeysToClear) {
    const owner = await redisClient.get(lockKey);
    if (owner === lockOwnerCustomerId) {
      await redisClient.del(lockKey);
    }
  }

  if (expiredBooking) {
    const error = new Error('Phiên giữ chỗ đã hết hạn. Thanh toán không thể hoàn tất.');
    error.statusCode = 409;
    error.isOperational = true;
    throw error;
  }
};

// POST /api/payments/initiate - Khoi tao giao dich thanh toan
router.post('/initiate', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { orderId, method, gateway } = req.body;
    if (!orderId || !PAYMENT_METHODS.includes(method)) {
      return res.status(400).json({ success: false, message: 'Thông tin thanh toán không hợp lệ.' });
    }
    if (gateway !== undefined && gateway !== null && typeof gateway !== 'string') {
      return res.status(400).json({ success: false, message: 'Cổng thanh toán không hợp lệ.' });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, customer: { userId: req.user.id } },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Khong tim thay don hang.' });

    const payment = await prisma.payment.create({
      data: { orderId, amount: order.totalAmount, method, gateway, status: 'PENDING' },
    });

    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost';
    const paymentUrl = `${clientUrl}/payment/callback?paymentId=${payment.id}&mockStatus=success&amount=${order.totalAmount}`;

    res.json({ success: true, data: { paymentId: payment.id, paymentUrl } });
  } catch (err) { next(err); }
});

// POST /api/payments/mock/complete - Local mock gateway completion
router.post('/mock/complete', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { paymentId, status = 'success' } = req.body;
    if (!paymentId || !PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Thông tin giao dịch không hợp lệ.' });
    }
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, order: { customer: { userId: req.user.id } } },
      select: { id: true },
    });
    if (!payment) return res.status(404).json({ success: false, message: 'Khong tim thay giao dich thanh toan.' });

    await applyPaymentResult({
      paymentId,
      status: status === 'success' ? 'success' : 'failed',
      gatewayTxnId: `mock_${Date.now()}`,
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/payments/callback - Webhook from payment gateway
router.post('/callback', async (req, res, next) => {
  try {
    if (!verifyPaymentSignature(req.body, req.headers['x-payment-signature'])) {
      return res.status(401).json({ success: false, message: 'Invalid payment signature.' });
    }

    const { paymentId, status, gatewayTxnId } = req.body;
    if (!paymentId || !PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Thông tin callback không hợp lệ.' });
    }
    await applyPaymentResult({ paymentId, status, gatewayTxnId });

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
      if (!order) return res.status(403).json({ success: false, message: 'Khong co quyen xem thanh toan nay.' });
    }

    const payments = await prisma.payment.findMany({
      where: { orderId: req.params.orderId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
});

module.exports = router;
