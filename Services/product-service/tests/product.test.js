const request = require('supertest');
const app = require('../src/app');

describe('Product Service', () => {
  it('health check should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should reject product creation without auth token', async () => {
    const res = await request(app)
      .post('/products')
      .send({ name: 'Laptop', price: 1000 });
    expect(res.statusCode).toBe(401);
  });

  it('should list products (empty or otherwise) without auth', async () => {
    const res = await request(app).get('/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
  });
});
