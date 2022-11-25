const fs = require('fs');
const request = require('supertest');
const { handlers: app } = require('./app-sync');
const { getAccountDb } = require('./account-db');
const { getPathForUserFile } = require('./util/paths');

describe('/download-user-file', () => {
  describe('default version', () => {
    it('returns 401 if the user is not authenticated', async () => {
      const res = await request(app).get('/download-user-file');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({
        details: 'token-not-found',
        reason: 'unauthorized',
        status: 'error'
      });
    });

    it('returns 401 if the user is invalid', async () => {
      const res = await request(app)
        .get('/download-user-file')
        .set('x-actual-token', 'invalid-token');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({
        details: 'token-not-found',
        reason: 'unauthorized',
        status: 'error'
      });
    });

    it('returns 400 error if the file does not exist in the database', async () => {
      const res = await request(app)
        .get('/download-user-file')
        .set('x-actual-token', 'valid-token')
        .set('x-actual-file-id', 'non-existing-file-id');

      expect(res.statusCode).toEqual(400);
    });

    it('returns 500 error if the file does not exist on the filesystem', async () => {
      getAccountDb().mutate(
        'INSERT INTO files (id, deleted) VALUES (?, FALSE)',
        ['missing-fs-file']
      );

      const res = await request(app)
        .get('/download-user-file')
        .set('x-actual-token', 'valid-token')
        .set('x-actual-file-id', 'missing-fs-file');

      expect(res.statusCode).toEqual(500);
    });

    it('returns an attachment file', async () => {
      fs.writeFileSync(getPathForUserFile('file-id'), 'content');
      getAccountDb().mutate(
        'INSERT INTO files (id, deleted) VALUES (?, FALSE)',
        ['file-id']
      );

      const res = await request(app)
        .get('/download-user-file')
        .set('x-actual-token', 'valid-token')
        .set('x-actual-file-id', 'file-id');

      expect(res.statusCode).toEqual(200);
      expect(res.headers).toEqual(
        expect.objectContaining({
          'content-disposition': 'attachment;filename=file-id',
          'content-type': 'application/octet-stream'
        })
      );
    });
  });

  // TODO: build the synced-up database support and enable the test cases
  // Versioning example: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/locking-api-versions.html
  describe('TBD-date (2022-11-25) version', () => {
    it.todo('returns 401 if the user is not authenticated');
    it.todo('returns 401 if the user is invalid');
    it.todo('returns 400 error if the file does not exist in the database');
    it.todo('returns 500 error if the file does not exist on the filesystem');
    it.todo('returns a synced-up database attachment file');
  });
});
