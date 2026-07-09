const request = require('supertest');
const app = require('../src/app');

describe('Payment Service', () => {
  it('health check should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should return success for a fake payment', async () => {
    const res = await request(app)
      .post('/pay')
      .send({ orderId: 'order123', amount: 500 });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
  });
});
