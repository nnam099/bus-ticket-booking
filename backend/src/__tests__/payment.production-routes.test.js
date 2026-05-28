const previousNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'production';

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');

describe('payment production routes', () => {
  afterAll(() => {
    process.env.NODE_ENV = previousNodeEnv;
  });

  it('does not register the mock payment completion endpoint in production', async () => {
    const res = await request(app)
      .post('/api/payments/mock/complete')
      .send({ paymentId: 'payment-1', status: 'success' });

    expect(res.status).toBe(404);
  });
});
