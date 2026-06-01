jest.mock('../config/prisma', () => ({
  trip: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  ticketDetail: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../services/booking.service', () => ({
  lockSeats: jest.fn(),
  releaseSeats: jest.fn(),
  confirmBooking: jest.fn(),
  cancelTicket: jest.fn(),
}));

jest.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req, _res, next) => {
    const role = req.headers['x-test-role'] || 'CUSTOMER';
    req.roles = [role];
    req.user = {
      id: 'user-1',
      customer: { id: 'customer-1' },
      staff: { id: 'staff-1' },
      busOperator: { id: 'operator-1', isApproved: true },
    };
    next();
  },
  authorize: (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.some((role) => req.roles.includes(role))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return next();
  },
  requireApprovedOperator: (_req, _res, next) => next(),
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const request = require('supertest');
const prisma = require('../config/prisma');
const bookingService = require('../services/booking.service');
const app = require('../app');

describe('demo booking flow routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches scheduled trips for the public search page', async () => {
    const trip = {
      id: 'trip-1',
      departureTime: '2026-06-10T00:00:00.000Z',
      route: { originCity: 'TP. Ho Chi Minh', destinationCity: 'Da Lat' },
      vehicle: { vehicleType: { name: 'Limousine 22' } },
      _count: { tripSeats: 20 },
    };
    prisma.trip.findMany.mockResolvedValue([trip]);

    const res = await request(app)
      .get('/api/trips/search')
      .query({ origin: 'Ho Chi Minh', destination: 'Da Lat', date: '2026-06-10' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([trip]);
    expect(prisma.trip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: { in: ['SCHEDULED', 'BOARDING'] },
        route: expect.objectContaining({
          originCity: { contains: 'Ho Chi Minh', mode: 'insensitive' },
          destinationCity: { contains: 'Da Lat', mode: 'insensitive' },
        }),
      }),
    }));
  });

  it('locks selected seats before payment', async () => {
    const lockResult = { seatIds: ['seat-1', 'seat-2'], lockExpiresAt: new Date().toISOString() };
    bookingService.lockSeats.mockResolvedValue(lockResult);

    const res = await request(app)
      .post('/api/bookings/lock')
      .send({ tripId: 'trip-1', seatIds: ['seat-1', 'seat-2'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(lockResult);
    expect(bookingService.lockSeats).toHaveBeenCalledWith('trip-1', ['seat-1', 'seat-2'], 'customer-1');
  });

  it('confirms a cash booking without creating an online payment', async () => {
    bookingService.confirmBooking.mockResolvedValue({
      order: { id: 'order-1', status: 'PAID', totalAmount: 320000 },
      tickets: [{ id: 'ticket-1', status: 'PAID', passengerName: 'Nguyen Van A', passengerPhone: '0901234567' }],
    });

    const res = await request(app)
      .post('/api/bookings/confirm')
      .send({
        tripId: 'trip-1',
        seatIds: ['seat-1'],
        passengerInfo: [{ name: 'Nguyen Van A', phone: '0901234567' }],
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order).toMatchObject({ id: 'order-1', status: 'PAID' });
    expect(bookingService.confirmBooking).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'customer-1',
      tripId: 'trip-1',
      seatIds: ['seat-1'],
      paymentMethod: 'CASH',
    }));
  });

  it('checks in a paid ticket for assigned staff', async () => {
    prisma.ticketDetail.findUnique.mockResolvedValue({
      id: 'ticket-1',
      status: 'PAID',
      tripSeat: { id: 'seat-1', tripId: 'trip-1' },
    });
    prisma.trip.findFirst.mockResolvedValue({ id: 'trip-1' });
    prisma.ticketDetail.update.mockResolvedValue({
      id: 'ticket-1',
      status: 'CHECKED_IN',
      checkedInAt: new Date(),
    });

    const res = await request(app)
      .patch('/api/tickets/ticket-1/check-in')
      .set('x-test-role', 'STAFF');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ id: 'ticket-1', status: 'CHECKED_IN' });
    expect(prisma.trip.findFirst).toHaveBeenCalledWith({
      where: { id: 'trip-1', tripStaffs: { some: { staffId: 'staff-1' } } },
      select: { id: true },
    });
    expect(prisma.ticketDetail.update).toHaveBeenCalledWith({
      where: { id: 'ticket-1' },
      data: { checkedInAt: expect.any(Date), status: 'CHECKED_IN' },
    });
  });
});
