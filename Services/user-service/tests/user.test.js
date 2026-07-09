const request = require('supertest');
const app = require('../src/app');

describe('User Service', () => {
  it('health check should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should fail register with invalid email', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: 'Ali', email: 'not-an-email', password: '123456' });
    expect(res.statusCode).toBe(400);
  });

  it('should fail login with short password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'ali@example.com', password: '123' });
    expect(res.statusCode).toBe(400);
  });
});
