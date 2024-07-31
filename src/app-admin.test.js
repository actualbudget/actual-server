import request from 'supertest';
import { handlers as app } from './app-sync.js';

describe('/admin', () => {
  describe('/masterCreated', () => {
    it('returns 200 and false if no master user is created', async () => {
      const res = await request(app)
        .get('/masterCreated')
        .set('x-actual-token', 'valid-token');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(false);
    });
  });

  describe('/users', () => {
    it('returns 200 and a list of users', async () => {
      const res = await request(app)
        .get('/users')
        .set('x-actual-token', 'valid-token');

      expect(res.statusCode).toEqual(200);
    });
  });
});
