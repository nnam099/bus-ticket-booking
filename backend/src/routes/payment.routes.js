const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = new PrismaClient();

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
    const { paymentId, status, gatewayTxnId } = req.body;

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status === 'success' ? 'SUCCESS' : 'FAILED',
        gatewayTxnId,
        paidAt: status === 'success' ? new Date() : null,
      },
      include: { order: true },
    });

    if (payment.status === 'SUCCESS') {
      await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
      await prisma.ticketDetail.updateMany({ where: { orderId: payment.orderId }, data: { status: 'PAID' } });
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/payments/order/:orderId
router.get('/order/:orderId', authenticate, async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { orderId: req.params.orderId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
});

module.exports = router;
