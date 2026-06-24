const request = require('supertest');
const jwt = require('jsonwebtoken');

// 1. Giả lập Redis Client ngay lập tức để không cố kết nối đến Redis server (do Docker không bật)
jest.mock('../config/redis', () => {
  const locks = new Set();
  return {
    connectRedis: jest.fn().mockResolvedValue(true),
    redisClient: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(async (key, value, options) => {
        if (options && options.NX) {
          if (locks.has(key)) return null; // Lock failed (already exists)
          locks.add(key);
          return 'OK'; // Lock acquired
        }
        return 'OK';
      }),
      del: jest.fn(async (key) => {
        locks.delete(key);
      }),
      quit: jest.fn().mockResolvedValue(true),
    }
  };
});

const app = require('../app');
const prisma = require('../config/prisma');
const { redisClient } = require('../config/redis');

describe('Booking Concurrency & Race Condition Tests', () => {
  jest.setTimeout(30000);
  let tripId;
  let seatId;
  let tokens = [];

  // Setup trước khi chạy test
  beforeAll(async () => {
    // Lấy 1 chuyến xe đang mở bán
    const minDepartureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Ngày mai
    const trip = await prisma.trip.findFirst({
      where: {
        status: 'SCHEDULED',
        departureTime: { gt: minDepartureTime },
        route: { isActive: true, operator: { isApproved: true } }
      },
      include: {
        tripSeats: {
          where: { status: 'AVAILABLE' },
          take: 1
        }
      }
    });

    if (!trip || trip.tripSeats.length === 0) {
      throw new Error('Không tìm thấy dữ liệu Trip/Seat hợp lệ để test.');
    }

    tripId = trip.id;
    seatId = trip.tripSeats[0].id;

    // Đảm bảo có role CUSTOMER
    let customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
    if (!customerRole) {
      customerRole = await prisma.role.create({ data: { name: 'CUSTOMER', description: 'Customer' } });
    }

    // Tạo nhanh 3 user (mock data)
    const mockUsers = [];
    for (let i = 1; i <= 3; i++) {
      const email = `test.concurrency.user${i}@demo.vn`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            passwordHash: 'dummy',
            phone: `099900${i}${Math.floor(Date.now() / 1000)}`,
            isActive: true,
            userRoles: {
              create: { roleId: customerRole.id }
            },
            customer: {
              create: {
                fullName: `Test User ${i}`
              }
            }
          }
        });
      }
      mockUsers.push(user);
    }

    // Tạo JWT token cho 3 customer
    const JWT_SECRET = process.env.JWT_SECRET;
    tokens = mockUsers.map(user => {
      return jwt.sign(
        { userId: user.id, email: user.email, roles: ['CUSTOMER'] },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
    });
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu DB: Nhả ghế về AVAILABLE
    await prisma.tripSeat.update({
      where: { id: seatId },
      data: {
        status: 'AVAILABLE',
        lockedBy: null,
        lockedAt: null,
        lockExpiresAt: null
      }
    });

    await prisma.$disconnect();
  });

  it('[Race-condition] Should allow only 1 user to lock the seat when 3 users request simultaneously', async () => {
    // Giả lập 3 request đến API cùng lúc (cùng 1 mili-giây)
    const requests = tokens.map(token =>
      request(app)
        .post('/api/bookings/lock')
        .set('Authorization', `Bearer ${token}`)
        .send({ tripId, seatIds: [seatId] })
    );

    const responses = await Promise.all(requests);

    // Kiểm tra kết quả
    const successResponses = responses.filter(res => res.status === 200);
    const failedResponses = responses.filter(res => res.status === 400 || res.status === 409 || res.status === 500);

    // Kì vọng: Chỉ đúng 1 người đặt được (200 OK)
    expect(successResponses.length).toBe(1);
    
    // Kì vọng: 2 người kia bị báo lỗi
    expect(failedResponses.length).toBe(2);

    // Kiểm tra Error Message của request thất bại
    const errorMsg = failedResponses[0].body.error || failedResponses[0].body.message;
    expect(errorMsg).toMatch(/đã được người khác chọn|Một hoặc nhiều ghế không còn khả dụng/i);
    
    // Kiểm tra DB xem ghế đã được chuyển sang PROCESSING chưa
    const seatInDb = await prisma.tripSeat.findUnique({ where: { id: seatId } });
    expect(seatInDb.status).toBe('PROCESSING');
    expect(seatInDb.lockedBy).not.toBeNull();
  });
});
