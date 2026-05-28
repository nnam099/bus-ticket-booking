const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { redisClient } = require('../config/redis');
const prisma = require('../config/prisma');
const { parsePublicCode, timingSafeEqualString } = require('../utils/security');
const { decryptOrderTickets } = require('../utils/privacy');

const PAYMENT_METHODS = ['E_WALLET', 'BANK_CARD', 'BANK_TRANSFER'];
const PAYMENT_STATUSES = ['success', 'failed'];

const verifyPaymentSignature = (payload, signature) => {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return timingSafeEqualString(signature, expected);
};

const invoiceInclude = {
  customer: { include: { user: { select: { phone: true } } } },
  payments: {
    select: { id: true, method: true, gateway: true, gatewayTxnId: true, status: true, paidAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
  ticketDetails: {
    select: {
      id: true,
      publicCode: true,
      passengerName: true,
      passengerPhone: true,
      price: true,
      status: true,
      createdAt: true,
      tripSeat: {
        include: {
          seatLayout: true,
          trip: {
            include: {
              route: { include: { operator: { select: { id: true, companyName: true, hotline: true } } } },
              vehicle: { include: { vehicleType: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
};

const fullInvoiceInclude = {
  customer: { include: { user: { select: { phone: true, email: true } } } },
  payments: { orderBy: { createdAt: 'desc' } },
  ticketDetails: {
    include: {
      tripSeat: {
        include: {
          seatLayout: true,
          trip: {
            include: {
              route: { include: { operator: true } },
              vehicle: { include: { vehicleType: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
};

const isInvoicePhoneMatched = (order, phone) => {
  const normalizedPhone = String(phone || '').replace(/\D/g, '');
  if (!normalizedPhone) return false;
  const candidatePhones = [
    order.customer?.user?.phone,
    ...order.ticketDetails.map((ticket) => ticket.passengerPhone),
  ].filter(Boolean);
  return candidatePhones.some((candidate) => String(candidate).replace(/\D/g, '') === normalizedPhone);
};

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
              include: { tripSeat: { include: { trip: true } } },
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

    if (gatewayTxnId) {
      const duplicateTxn = await tx.payment.findFirst({
        where: { id: { not: paymentId }, gatewayTxnId },
        select: { id: true },
      });
      if (duplicateTxn) {
        const error = new Error('Duplicate payment gateway transaction.');
        error.statusCode = 409;
        error.isOperational = true;
        throw error;
      }
    }

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
        && ticket.tripSeat.trip.status === 'SCHEDULED'
        && ticket.tripSeat.trip.departureTime > now
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
      const error = new Error('Phien giu cho da het han. Thanh toan khong the hoan tat.');
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
    const error = new Error('Phien giu cho da het han. Thanh toan khong the hoan tat.');
    error.statusCode = 409;
    error.isOperational = true;
    throw error;
  }
};

router.post('/initiate', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { orderId, method, gateway } = req.body;
    if (!orderId || !PAYMENT_METHODS.includes(method)) {
      return res.status(400).json({ success: false, message: 'Thong tin thanh toan khong hop le.' });
    }
    if (gateway !== undefined && gateway !== null && typeof gateway !== 'string') {
      return res.status(400).json({ success: false, message: 'Cong thanh toan khong hop le.' });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, customer: { userId: req.user.id } },
      include: { payments: { where: { status: { in: ['PENDING', 'SUCCESS'] } }, select: { id: true, status: true } } },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Khong tim thay don hang.' });
    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Don hang khong con o trang thai cho thanh toan.' });
    }
    if (order.payments.some((payment) => payment.status === 'SUCCESS')) {
      return res.status(409).json({ success: false, message: 'Don hang da duoc thanh toan.' });
    }
    if (order.payments.some((payment) => payment.status === 'PENDING')) {
      return res.status(409).json({ success: false, message: 'Don hang dang co giao dich thanh toan cho xu ly.' });
    }

    const payment = await prisma.payment.create({
      data: { orderId, amount: order.totalAmount, method, gateway, status: 'PENDING' },
    });

    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost';
    const paymentUrl = `${clientUrl}/payment/callback?paymentId=${payment.id}&mockStatus=success&amount=${order.totalAmount}`;

    res.json({ success: true, data: { paymentId: payment.id, paymentUrl } });
  } catch (err) { next(err); }
});

if (process.env.NODE_ENV !== 'production') {
  router.post('/mock/complete', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
    try {
      const { paymentId, status = 'success' } = req.body;
      if (!paymentId || !PAYMENT_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Thong tin giao dich khong hop le.' });
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

      const completedPayment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: { include: fullInvoiceInclude } },
      });

      res.json({ success: true, data: { ...completedPayment, order: decryptOrderTickets(completedPayment.order) } });
    } catch (err) { next(err); }
  });
}

router.post('/callback', async (req, res, next) => {
  try {
    if (!verifyPaymentSignature(req.body, req.headers['x-payment-signature'])) {
      return res.status(401).json({ success: false, message: 'Invalid payment signature.' });
    }

    const { paymentId, status, gatewayTxnId } = req.body;
    if (!paymentId || !PAYMENT_STATUSES.includes(status) || !gatewayTxnId) {
      return res.status(400).json({ success: false, message: 'Thong tin callback khong hop le.' });
    }
    await applyPaymentResult({ paymentId, status, gatewayTxnId });

    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/invoices/lookup', async (req, res, next) => {
  try {
    const code = String(req.query.code || '').trim().toUpperCase();
    const phone = req.query.phone;
    if (!code || !phone) {
      return res.status(400).json({ success: false, message: 'Vui long nhap ma hoa don va so dien thoai.' });
    }
    if (!parsePublicCode(code, 'HD')) {
      return res.status(400).json({ success: false, message: 'Ma hoa don khong hop le.' });
    }

    const order = await prisma.order.findFirst({
      where: { publicCode: code },
      include: invoiceInclude,
    });

    const data = decryptOrderTickets(order);
    if (!data || !isInvoicePhoneMatched(data, phone)) {
      return res.status(404).json({ success: false, message: 'Khong tim thay hoa don phu hop voi thong tin da nhap.' });
    }

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

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
