jest.mock('../config/prisma', () => ({
  payment: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock('../config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'user-1' };
    req.roles = ['CUSTOMER'];
    next();
  },
  authorize: () => (_req, _res, next) => next(),
  requireApprovedOperator: (_req, _res, next) => next(),
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const request = require('supertest');
const prisma = require('../config/prisma');
const { redisClient } = require('../config/redis');
const app = require('../app');

const futureDate = () => new Date(Date.now() + 60 * 60 * 1000);

const makePayment = () => ({
  id: 'payment-1',
  orderId: 'order-1',
  status: 'PENDING',
  order: {
    id: 'order-1',
    customerId: 'customer-1',
    status: 'PENDING',
    ticketDetails: [
      {
        id: 'ticket-1',
        status: 'PENDING',
        tripSeatId: 'seat-1',
        tripSeat: {
          id: 'seat-1',
          tripId: 'trip-1',
          status: 'PROCESSING',
          lockedBy: 'customer-1',
          lockExpiresAt: futureDate(),
          trip: {
            status: 'SCHEDULED',
            departureTime: futureDate(),
          },
        },
      },
    ],
  },
});

describe('payment routes business rules', () => {
  let tx;

  beforeEach(() => {
    jest.clearAllMocks();

    tx = {
      payment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      order: {
        update: jest.fn(),
      },
      ticketDetail: {
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      tripSeat: {
        updateMany: jest.fn(),
      },
    };
    tx.payment.findFirst.mockResolvedValue(null);

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    prisma.payment.findFirst.mockResolvedValue({ id: 'payment-1' });
    prisma.payment.findUnique.mockResolvedValue({ id: 'payment-1', order: { id: 'order-1' } });
    redisClient.get.mockResolvedValue('customer-1');
  });

  it('completes a successful payment and books seats', async () => {
    tx.payment.findUnique.mockResolvedValue(makePayment());
    tx.tripSeat.updateMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post('/api/payments/mock/complete')
      .send({ paymentId: 'payment-1', status: 'success' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({ status: 'SUCCESS', gatewayTxnId: expect.stringMatching(/^mock_/) }),
    });
    expect(tx.tripSeat.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['seat-1'] }, status: 'PROCESSING', lockedBy: 'customer-1' },
      data: { status: 'BOOKED', lockedBy: null, lockedAt: null, lockExpiresAt: null },
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'PAID' },
    });
    expect(tx.ticketDetail.updateMany).toHaveBeenCalledWith({
      where: { orderId: 'order-1' },
      data: { status: 'PAID' },
    });
    expect(redisClient.del).toHaveBeenCalledWith('seat_lock:trip-1:seat-1');
  });

  it('fails a payment and releases pending seats', async () => {
    tx.payment.findUnique.mockResolvedValue(makePayment());

    const res = await request(app)
      .post('/api/payments/mock/complete')
      .send({ paymentId: 'payment-1', status: 'failed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({ status: 'FAILED', gatewayTxnId: expect.stringMatching(/^mock_/) }),
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'CANCELLED' },
    });
    expect(tx.ticketDetail.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['ticket-1'] }, status: 'PENDING' },
    });
    expect(tx.tripSeat.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['seat-1'] }, status: 'PROCESSING', lockedBy: 'customer-1' },
      data: { status: 'AVAILABLE', lockedBy: null, lockedAt: null, lockExpiresAt: null },
    });
    expect(redisClient.del).toHaveBeenCalledWith('seat_lock:trip-1:seat-1');
  });
});
