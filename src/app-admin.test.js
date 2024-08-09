import request from 'supertest';
import { handlers as app } from './app-admin.js';
import getAccountDb from './account-db.js';

const ADMIN_ROLE = '213733c1-5645-46ad-8784-a7b20b400f93';
const BASIC_ROLE = 'e87fa1f1-ac8c-4913-b1b5-1096bdb1eacc';

const createUser = (userId, userName, role, master = 0, enabled = 1) => {
  getAccountDb().mutate(
    'INSERT INTO users (id, user_name, display_name, enabled, master) VALUES (?, ?, ?, ?, ?)',
    [userId, userName, `${userName} display`, enabled, master],
  );
  getAccountDb().mutate(
    'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
    [userId, role],
  );
};

const deleteUser = (userId) => {
  getAccountDb().mutate('DELETE FROM users WHERE id = ?', [userId]);
  getAccountDb().mutate('DELETE FROM user_roles WHERE user_id = ?', [userId]);
};

const setSessionUser = (userId) => {
  getAccountDb().mutate('UPDATE sessions SET user_id = ?', [userId]);
};

describe('/admin', () => {
  beforeEach(() => {
    getAccountDb().mutate('DELETE FROM users');
    getAccountDb().mutate('DELETE FROM user_roles');
    getAccountDb().mutate('DELETE FROM files');
    getAccountDb().mutate('DELETE FROM user_access');
  });

  describe('/masterCreated', () => {
    it('should return 200 and true if a master user is created', async () => {
      createUser('adminId', 'admin', ADMIN_ROLE, 1);

      const res = await request(app)
        .get('/masterCreated')
        .set('x-actual-token', 'valid-token');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(true);
    });

    it('should return 200 and false if no master user is created', async () => {
      const res = await request(app)
        .get('/masterCreated')
        .set('x-actual-token', 'valid-token');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(false);
    });
  });

  describe('/users', () => {
    describe('GET /users', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);

        createUser(testUserId, 'testUser', ADMIN_ROLE);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
      });

      it('should return 200 and a list of users', async () => {
        const res = await request(app)
          .get('/users')
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(2);
      });
    });

    describe('POST /users', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
      });

      it('should return 200 and create a new user', async () => {
        const newUser = {
          userName: 'user1',
          displayName: 'User One',
          enabled: 1,
          master: 0,
          role: BASIC_ROLE,
        };

        const res = await request(app)
          .post('/users')
          .send(newUser)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.data).toHaveProperty('id');
      });

      it('should return 400 if the user already exists', async () => {
        const newUser = {
          userName: 'user1',
          displayName: 'User One',
          enabled: 1,
          master: 0,
          role: BASIC_ROLE,
        };

        await request(app)
          .post('/users')
          .send(newUser)
          .set('x-actual-token', 'valid-token');

        const res = await request(app)
          .post('/users')
          .send(newUser)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('error');
        expect(res.body.reason).toBe('user-already-exists');
      });
    });

    describe('PATCH /users', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);

        createUser(testUserId, 'testUser', ADMIN_ROLE);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
      });

      it('should return 200 and update an existing user', async () => {
        const userToUpdate = {
          id: testUserId,
          userName: 'updatedUser',
          displayName: 'Updated User',
          enabled: true,
          role: BASIC_ROLE,
        };

        const res = await request(app)
          .patch('/users')
          .send(userToUpdate)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.data.id).toBe(testUserId);
      });

      it('should return 400 if the user does not exist', async () => {
        const userToUpdate = {
          id: 'non-existing-id',
          userName: 'nonexistinguser',
          displayName: 'Non-existing User',
          enabled: true,
          role: BASIC_ROLE,
        };

        const res = await request(app)
          .patch('/users')
          .send(userToUpdate)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('error');
        expect(res.body.reason).toBe('cannot-find-user-to-update');
      });
    });

    describe('POST /users/delete-all', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);

        createUser(testUserId, 'testUser', ADMIN_ROLE);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
      });

      it('should return 200 and delete all specified users', async () => {
        const userToDelete = {
          ids: [testUserId],
        };

        const res = await request(app)
          .post('/users/delete-all')
          .send(userToDelete)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.data.someDeletionsFailed).toBe(false);
      });

      it('should return 400 if not all users are deleted', async () => {
        const userToDelete = {
          ids: ['non-existing-id'],
        };

        const res = await request(app)
          .post('/users/delete-all')
          .send(userToDelete)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('error');
        expect(res.body.reason).toBe('not-all-deleted');
      });
    });
  });

  describe('/access', () => {
    describe('GET /access', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';
      const fileId = 'fileId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);

        createUser(testUserId, 'testUser', ADMIN_ROLE);
        getAccountDb().mutate('INSERT INTO files (id, owner) VALUES (?, ?)', [
          fileId,
          sessionUserId,
        ]);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
        getAccountDb().mutate('DELETE FROM files WHERE id = ?', [fileId]);
      });

      it('should return 200 and a list of accesses', async () => {
        const res = await request(app)
          .get('/access')
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([]);
      });

      it('should return 400 if fileId is missing', async () => {
        const res = await request(app)
          .get('/access')
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(400);
      });

      it('should return 200 for a basic user who owns the file', async () => {
        deleteUser(sessionUserId); // Remove the admin user
        createUser(sessionUserId, 'sessionUser', BASIC_ROLE);
        setSessionUser(sessionUserId);
        getAccountDb().mutate('UPDATE files SET owner = ? WHERE id = ?', [
          sessionUserId,
          fileId,
        ]);

        const res = await request(app)
          .get('/access')
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
      });
    });

    describe('POST /access', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';
      const fileId = 'fileId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);

        createUser(testUserId, 'testUser', ADMIN_ROLE);
        getAccountDb().mutate('INSERT INTO files (id, owner) VALUES (?, ?)', [
          fileId,
          sessionUserId,
        ]);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
        getAccountDb().mutate('DELETE FROM files WHERE id = ?', [fileId]);
      });

      it('should return 200 and grant access to a user', async () => {
        const newUserAccess = {
          fileId,
          userId: 'newUserId',
        };

        createUser('newUserId', 'newUser', BASIC_ROLE);

        const res = await request(app)
          .post('/access')
          .send(newUserAccess)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
      });

      it('should return 400 if the user already has access', async () => {
        const newUserAccess = {
          fileId,
          userId: 'newUserId',
        };

        createUser('newUserId', 'newUser', BASIC_ROLE);
        await request(app)
          .post('/access')
          .send(newUserAccess)
          .set('x-actual-token', 'valid-token');

        const res = await request(app)
          .post('/access')
          .send(newUserAccess)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('error');
        expect(res.body.reason).toBe('user-already-have-access');
      });

      it('should return 200 for a basic user who owns the file', async () => {
        deleteUser(sessionUserId); // Remove the admin user
        createUser(sessionUserId, 'sessionUser', BASIC_ROLE);
        setSessionUser(sessionUserId);
        getAccountDb().mutate('UPDATE files SET owner = ? WHERE id = ?', [
          sessionUserId,
          fileId,
        ]);

        const newUserAccess = {
          fileId,
          userId: 'newUserId',
        };

        createUser('newUserId', 'newUser', BASIC_ROLE);

        const res = await request(app)
          .post('/access')
          .send(newUserAccess)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
      });
    });

    describe('DELETE /access', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';
      const fileId = 'fileId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);

        createUser(testUserId, 'testUser', ADMIN_ROLE);
        createUser('newUserId', 'newUser', BASIC_ROLE);
        getAccountDb().mutate('INSERT INTO files (id, owner) VALUES (?, ?)', [
          fileId,
          sessionUserId,
        ]);
        getAccountDb().mutate(
          'INSERT INTO user_access (user_id, file_id) VALUES (?, ?)',
          ['newUserId', fileId],
        );
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
        deleteUser('newUserId');
        getAccountDb().mutate('DELETE FROM files WHERE id = ?', [fileId]);
      });

      it('should return 200 and delete access for the specified user', async () => {
        const deleteAccess = {
          ids: ['newUserId'],
        };

        const res = await request(app)
          .post('/access/delete-all')
          .send(deleteAccess)
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.data.someDeletionsFailed).toBe(false);
      });

      it('should return 400 if not all access deletions are successful', async () => {
        const deleteAccess = {
          ids: ['non-existing-id'],
        };

        const res = await request(app)
          .post('/access/delete-all')
          .send(deleteAccess)
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('error');
        expect(res.body.reason).toBe('not-all-deleted');
      });

      it('should return 200 for a basic user who owns the file', async () => {
        deleteUser(sessionUserId); // Remove the admin user
        createUser(sessionUserId, 'sessionUser', BASIC_ROLE);
        setSessionUser(sessionUserId);
        getAccountDb().mutate('UPDATE files SET owner = ? WHERE id = ?', [
          sessionUserId,
          fileId,
        ]);

        const deleteAccess = {
          ids: ['newUserId'],
        };

        const res = await request(app)
          .post('/access/delete-all')
          .send(deleteAccess)
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.data.someDeletionsFailed).toBe(false);
      });
    });

    describe('GET /access/available-users', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';
      const fileId = 'fileId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);

        createUser(testUserId, 'testUser', ADMIN_ROLE);
        getAccountDb().mutate('INSERT INTO files (id, owner) VALUES (?, ?)', [
          fileId,
          sessionUserId,
        ]);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
        getAccountDb().mutate('DELETE FROM files WHERE id = ?', [fileId]);
      });

      it('should return 200 and a list of available users', async () => {
        const res = await request(app)
          .get('/access/available-users')
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(1);
      });

      it('should return 200 for a basic user who owns the file', async () => {
        deleteUser(sessionUserId); // Remove the admin user
        createUser(sessionUserId, 'sessionUser', BASIC_ROLE);
        setSessionUser(sessionUserId);
        getAccountDb().mutate('UPDATE files SET owner = ? WHERE id = ?', [
          sessionUserId,
          fileId,
        ]);

        const res = await request(app)
          .get('/access/available-users')
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
      });
    });

    describe('GET /access/check-access', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';
      const fileId = 'fileId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);

        createUser(testUserId, 'testUser', ADMIN_ROLE);
        getAccountDb().mutate('INSERT INTO files (id, owner) VALUES (?, ?)', [
          fileId,
          sessionUserId,
        ]);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
        getAccountDb().mutate('DELETE FROM files WHERE id = ?', [fileId]);
      });

      it('should return 200 and check access for the file', async () => {
        const res = await request(app)
          .get('/access/check-access')
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.granted).toBe(true);
      });

      it('should return 400 if the file ID is invalid', async () => {
        const res = await request(app)
          .get('/access/check-access')
          .query({ fileId: 'invalid-file-id' })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(400);
        expect(res.body.reason).toBe('invalid-file-id');
      });

      it('should return 200 for a basic user who owns the file', async () => {
        deleteUser(sessionUserId); // Remove the admin user
        createUser(sessionUserId, 'sessionUser', BASIC_ROLE);
        setSessionUser(sessionUserId);
        getAccountDb().mutate('UPDATE files SET owner = ? WHERE id = ?', [
          sessionUserId,
          fileId,
        ]);

        const res = await request(app)
          .get('/access/check-access')
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.granted).toBe(true);
      });
    });

    describe('POST /access/transfer-ownership', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';
      const fileId = 'fileId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);

        createUser(testUserId, 'testUser', ADMIN_ROLE);
        getAccountDb().mutate('INSERT INTO files (id, owner) VALUES (?, ?)', [
          fileId,
          sessionUserId,
        ]);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
        deleteUser('newUserId');
        getAccountDb().mutate('DELETE FROM files WHERE id = ?', [fileId]);
      });

      it('should return 200 and transfer ownership of the file', async () => {
        const transferOwnership = {
          fileId,
          newUserId: 'newUserId',
        };

        createUser('newUserId', 'newUser', BASIC_ROLE);

        const res = await request(app)
          .post('/access/transfer-ownership')
          .send(transferOwnership)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
      });

      it('should return 400 if the new user does not exist', async () => {
        const transferOwnership = {
          fileId,
          newUserId: 'non-existing-id',
        };

        const res = await request(app)
          .post('/access/transfer-ownership')
          .send(transferOwnership)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(400);
        expect(res.body.reason).toBe('new-user-not-found');
      });

      it('should return 200 for a basic user who owns the file', async () => {
        deleteUser(sessionUserId); // Remove the admin user
        createUser(sessionUserId, 'sessionUser', BASIC_ROLE);
        setSessionUser(sessionUserId);
        getAccountDb().mutate('UPDATE files SET owner = ? WHERE id = ?', [
          sessionUserId,
          fileId,
        ]);

        const transferOwnership = {
          fileId,
          newUserId: 'newUserId',
        };

        createUser('newUserId', 'newUser', BASIC_ROLE);

        const res = await request(app)
          .post('/access/transfer-ownership')
          .send(transferOwnership)
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
      });
    });

    describe('GET /file/owner', () => {
      const sessionUserId = 'sessionUserId';
      const testUserId = 'testUserId';
      const fileId = 'fileId';

      beforeEach(() => {
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        setSessionUser(sessionUserId);

        createUser(testUserId, 'testUser', ADMIN_ROLE);
        getAccountDb().mutate('INSERT INTO files (id, owner) VALUES (?, ?)', [
          fileId,
          sessionUserId,
        ]);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
        getAccountDb().mutate('DELETE FROM files WHERE id = ?', [fileId]);
      });

      it('should return 200 and the owner of the file', async () => {
        const res = await request(app)
          .get('/file/owner')
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id');
      });

      it('should return 400 if the file ID is invalid', async () => {
        const res = await request(app)
          .get('/file/owner')
          .query({ fileId: 'invalid-file-id' })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(400);
        expect(res.body.reason).toBe('invalid-file-id');
      });

      it('should return 200 for a basic user who owns the file', async () => {
        deleteUser(sessionUserId); // Remove the admin user
        createUser(sessionUserId, 'sessionUser', BASIC_ROLE);
        setSessionUser(sessionUserId);
        getAccountDb().mutate('UPDATE files SET owner = ? WHERE id = ?', [
          sessionUserId,
          fileId,
        ]);

        const res = await request(app)
          .get('/file/owner')
          .query({ fileId })
          .set('x-actual-token', 'valid-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id');
      });
    });
  });

  describe('Token expired', () => {
    beforeEach(() => {
      getAccountDb().mutate('UPDATE sessions SET expires_at = 0');
    });

    afterEach(() => {
      getAccountDb().mutate('UPDATE sessions SET expires_at = -1');
    });

    const endpoints = [
      { method: 'get', url: '/users/' },
      { method: 'post', url: '/users' },
      { method: 'patch', url: '/users' },
      { method: 'post', url: '/users/delete-all' },
      { method: 'post', url: '/access' },
      { method: 'post', url: '/access/delete-all' },
      { method: 'get', url: '/access/available-users' },
      { method: 'get', url: '/access/check-access' },
      { method: 'post', url: '/access/transfer-ownership/' },
      { method: 'get', url: '/file/owner' },
    ];

    endpoints.forEach((endpoint) => {
      it(`should return 403 for ${endpoint.method.toUpperCase()} ${
        endpoint.url
      }`, async () => {
        const method = request(app)[endpoint.method];
        const res = await method(endpoint.url).set(
          'x-actual-token',
          'valid-token',
        );
        expect(res.statusCode).toEqual(403);
        expect(res.body.reason).toEqual('token-expired');
      });
    });
  });

  describe('Unauthorized access', () => {
    const sessionUserId = 'sessionUserId';
    beforeEach(() => {
      createUser(sessionUserId, 'sessionUser', BASIC_ROLE);
      setSessionUser(sessionUserId);
    });

    afterEach(() => {
      deleteUser(sessionUserId);
    });

    const endpoints = [
      { method: 'post', url: '/users' },
      { method: 'patch', url: '/users' },
      { method: 'post', url: '/users/delete-all' },
    ];

    endpoints.forEach((endpoint) => {
      it(`should return 401 for ${endpoint.method.toUpperCase()} ${
        endpoint.url
      }`, async () => {
        const method = request(app)[endpoint.method];
        const res = await method(endpoint.url).set(
          'x-actual-token',
          'valid-token',
        );
        expect(res.statusCode).toEqual(401);
        expect(res.body.reason).toEqual('unauthorized');
        expect(res.body.details).toEqual('permission-not-found');
      });
    });
  });

  describe('File denied access', () => {
    const sessionUserId = 'sessionUserId';
    beforeEach(() => {
      createUser(sessionUserId, 'sessionUser', BASIC_ROLE);
      setSessionUser(sessionUserId);
    });

    afterEach(() => {
      deleteUser(sessionUserId);
    });

    const endpoints = [
      { method: 'post', url: '/access' },
      { method: 'post', url: '/access/delete-all' },
      { method: 'get', url: '/access/available-users' },
      { method: 'post', url: '/access/transfer-ownership/' },
      { method: 'get', url: '/file/owner' },
    ];

    endpoints.forEach((endpoint) => {
      it(`should return 400 for ${endpoint.method.toUpperCase()} ${
        endpoint.url
      }`, async () => {
        const method = request(app)[endpoint.method];
        const res = await method(endpoint.url).set(
          'x-actual-token',
          'valid-token',
        );
        expect(res.statusCode).toEqual(400);
        expect(res.body.reason).toEqual('file-denied');
      });
    });
  });

  describe('Invalid file ID', () => {
    const sessionUserId = 'sessionUserId';
    beforeEach(() => {
      createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
      setSessionUser(sessionUserId);
    });

    afterEach(() => {
      deleteUser(sessionUserId);
    });

    const endpoints = [
      { method: 'post', url: '/access' },
      { method: 'post', url: '/access/delete-all' },
      { method: 'get', url: '/access/available-users' },
      { method: 'post', url: '/access/transfer-ownership/' },
      { method: 'get', url: '/file/owner' },
      { method: 'get', url: '/access/check-access' },
    ];

    endpoints.forEach((endpoint) => {
      it(`should return 400 for ${endpoint.method.toUpperCase()} ${
        endpoint.url
      }`, async () => {
        const method = request(app)[endpoint.method];
        const res = await method(endpoint.url).set(
          'x-actual-token',
          'valid-token',
        );
        expect(res.statusCode).toEqual(400);
        expect(res.body.reason).toEqual('invalid-file-id');
      });
    });
  });
});
