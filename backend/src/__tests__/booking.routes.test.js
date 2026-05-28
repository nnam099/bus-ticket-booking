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

  it('rejects cash booking confirmation from customer flow', async () => {
    const res = await request(app)
      .post('/api/bookings/confirm')
      .send({
        tripId: 'trip-1',
        seatIds: ['seat-1'],
        passengerInfo: [{ name: 'Nguyen Van A', phone: '0901234567' }],
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(bookingService.confirmBooking).not.toHaveBeenCalled();
  });
});
