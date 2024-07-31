import request from 'supertest';
import { handlers as app } from './app-admin.js';
import getAccountDb from './account-db.js';

describe('/admin', () => {
  describe('/masterCreated', () => {
    it('returns 200 and true if a master user is created', async () => {
      getAccountDb().mutate(
        "INSERT INTO users (id, user_name, display_name, enabled, master) VALUES ('', 'admin', '', 1, 1)",
      );

      const res = await request(app)
        .get('/masterCreated')
        .set('x-actual-token', 'valid-token');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(true);
    });

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
      // const users = [
      //   {
      //     id: '1',
      //     userName: 'user1',
      //     displayName: 'User One',
      //     enabled: 1,
      //     master: 0,
      //     role: 'e87fa1f1-ac8c-4913-b1b5-1096bdb1eacc',
      //   },
      // ];
      const res = await request(app)
        .get('/users')
        .set('x-actual-token', 'valid-token');

      expect(res.statusCode).toEqual(200);
    });
  });

  // describe('/users (POST)', () => {
  //   it('returns 200 and creates a new user', async () => {
  //     const newUser = {
  //       userName: 'newuser',
  //       displayName: 'New User',
  //       enabled: true,
  //       role: 'e87fa1f1-ac8c-4913-b1b5-1096bdb1eacc',
  //     };

  //     const res = await request(app)
  //       .post('/users')
  //       .set('x-actual-token', 'valid-token')
  //       .send(newUser);

  //     console.log(res.body.data);

  //     expect(res.statusCode).toEqual(200);
  //     expect(res.body.status).toBe('ok');
  //     expect(res.body.data).toHaveProperty('id');
  //   });

  //   it('returns 400 if the user already exists', async () => {
  //     const newUser = {
  //       userName: 'existinguser',
  //       displayName: 'Existing User',
  //       enabled: true,
  //       role: 'e87fa1f1-ac8c-4913-b1b5-1096bdb1eacc',
  //     };

  //     const res = await request(app)
  //       .post('/users')
  //       .set('x-actual-token', 'valid-token')
  //       .send(newUser);

  //     expect(res.statusCode).toEqual(400);
  //     expect(res.body.status).toBe('error');
  //     expect(res.body.reason).toBe('user-already-exists');
  //   });
  // });

  // describe('/users (PATCH)', () => {
  //   it('returns 200 and updates an existing user', async () => {
  //     const userToUpdate = {
  //       id: 'existing-id',
  //       userName: 'updateduser',
  //       displayName: 'Updated User',
  //       enabled: true,
  //       role: 'e87fa1f1-ac8c-4913-b1b5-1096bdb1eacc',
  //     };

  //     const res = await request(app)
  //       .patch('/users')
  //       .set('x-actual-token', 'valid-token')
  //       .send(userToUpdate);

  //     expect(res.statusCode).toEqual(200);
  //     expect(res.body.status).toBe('ok');
  //     expect(res.body.data.id).toBe('existing-id');
  //   });

  //   it('returns 400 if the user does not exist', async () => {
  //     const userToUpdate = {
  //       id: 'non-existing-id',
  //       userName: 'nonexistinguser',
  //       displayName: 'Non-existing User',
  //       enabled: true,
  //       role: 'e87fa1f1-ac8c-4913-b1b5-1096bdb1eacc',
  //     };

  //     const res = await request(app)
  //       .patch('/users')
  //       .set('x-actual-token', 'valid-token')
  //       .send(userToUpdate);

  //     expect(res.statusCode).toEqual(400);
  //     expect(res.body.status).toBe('error');
  //     expect(res.body.reason).toBe('cannot-find-user-to-update');
  //   });
  // });
});
