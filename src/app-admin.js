import express from 'express';
import * as uuid from 'uuid';
import errorMiddleware from './util/error-middleware.js';
import validateUser from './util/validate-user.js';
import getAccountDb, { isAdmin } from './account-db.js';
import config from './load-config.js';

let app = express();
app.use(errorMiddleware);

export { app as handlers };

export const TOKEN_EXPIRATION_NEVER = -1;

const sendErrorResponse = (res, status, reason, details) => {
  res.status(status).send({
    status: 'error',
    reason,
    details,
  });
};

const getUserByUsername = (userName) => {
  return (
    getAccountDb().first('SELECT id FROM users WHERE user_name = ?', [
      userName,
    ]) || {}
  );
};

const getFileById = (fileId) => {
  return (
    getAccountDb().first('SELECT id FROM files WHERE files.id = ?', [fileId]) ||
    {}
  );
};

const getSessionFromRequest = (req, res) => {
  let session = validateUser(req, res);
  if (!session) {
    return null;
  }

  if (!isAdmin(session.user_id)) {
    sendErrorResponse(res, 401, 'unauthorized', 'permission-not-found');
    return null;
  }

  return session;
};

const validateUserInput = (res, user) => {
  if (!user.userName) {
    sendErrorResponse(
      res,
      400,
      'user-cant-be-empty',
      'Username cannot be empty',
    );
    return false;
  }

  if (!user.role) {
    sendErrorResponse(res, 400, 'role-cant-be-empty', 'Role cannot be empty');
    return false;
  }

  const { id: roleId } =
    getAccountDb().first('SELECT id FROM roles WHERE roles.id = ?', [
      user.role,
    ]) || {};

  if (!roleId) {
    sendErrorResponse(
      res,
      400,
      'role-does-not-exists',
      'Selected role does not exists',
    );
    return false;
  }

  return true;
};

app.get('/masterCreated/', (req, res) => {
  const { cnt } =
    getAccountDb().first(
      `SELECT count(*) as cnt
     FROM users
     WHERE users.user_name <> ''`,
    ) || {};

  res.json(cnt > 0);
});

app.get('/users/', (req, res) => {
  const users = getAccountDb().all(
    `SELECT users.id, user_name as userName, display_name as displayName, enabled, ifnull(master,0) as master, roles.id as role 
     FROM users
     JOIN user_roles ON user_roles.user_id = users.id
     JOIN roles ON roles.id = user_roles.role_id
     WHERE users.user_name <> ''`,
  );

  res.json(
    users.map((u) => ({
      ...u,
      master: u.master === 1,
      enabled: u.enabled === 1,
    })),
  );
});

app.post('/users', (req, res) => {
  const user = getSessionFromRequest(req, res);
  if (!user) return;

  const newUser = req.body;
  const { id: userIdInDb } = getUserByUsername(newUser.userName);

  if (!validateUserInput(res, newUser)) return;
  if (userIdInDb) {
    sendErrorResponse(
      res,
      400,
      'user-already-exists',
      `User ${newUser.userName} already exists`,
    );
    return;
  }

  const userId = uuid.v4();
  let displayName = newUser.displayName || null;
  let enabled = newUser.enabled ? 1 : 0;

  getAccountDb().mutate(
    'INSERT INTO users (id, user_name, display_name, enabled, master) VALUES (?, ?, ?, ?, 0)',
    [userId, newUser.userName, displayName, enabled],
  );

  getAccountDb().mutate(
    'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
    [userId, newUser.role],
  );

  res.status(200).send({ status: 'ok', data: { id: userId } });
});

app.patch('/users', (req, res) => {
  const user = getSessionFromRequest(req, res);
  if (!user) return;

  const userToUpdate = req.body;
  const { id: userIdInDb } =
    getAccountDb().first('SELECT id FROM users WHERE id = ?', [
      userToUpdate.id,
    ]) || {};

  if (!validateUserInput(res, userToUpdate)) return;
  if (!userIdInDb) {
    sendErrorResponse(
      res,
      400,
      'cannot-find-user-to-update',
      `Cannot find ${userToUpdate.userName} to update`,
    );
    return;
  }

  let displayName = userToUpdate.displayName || null;
  let enabled = userToUpdate.enabled ? 1 : 0;

  getAccountDb().mutate(
    'UPDATE users SET user_name = ?, display_name = ?, enabled = ? WHERE id = ?',
    [userToUpdate.userName, displayName, enabled, userIdInDb],
  );

  getAccountDb().mutate('UPDATE user_roles SET role_id = ? WHERE user_id = ?', [
    userToUpdate.role,
    userIdInDb,
  ]);

  res.status(200).send({ status: 'ok', data: { id: userIdInDb } });
});

app.post('/users/delete-all', (req, res) => {
  const user = getSessionFromRequest(req, res);
  if (!user) return;

  const ids = req.body.ids;
  let totalDeleted = 0;
  ids.forEach((item) => {
    const { id: masterId } =
      getAccountDb().first('SELECT id FROM users WHERE master = 1') || {};

    if (item === masterId) return;

    getAccountDb().mutate('DELETE FROM user_roles WHERE user_id = ?', [item]);
    getAccountDb().mutate('DELETE FROM user_access WHERE user_id = ?', [item]);
    getAccountDb().mutate('UPDATE files set owner = ? WHERE owner = ?', [
      masterId,
      item,
    ]);
    const usersDeleted = getAccountDb().mutate(
      'DELETE FROM users WHERE id = ? and master = 0',
      [item],
    ).changes;
    totalDeleted += usersDeleted;
  });

  if (ids.length === totalDeleted) {
    res
      .status(200)
      .send({ status: 'ok', data: { someDeletionsFailed: false } });
  } else {
    sendErrorResponse(res, 400, 'not-all-deleted', '');
  }
});

app.get('/access', (req, res) => {
  const fileId = req.query.fileId;
  const session = validateUser(req, res);
  if (!session || !fileId) return;

  const accesses = getAccountDb().all(
    `SELECT users.id as userId, user_name as userName, files.owner, display_name as displayName
     FROM users
     JOIN user_access ON user_access.user_id = users.id
     JOIN files ON files.id = user_access.file_id
     WHERE files.id = ? and (files.owner = ? OR 1 = ?)`,
    [fileId, session.user_id, !isAdmin(session.user_id) ? 0 : 1],
  );

  res.json(accesses);
});

app.post('/access', (req, res) => {
  const userAccess = req.body || {};
  const session = validateUser(req, res);
  if (!session || !userAccess.fileId) return;

  const { id: fileIdInDb } = getFileById(userAccess.fileId);
  if (!fileIdInDb) {
    sendErrorResponse(res, 400, 'invalid-file-id', 'File not found at server');
    return;
  }

  const { granted } =
    getAccountDb().first(
      `SELECT 1 as granted
     FROM files
     WHERE files.id = ? and (files.owner = ? OR 1 = ?)`,
      [userAccess.fileId, session.user_id, !isAdmin(session.user_id) ? 0 : 1],
    ) || {};

  if (granted === 0) {
    sendErrorResponse(
      res,
      400,
      'file-denied',
      "You don't have permissions over this file",
    );
    return;
  }

  if (!userAccess.userId) {
    sendErrorResponse(res, 400, 'user-cant-be-empty', 'User cannot be empty');
    return;
  }

  const { cnt } =
    getAccountDb().first(
      'SELECT count(*) AS cnt FROM user_access WHERE user_access.file_id = ? and user_access.user_id = ?',
      [userAccess.fileId, userAccess.userId],
    ) || {};

  if (cnt > 0) {
    sendErrorResponse(
      res,
      400,
      'user-already-have-access',
      'User already have access',
    );
    return;
  }

  getAccountDb().mutate(
    'INSERT INTO user_access (user_id, file_id) VALUES (?, ?)',
    [userAccess.userId, userAccess.fileId],
  );

  res.status(200).send({ status: 'ok', data: {} });
});

app.post('/access/delete-all', (req, res) => {
  const fileId = req.query.fileId;
  const session = validateUser(req, res);
  if (!session) return;

  const { id: fileIdInDb } = getFileById(fileId);
  if (!fileIdInDb) {
    sendErrorResponse(res, 400, 'invalid-file-id', 'File not found at server');
    return;
  }

  const { granted } =
    getAccountDb().first(
      `SELECT 1 as granted
     FROM files
     WHERE files.id = ? and (files.owner = ? OR 1 = ?)`,
      [fileId, session.user_id, !isAdmin(session.user_id) ? 0 : 1],
    ) || {};

  if (granted === 0) {
    sendErrorResponse(
      res,
      400,
      'file-denied',
      "You don't have permissions over this file",
    );
    return;
  }

  const ids = req.body.ids;
  let totalDeleted = 0;
  ids.forEach((item) => {
    const accessDeleted = getAccountDb().mutate(
      'DELETE FROM user_access WHERE user_id = ?',
      [item],
    ).changes;
    totalDeleted += accessDeleted;
  });

  if (ids.length === totalDeleted) {
    res
      .status(200)
      .send({ status: 'ok', data: { someDeletionsFailed: false } });
  } else {
    sendErrorResponse(res, 400, 'not-all-deleted', '');
  }
});

app.get('/access/available-users', (req, res) => {
  const fileId = req.query.fileId;
  const session = validateUser(req, res);
  if (!session || !fileId) return;

  let canListAvailableUser = isAdmin(session.user_id);
  if (!canListAvailableUser) {
    const { canListAvaiableUserFromDB } =
      getAccountDb().first(
        `SELECT count(*) as canListAvaiableUserFromDB
       FROM files
       WHERE files.id = ? and files.owner = ?`,
        [fileId, session.user_id],
      ) || {};
    canListAvailableUser = canListAvaiableUserFromDB === 1;
  }

  if (canListAvailableUser) {
    const users = getAccountDb().all(
      `SELECT users.id as userId, user_name as userName, display_name as displayName
       FROM users
       WHERE NOT EXISTS (SELECT 1 
                         FROM user_access 
                         WHERE user_access.file_id = ? and user_access.user_id = users.id)
       AND NOT EXISTS (SELECT 1
                       FROM files
                       WHERE files.id = ? AND files.owner = users.id)
       AND users.enabled = 1 AND users.user_name <> '' AND users.id <> ?`,
      [fileId, fileId, session.user_id],
    );
    res.json(users);
  }
  return null;
});

app.post('/access/get-bulk', (req, res) => {
  const fileIds = req.body || {};
  const accessMap = new Map();

  fileIds.forEach((fileId) => {
    const userAccess = getAccountDb().all(
      `SELECT user_access.file_id as fileId, user_access.user_id as userId, users.display_name as displayName, users.user_name as userName
       FROM users
       JOIN user_access ON user_access.user_id = users.id
       WHERE user_access.file_id = ?
       UNION
       SELECT files.id, users.id, users.display_name, users.user_name
       FROM users
       JOIN files ON files.owner = users.id
       WHERE files.id = ?`,
      [fileId, fileId],
    );
    accessMap.set(fileId, userAccess);
  });

  res.status(200).send({ status: 'ok', data: Array.from(accessMap.entries()) });
});

app.get('/access/check-access', (req, res) => {
  const fileId = req.query.fileId;
  const session = validateUser(req, res);
  if (!session || !fileId) return;

  if (isAdmin(session.user_id)) {
    res.json({ granted: true });
    return;
  }

  const { owner } =
    getAccountDb().first(
      `SELECT files.owner
     FROM files
     WHERE files.id = ?`,
      [fileId],
    ) || {};

  res.json({ granted: owner === session.user_id });
});

app.post('/access/transfer-ownership/', (req, res) => {
  const newUserOwner = req.body || {};
  const session = validateUser(req, res);
  if (!session || !newUserOwner.fileId) return;

  const { id: fileIdInDb } = getFileById(newUserOwner.fileId);
  if (!fileIdInDb) {
    sendErrorResponse(res, 400, 'invalid-file-id', 'File not found at server');
    return;
  }

  const { granted } =
    getAccountDb().first(
      `SELECT 1 as granted
     FROM files
     WHERE files.id = ? and (files.owner = ? OR 1 = ?)`,
      [newUserOwner.fileId, session.user_id, !isAdmin(session.user_id) ? 0 : 1],
    ) || {};

  if (granted === 0) {
    sendErrorResponse(
      res,
      400,
      'file-denied',
      "You don't have permissions over this file",
    );
    return;
  }

  if (!newUserOwner.newUserId) {
    sendErrorResponse(res, 400, 'user-cant-be-empty', 'User cannot be empty');
    return;
  }

  const { cnt } =
    getAccountDb().first(
      'SELECT count(*) AS cnt FROM users WHERE users.id = ?',
      [newUserOwner.newUserId],
    ) || {};

  if (cnt === 0) {
    sendErrorResponse(res, 400, 'new-user-not-found', 'New user not found');
    return;
  }

  getAccountDb().mutate('UPDATE files SET owner = ? WHERE id = ?', [
    newUserOwner.newUserId,
    newUserOwner.fileId,
  ]);

  res.status(200).send({ status: 'ok', data: {} });
});

app.get('/file/owner', (req, res) => {
  const fileId = req.query.fileId;
  const session = validateUser(req, res);
  if (!session || !fileId) return;

  let canGetOwner = isAdmin(session.user_id);
  if (!canGetOwner) {
    const { canListAvaiableUserFromDB } =
      getAccountDb().first(
        `SELECT count(*) as canListAvaiableUserFromDB
       FROM files
       WHERE files.id = ? and files.owner = ?`,
        [fileId, session.user_id],
      ) || {};
    canGetOwner = canListAvaiableUserFromDB === 1;
  }

  if (canGetOwner) {
    const owner =
      getAccountDb().first(
        `SELECT users.id, users.user_name userName, users.display_name as displayName
     FROM files
      JOIN users
      ON users.id = files.owner
     WHERE files.id = ?`,
        [fileId],
      ) || {};

    res.json(owner);
  }

  return null;
});

app.get('/auth-mode', (req, res) => {
  const { method } =
    getAccountDb().first(
      `SELECT method from auth
        where active = 1`,
    ) || {};

  res.json({ method });
});

app.get('/multiuser', (req, res) => {
  res.json(config.multiuser);
});

app.use(errorMiddleware);
