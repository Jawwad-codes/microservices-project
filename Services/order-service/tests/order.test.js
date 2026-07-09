const request = require('supertest');
const app = require('../src/app');

describe('Order Service', () => {
  it('health check should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should reject order creation without auth token', async () => {
    const res = await request(app)
      .post('/orders')
      .send({ productId: 'abc', quantity: 1 });
    expect(res.statusCode).toBe(401);
  });

  it('should reject order history without auth token', async () => {
    const res = await request(app).get('/orders');
    expect(res.statusCode).toBe(401);
  });
});
