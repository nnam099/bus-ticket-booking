jest.mock('../config/prisma', () => ({
  ticketDetail: {
    findFirst: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const request = require('supertest');
const prisma = require('../config/prisma');
const app = require('../app');
const { createPublicCode } = require('../utils/security');

const makeTicket = () => ({
  id: 'ticket-123',
  publicCode: createPublicCode('VE', 'ticket-123'),
  passengerPhone: '0901234567',
  order: {
    customer: {
      user: {
        phone: '0987654321',
        email: 'customer@example.com',
      },
    },
    payments: [],
  },
  tripSeat: {
    seatLayout: { seatCode: 'A1' },
    trip: {
      route: { operator: {} },
      vehicle: { vehicleType: {} },
    },
  },
});

describe('ticket lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a ticket when code and phone match', async () => {
    const ticket = makeTicket();
    prisma.ticketDetail.findFirst.mockResolvedValue(ticket);

    const res = await request(app)
      .get('/api/tickets/lookup')
      .query({ code: ticket.publicCode, phone: '0901234567' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ id: 'ticket-123' });
    expect(prisma.ticketDetail.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { publicCode: ticket.publicCode },
    }));
  });

  it('does not return a ticket when the phone is wrong', async () => {
    const ticket = makeTicket();
    prisma.ticketDetail.findFirst.mockResolvedValue(ticket);

    const res = await request(app)
      .get('/api/tickets/lookup')
      .query({ code: ticket.publicCode, phone: '0911111111' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
