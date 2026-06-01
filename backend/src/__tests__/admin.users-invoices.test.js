jest.mock('../config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
  },
}));

jest.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'admin-1' };
    req.roles = ['ADMIN'];
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

describe('admin user invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns invoices for a customer user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'customer@example.com',
      phone: '0901234567',
      customer: { id: 'customer-1', fullName: 'Nguyen Van A' },
    });
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        publicCode: 'HD-DEMO.123456',
        customerId: 'customer-1',
        totalAmount: 320000,
        status: 'PAID',
        createdAt: new Date().toISOString(),
        payments: [{ id: 'payment-1', method: 'CASH', status: 'SUCCESS', createdAt: new Date().toISOString() }],
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
                route: { originCity: 'Ho Chi Minh', destinationCity: 'Da Lat', operator: { companyName: 'Demo Bus' } },
                vehicle: { licensePlate: '51B-12345', vehicleType: { name: 'Limousine 22' } },
              },
            },
          },
        ],
      },
    ]);

    const res = await request(app).get('/api/admin/users/user-1/invoices');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ id: 'user-1' });
    expect(res.body.data.invoices).toHaveLength(1);
    expect(res.body.data.invoices[0]).toMatchObject({ id: 'order-1', status: 'PAID' });
    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { customerId: 'customer-1' },
    }));
  });

  it('returns an empty invoice list for non-customer users', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'operator-user-1',
      email: 'operator@example.com',
      phone: null,
      customer: null,
    });

    const res = await request(app).get('/api/admin/users/operator-user-1/invoices');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { user: { id: 'operator-user-1' }, invoices: [] },
    });
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });
});
