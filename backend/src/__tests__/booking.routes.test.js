jest.mock('../services/booking.service', () => ({
  lockSeats: jest.fn(),
  releaseSeats: jest.fn(),
  confirmBooking: jest.fn(),
  cancelTicket: jest.fn(),
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
const app = require('../app');
const bookingService = require('../services/booking.service');

describe('booking routes security rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts cash booking confirmation from customer flow', async () => {
    bookingService.confirmBooking.mockResolvedValue({
      order: { id: 'order-1', status: 'PAID' },
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
    expect(bookingService.confirmBooking).toHaveBeenCalledWith({
      customerId: 'customer-1',
      tripId: 'trip-1',
      seatIds: ['seat-1'],
      passengerInfo: [{ name: 'Nguyen Van A', phone: '0901234567' }],
      paymentMethod: 'CASH',
    });
  });
});
