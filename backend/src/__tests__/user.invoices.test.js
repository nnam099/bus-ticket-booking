jest.mock('../config/prisma', () => ({
  order: {
    findMany: jest.fn(),
  },
}));

jest.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'user-1', customer: { id: 'customer-1' } };
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
const app = require('../app');

describe('customer invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns invoices for the authenticated customer', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        publicCode: 'HD-DEMO.123456',
        customerId: 'customer-1',
        totalAmount: 320000,
        status: 'PAID',
        createdAt: new Date().toISOString(),
        payments: [
          {
            id: 'payment-1',
            method: 'CASH',
            status: 'SUCCESS',
            amount: 320000,
            createdAt: new Date().toISOString(),
          },
        ],
        ticketDetails: [
          {
            id: 'ticket-1',
            publicCode: 'VE-DEMO.123456',
            passengerName: 'Nguyen Van A',
            passengerPhone: '0901234567',
            price: 320000,
            status: 'PAID',
            tripSeat: {
              seatLayout: { seatCode: 'A1', floor: 1 },
              trip: {
                route: {
                  originCity: 'Ho Chi Minh',
                  destinationCity: 'Da Lat',
                  operator: { id: 'operator-1', companyName: 'Demo Bus', hotline: '1900' },
                },
                vehicle: {
                  id: 'vehicle-1',
                  licensePlate: '51B-12345',
                  vehicleType: { name: 'Limousine 22', seatCount: 22 },
                },
              },
            },
          },
        ],
      },
    ]);

    const res = await request(app).get('/api/users/me/invoices');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id: 'order-1',
      publicCode: 'HD-DEMO.123456',
      status: 'PAID',
    });
    expect(res.body.data[0].ticketDetails[0]).toMatchObject({
      id: 'ticket-1',
      publicCode: 'VE-DEMO.123456',
      passengerName: 'Nguyen Van A',
    });
    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { customerId: 'customer-1' },
    }));
  });

  it('returns an empty list when the customer has no invoices', async () => {
    prisma.order.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/users/me/invoices');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: [] });
  });
});
