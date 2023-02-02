const fs = require('fs');
const fastify = require('fastify');
const appSync = require('./app-sync');
const { getAccountDb } = require('./account-db');
const { getPathForUserFile } = require('./util/paths');

let app;
beforeEach(() => {
  app = fastify().register(appSync);
});
afterEach(() => {
  app.close();
});

describe('/download-user-file', () => {
  describe('default version', () => {
    it('returns 401 if the user is not authenticated', async () => {
      const res = await app.inject().get('/download-user-file').end();

      expect(res.statusCode).toEqual(401);
      expect(JSON.parse(res.body)).toEqual({
        details: 'token-not-found',
        reason: 'unauthorized',
        status: 'error'
      });
    });

    it('returns 401 if the user is invalid', async () => {
      const res = await app
        .inject()
        .get('/download-user-file')
        .headers({ 'x-actual-token': 'invalid-token' })
        .end();

      expect(res.statusCode).toEqual(401);
      expect(JSON.parse(res.body)).toEqual({
        details: 'token-not-found',
        reason: 'unauthorized',
        status: 'error'
      });
    });

    it('returns 400 error if the file does not exist in the database', async () => {
      const res = await app
        .inject()
        .get('/download-user-file')
        .headers({
          'x-actual-token': 'valid-token',
          'x-actual-file-id': 'non-existing-file-id'
        })
        .end();

      expect(res.statusCode).toEqual(400);
    });

    it('returns 500 error if the file does not exist on the filesystem', async () => {
      getAccountDb().mutate(
        'INSERT INTO files (id, deleted) VALUES (?, FALSE)',
        ['missing-fs-file']
      );

      const res = await app
        .inject()
        .get('/download-user-file')
        .headers({
          'x-actual-token': 'valid-token',
          'x-actual-file-id': 'missing-fs-file'
        })
        .end();

      expect(res.statusCode).toEqual(500);
    });

    it('returns an attachment file', async () => {
      fs.writeFileSync(getPathForUserFile('file-id'), 'content');
      getAccountDb().mutate(
        'INSERT INTO files (id, deleted) VALUES (?, FALSE)',
        ['file-id']
      );

      const res = await app
        .inject()
        .get('/download-user-file')
        .headers({
          'x-actual-token': 'valid-token',
          'x-actual-file-id': 'file-id'
        })
        .end();

      expect(res.statusCode).toEqual(200);
      expect(res.headers).toEqual(
        expect.objectContaining({
          'content-disposition': 'attachment;filename=file-id',
          'content-type': 'application/octet-stream'
        })
      );
    });
  });
});
