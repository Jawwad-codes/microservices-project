const request = require('supertest');
const app = require('../src/app');

describe('Notification Service', () => {
  it('health check should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should log and return success when notifying', async () => {
    const res = await request(app)
      .post('/notify')
      .send({ email: 'jawwad@gmail.com', message: 'Order placed' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.email).toBe('jawwad@gmail.com');
  });
});
