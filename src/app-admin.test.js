import request from 'supertest';
import { handlers as app } from './app-admin.js';
import getAccountDb from './account-db.js';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_ROLE = '213733c1-5645-46ad-8784-a7b20b400f93';
const BASIC_ROLE = 'e87fa1f1-ac8c-4913-b1b5-1096bdb1eacc';

const createUser = (userId, userName, role, owner = 0, enabled = 1) => {
  getAccountDb().mutate(
    'INSERT INTO users (id, user_name, display_name, enabled, owner) VALUES (?, ?, ?, ?, ?)',
    [userId, userName, `${userName} display`, enabled, owner],
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

const createSession = (userId, sessionToken) => {
  getAccountDb().mutate(
    'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
    [sessionToken, userId, Date.now() + 1000 * 60 * 60], // Expire in 1 hour
  );
};

const generateSessionToken = () => `token-${uuidv4()}`;

describe('/admin', () => {
  describe('/ownerCreated', () => {
    it('should return 200 and true if a owner user is created', async () => {
      const sessionToken = generateSessionToken();
      const adminId = uuidv4();
      createUser(adminId, 'admin', ADMIN_ROLE, 1);
      createSession(adminId, sessionToken);

      const res = await request(app)
        .get('/ownerCreated')
        .set('x-actual-token', sessionToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(true);
    });
  });

  describe('/users', () => {
    describe('GET /users', () => {
      let sessionUserId, testUserId, sessionToken;

      beforeEach(() => {
        sessionUserId = uuidv4();
        testUserId = uuidv4();
        sessionToken = generateSessionToken();

        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        createSession(sessionUserId, sessionToken);
        createUser(testUserId, 'testUser', ADMIN_ROLE);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
      });

      it('should return 200 and a list of users', async () => {
        const res = await request(app)
          .get('/users')
          .set('x-actual-token', sessionToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBeGreaterThan(0);
      });
    });

    describe('POST /users', () => {
      let sessionUserId, sessionToken;

      beforeEach(() => {
        sessionUserId = uuidv4();
        sessionToken = generateSessionToken();
        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        createSession(sessionUserId, sessionToken);
      });

      afterEach(() => {
        deleteUser(sessionUserId);
      });

      it('should return 200 and create a new user', async () => {
        const newUser = {
          userName: 'user1',
          displayName: 'User One',
          enabled: 1,
          owner: 0,
          role: BASIC_ROLE,
        };

        const res = await request(app)
          .post('/users')
          .send(newUser)
          .set('x-actual-token', sessionToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.data).toHaveProperty('id');
      });

      it('should return 400 if the user already exists', async () => {
        const newUser = {
          userName: 'user1',
          displayName: 'User One',
          enabled: 1,
          owner: 0,
          role: BASIC_ROLE,
        };

        await request(app)
          .post('/users')
          .send(newUser)
          .set('x-actual-token', sessionToken);

        const res = await request(app)
          .post('/users')
          .send(newUser)
          .set('x-actual-token', sessionToken);

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('error');
        expect(res.body.reason).toBe('user-already-exists');
      });
    });

    describe('PATCH /users', () => {
      let sessionUserId, testUserId, sessionToken;

      beforeEach(() => {
        sessionUserId = uuidv4();
        testUserId = uuidv4();
        sessionToken = generateSessionToken();

        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        createSession(sessionUserId, sessionToken);
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
          .set('x-actual-token', sessionToken);

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
          .set('x-actual-token', sessionToken);

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('error');
        expect(res.body.reason).toBe('cannot-find-user-to-update');
      });
    });

    describe('POST /users/delete-all', () => {
      let sessionUserId, testUserId, sessionToken;

      beforeEach(() => {
        sessionUserId = uuidv4();
        testUserId = uuidv4();
        sessionToken = generateSessionToken();

        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        createSession(sessionUserId, sessionToken);
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
          .set('x-actual-token', sessionToken);

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
          .set('x-actual-token', sessionToken);

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('error');
        expect(res.body.reason).toBe('not-all-deleted');
      });
    });
  });

  describe('/access', () => {
    describe('GET /access', () => {
      let sessionUserId, testUserId, fileId, sessionToken;

      beforeEach(() => {
        sessionUserId = uuidv4();
        testUserId = uuidv4();
        fileId = uuidv4();
        sessionToken = generateSessionToken();

        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        createSession(sessionUserId, sessionToken);
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
          .set('x-actual-token', sessionToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([]);
      });

      it('should return 400 if fileId is missing', async () => {
        const res = await request(app)
          .get('/access')
          .set('x-actual-token', sessionToken);

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('POST /access', () => {
      let sessionUserId, testUserId, fileId, sessionToken;

      beforeEach(() => {
        sessionUserId = uuidv4();
        testUserId = uuidv4();
        fileId = uuidv4();
        sessionToken = generateSessionToken();

        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        createSession(sessionUserId, sessionToken);
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
          userId: 'newUserId1',
        };

        createUser('newUserId1', 'newUser', BASIC_ROLE);

        const res = await request(app)
          .post('/access')
          .send(newUserAccess)
          .set('x-actual-token', sessionToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ok');
      });

      it('should return 400 if the user already has access', async () => {
        const newUserAccess = {
          fileId,
          userId: 'newUserId2',
        };

        createUser('newUserId2', 'newUser', BASIC_ROLE);
        await request(app)
          .post('/access')
          .send(newUserAccess)
          .set('x-actual-token', sessionToken);

        const res = await request(app)
          .post('/access')
          .send(newUserAccess)
          .set('x-actual-token', sessionToken);

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('error');
        expect(res.body.reason).toBe('user-already-have-access');
      });
    });

    describe('DELETE /access', () => {
      let sessionUserId, testUserId, fileId, sessionToken;

      beforeEach(() => {
        sessionUserId = uuidv4();
        testUserId = uuidv4();
        fileId = uuidv4();
        sessionToken = generateSessionToken();

        createUser(sessionUserId, 'sessionUser', ADMIN_ROLE);
        createSession(sessionUserId, sessionToken);
        createUser(testUserId, 'testUser', ADMIN_ROLE);
        createUser('newUserId3', 'newUser', BASIC_ROLE);
        getAccountDb().mutate('INSERT INTO files (id, owner) VALUES (?, ?)', [
          fileId,
          sessionUserId,
        ]);
        getAccountDb().mutate(
          'INSERT INTO user_access (user_id, file_id) VALUES (?, ?)',
          ['newUserId3', fileId],
        );
      });

      afterEach(() => {
        deleteUser(sessionUserId);
        deleteUser(testUserId);
        deleteUser('newUserId3');
        getAccountDb().mutate('DELETE FROM files WHERE id = ?', [fileId]);
      });

      it('should return 200 and delete access for the specified user', async () => {
        const deleteAccess = {
          ids: ['newUserId3'],
        };

        const res = await request(app)
          .post('/access/delete-all')
          .send(deleteAccess)
          .query({ fileId })
          .set('x-actual-token', sessionToken);

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
          .set('x-actual-token', sessionToken);

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toBe('error');
        expect(res.body.reason).toBe('not-all-deleted');
      });
    });
  });
});
