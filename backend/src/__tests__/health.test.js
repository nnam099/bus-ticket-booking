const request = require('supertest');
const app = require('../app');

describe('health endpoint', () => {
  it('returns service status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(typeof res.body.timestamp).toBe('string');
  });
});
