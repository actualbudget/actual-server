import request from 'supertest';
import { handlers as app } from '../../app-simplefin.js';
describe('/status endpoint', () => {
  it('should return invalid token response', async () => {
    const res = await request(app).post('/status');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      status: 'ok',
      data: {
        configured: false,
      },
    });
  });
});

describe('/accounts endpoint', () => {
  it('should return invalid token response', async () => {
    const res = await request(app).post('/accounts');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      status: 'ok',
      data: {
        error_type: 'INVALID_ACCESS_TOKEN',
        error_code: 'INVALID_ACCESS_TOKEN',
        status: 'rejected',
        reason:
          'Invalid SimpleFIN access token.  Reset the token and re-link any broken accounts.',
      },
    });
  });
});

describe('/transactions endpoint', () => {
  it('should return invalid token response', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({ accountId: 'test-account-id', startDate: '2023-01-01' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      status: 'ok',
      data: {
        error_type: 'INVALID_ACCESS_TOKEN',
        error_code: 'INVALID_ACCESS_TOKEN',
        status: 'rejected',
        reason:
          'Invalid SimpleFIN access token.  Reset the token and re-link any broken accounts.',
      },
    });
  });
});
