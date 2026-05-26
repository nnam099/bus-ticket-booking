jest.mock('../config/prisma', () => ({
  trip: {
    findFirst: jest.fn(),
  },
  tripSeat: {
    updateMany: jest.fn(),
    findMany: jest.fn(),
  },
  ticketDetail: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock('../config/redis', () => ({
  redisClient: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('../config/socket', () => ({
  getIo: jest.fn(),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const prisma = require('../config/prisma');
const { redisClient } = require('../config/redis');
const { getIo } = require('../config/socket');
const QRCode = require('qrcode');
const {
  lockSeats,
  releaseExpiredSeatLocks,
  confirmBooking,
  cancelTicket,
} = require('../services/booking.service');

const futureDate = (hours = 48) => new Date(Date.now() + hours * 60 * 60 * 1000);
const pastDate = () => new Date(Date.now() - 60 * 60 * 1000);

describe('booking business rules', () => {
  let tx;
  let emit;
  let toRoom;

  beforeEach(() => {
    jest.clearAllMocks();

    tx = {
      tripSeat: {
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      ticketDetail: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      order: {
        create: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    QRCode.toDataURL.mockResolvedValue('data:image/png;base64,qr');

    emit = jest.fn();
    toRoom = jest.fn(() => ({ emit }));
    getIo.mockReturnValue({ to: toRoom });
  });

  it('locks available seats successfully', async () => {
    prisma.trip.findFirst.mockResolvedValue({ id: 'trip-1' });
    redisClient.set.mockResolvedValue('OK');
    prisma.tripSeat.updateMany.mockResolvedValue({ count: 2 });

    const result = await lockSeats('trip-1', ['seat-1', 'seat-2'], 'customer-1');

    expect(result.seatIds).toEqual(['seat-1', 'seat-2']);
    expect(result.lockExpiresAt).toBeInstanceOf(Date);
    expect(redisClient.set).toHaveBeenCalledTimes(2);
    expect(prisma.tripSeat.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ['seat-1', 'seat-2'] }, tripId: 'trip-1', status: 'AVAILABLE' },
      data: expect.objectContaining({
        status: 'PROCESSING',
        lockedBy: 'customer-1',
      }),
    }));
    expect(emit).toHaveBeenCalledWith('seats:updated', {
      seatIds: ['seat-1', 'seat-2'],
      status: 'PROCESSING',
    });
  });

  it('creates a paid cash booking and books the seat', async () => {
    redisClient.get.mockResolvedValue('customer-1');
    tx.tripSeat.findMany.mockResolvedValue([
      { id: 'seat-1', trip: { basePrice: 320000 } },
    ]);
    tx.ticketDetail.findMany.mockResolvedValue([]);
    tx.order.create.mockResolvedValue({ id: 'order-1', status: 'PAID', totalAmount: 320000 });
    tx.ticketDetail.create.mockResolvedValue({ id: 'ticket-1', status: 'PAID' });

    const result = await confirmBooking({
      customerId: 'customer-1',
      tripId: 'trip-1',
      seatIds: ['seat-1'],
      passengerInfo: [{ name: ' Nguyen Van A ', phone: ' 0901234567 ' }],
      paymentMethod: 'CASH',
    });

    expect(result.order).toMatchObject({ id: 'order-1', status: 'PAID' });
    expect(tx.order.create).toHaveBeenCalledWith({
      data: { customerId: 'customer-1', totalAmount: 320000, status: 'PAID' },
    });
    expect(tx.ticketDetail.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        tripSeatId: 'seat-1',
        passengerName: 'Nguyen Van A',
        passengerPhone: '0901234567',
        price: 320000,
        status: 'PAID',
      }),
    });
    expect(tx.tripSeat.update).toHaveBeenCalledWith({
      where: { id: 'seat-1' },
      data: { status: 'BOOKED', lockedBy: null, lockedAt: null, lockExpiresAt: null },
    });
    expect(redisClient.del).toHaveBeenCalledWith('seat_lock:trip-1:seat-1');
  });

  it('rejects a booking when the seat already has an active ticket', async () => {
    redisClient.get.mockResolvedValue('customer-1');
    tx.tripSeat.findMany.mockResolvedValue([
      { id: 'seat-1', trip: { basePrice: 320000 } },
    ]);
    tx.ticketDetail.findMany.mockResolvedValue([{ tripSeatId: 'seat-1' }]);

    await expect(confirmBooking({
      customerId: 'customer-1',
      tripId: 'trip-1',
      seatIds: ['seat-1'],
      passengerInfo: [{ name: 'A', phone: '0901234567' }],
      paymentMethod: 'CASH',
    })).rejects.toThrow(/ghe da co ve/);

    expect(tx.order.create).not.toHaveBeenCalled();
    expect(tx.ticketDetail.create).not.toHaveBeenCalled();
  });

  it('rejects confirmation when the seat hold has expired', async () => {
    redisClient.get.mockResolvedValue(null);

    await expect(confirmBooking({
      customerId: 'customer-1',
      tripId: 'trip-1',
      seatIds: ['seat-1'],
      passengerInfo: [{ name: 'A', phone: '0901234567' }],
      paymentMethod: 'CASH',
    })).rejects.toThrow();

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('releases expired seat holds', async () => {
    prisma.tripSeat.findMany.mockResolvedValue([
      { id: 'seat-1', tripId: 'trip-1' },
      { id: 'seat-2', tripId: 'trip-1' },
    ]);
    prisma.tripSeat.updateMany.mockResolvedValue({ count: 2 });

    const count = await releaseExpiredSeatLocks();

    expect(count).toBe(2);
    expect(prisma.tripSeat.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['seat-1', 'seat-2'] }, status: 'PROCESSING' },
      data: { status: 'AVAILABLE', lockedAt: null, lockedBy: null, lockExpiresAt: null },
    });
    expect(emit).toHaveBeenCalledWith('seats:updated', {
      seatIds: ['seat-1', 'seat-2'],
      status: 'AVAILABLE',
    });
  });

  it('cancels a paid ticket before departure and creates a refund', async () => {
    prisma.ticketDetail.findFirst.mockResolvedValue({
      id: 'ticket-1',
      orderId: 'order-1',
      tripSeatId: 'seat-1',
      status: 'PAID',
      price: 320000,
      order: { customerId: 'customer-1', customer: {} },
      tripSeat: { trip: { departureTime: futureDate(48) } },
    });
    tx.ticketDetail.count.mockResolvedValue(0);

    const result = await cancelTicket('ticket-1', 'customer-1');

    expect(result).toEqual({ refundAmount: 320000, refundRate: 1 });
    expect(tx.ticketDetail.update).toHaveBeenCalledWith({
      where: { id: 'ticket-1' },
      data: expect.objectContaining({ status: 'REFUNDED', cancelledAt: expect.any(Date) }),
    });
    expect(tx.tripSeat.update).toHaveBeenCalledWith({
      where: { id: 'seat-1' },
      data: { status: 'AVAILABLE', lockedBy: null, lockExpiresAt: null },
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'REFUNDED' },
    });
    expect(tx.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        amount: -320000,
        method: 'REFUND',
        status: 'REFUNDED',
        refundAmount: 320000,
      }),
    });
  });

  it('does not allow cancellation after departure', async () => {
    prisma.ticketDetail.findFirst.mockResolvedValue({
      id: 'ticket-1',
      orderId: 'order-1',
      tripSeatId: 'seat-1',
      status: 'PAID',
      price: 320000,
      order: { customerId: 'customer-1', customer: {} },
      tripSeat: { trip: { departureTime: pastDate() } },
    });

    await expect(cancelTicket('ticket-1', 'customer-1')).rejects.toThrow();

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
