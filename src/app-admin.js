import express from 'express';
import * as uuid from 'uuid';
import {
  errorMiddleware,
  requestLoggerMiddleware,
  validateSessionMiddleware,
} from './util/middlewares.js';
import validateSession from './util/validate-user.js';
import { isAdmin } from './account-db.js';
import config from './load-config.js';
import UserService from './services/user-service.js';

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorMiddleware);
app.use(requestLoggerMiddleware);

export { app as handlers };

app.get('/ownerCreated/', (req, res) => {
  const { ownerCount } = UserService.getOwnerCount() || {};
  res.json(ownerCount > 0);
});

app.get('/users/', await validateSessionMiddleware, (req, res) => {
  const users = UserService.getAllUsers();
  res.json(
    users.map((u) => ({
      ...u,
      owner: u.owner === 1,
      enabled: u.enabled === 1,
    })),
  );
});

app.post('/users', validateSessionMiddleware, async (req, res) => {
  if (!isAdmin(req.userSession.user_id)) {
    res.status(401).send({
      status: 'error',
      reason: 'unauthorized',
      details: 'permission-not-found',
    });
    return;
  }

  const newUser = req.body;

  if (!newUser.userName) {
    res.status(400).send({
      status: 'error',
      reason: 'user-cant-be-empty',
      details: 'Username cannot be empty',
    });
    return;
  }

  if (!newUser.role) {
    res.status(400).send({
      status: 'error',
      reason: 'role-cant-be-empty',
      details: 'Role cannot be empty',
    });
    return;
  }

  const { id: roleIdFromDb } = UserService.validateRole(newUser.role) || {};

  if (!roleIdFromDb) {
    res.status(400).send({
      status: 'error',
      reason: 'role-does-not-exists',
      details: 'Selected role does not exist',
    });
    return;
  }

  const { id: userIdInDb } = UserService.getUserByUsername(newUser.userName);

  if (userIdInDb) {
    res.status(400).send({
      status: 'error',
      reason: 'user-already-exists',
      details: `User ${newUser.userName} already exists`,
    });
    return;
  }

  const userId = uuid.v4();
  let displayName = newUser.displayName || null;
  let enabled = newUser.enabled ? 1 : 0;

  UserService.insertUser(userId, newUser.userName, displayName, enabled);
  UserService.insertUserRole(userId, newUser.role);

  res.status(200).send({ status: 'ok', data: { id: userId } });
});

app.patch('/users', validateSessionMiddleware, async (req, res) => {
  if (!isAdmin(req.userSession.user_id)) {
    res.status(401).send({
      status: 'error',
      reason: 'unauthorized',
      details: 'permission-not-found',
    });
    return;
  }

  const userToUpdate = req.body;
  const { id: userIdInDb } = UserService.getUserByUsername(userToUpdate.id);

  if (!userToUpdate.userName) {
    res.status(400).send({
      status: 'error',
      reason: 'user-cant-be-empty',
      details: 'Username cannot be empty',
    });
    return;
  }

  if (!userToUpdate.role) {
    res.status(400).send({
      status: 'error',
      reason: 'role-cant-be-empty',
      details: 'Role cannot be empty',
    });
    return;
  }

  const { id: roleIdFromDb } =
    UserService.validateRole(userToUpdate.role) || {};

  if (!roleIdFromDb) {
    res.status(400).send({
      status: 'error',
      reason: 'role-does-not-exists',
      details: 'Selected role does not exist',
    });
    return;
  }

  if (!userIdInDb) {
    res.status(400).send({
      status: 'error',
      reason: 'cannot-find-user-to-update',
      details: `Cannot find ${userToUpdate.userName} to update`,
    });
    return;
  }

  let displayName = userToUpdate.displayName || null;
  let enabled = userToUpdate.enabled ? 1 : 0;

  UserService.updateUser(
    userIdInDb,
    userToUpdate.userName,
    displayName,
    enabled,
  );
  UserService.updateUserRole(userIdInDb, userToUpdate.role);

  res.status(200).send({ status: 'ok', data: { id: userIdInDb } });
});

app.post('/users/delete-all', validateSessionMiddleware, async (req, res) => {
  if (!isAdmin(req.userSession.user_id)) {
    res.status(401).send({
      status: 'error',
      reason: 'unauthorized',
      details: 'permission-not-found',
    });
    return;
  }

  const ids = req.body.ids;
  let totalDeleted = 0;
  ids.forEach((item) => {
    const { id: ownerId } = UserService.getOwnerCount() || {};

    if (item === ownerId) return;

    UserService.deleteUserRoles(item);
    UserService.deleteUserAccess(item);
    UserService.updateFileOwner(ownerId, item);
    const usersDeleted = UserService.deleteUser(item);
    totalDeleted += usersDeleted;
  });

  if (ids.length === totalDeleted) {
    res
      .status(200)
      .send({ status: 'ok', data: { someDeletionsFailed: false } });
  } else {
    res.status(400).send({
      status: 'error',
      reason: 'not-all-deleted',
      details: '',
    });
  }
});

app.get('/access', validateSessionMiddleware, (req, res) => {
  const fileId = req.query.fileId;

  const { id: fileIdInDb } = UserService.getFileById(fileId);
  if (!fileIdInDb) {
    res.status(400).send({
      status: 'error',
      reason: 'invalid-file-id',
      details: 'File not found at server',
    });
    return false;
  }

  const accesses = UserService.getUserAccess(
    fileId,
    req.userSession.user_id,
    isAdmin(req.userSession.user_id),
  );

  res.json(accesses);
});

function checkFilePermission(fileId, userId, res) {
  const { granted } = UserService.checkFilePermission(fileId, userId) || {
    granted: 0,
  };

  if (granted === 0 && !isAdmin(userId)) {
    res.status(400).send({
      status: 'error',
      reason: 'file-denied',
      details: "You don't have permissions over this file",
    });
    return false;
  }

  const { id: fileIdInDb } = UserService.getFileById(fileId);
  if (!fileIdInDb) {
    res.status(400).send({
      status: 'error',
      reason: 'invalid-file-id',
      details: 'File not found at server',
    });
    return false;
  }

  return true;
}

app.post('/access', (req, res) => {
  const userAccess = req.body || {};
  const session = validateSession(req, res);

  if (!session) return;

  if (!checkFilePermission(userAccess.fileId, session.user_id, res)) return;

  if (!userAccess.userId) {
    res.status(400).send({
      status: 'error',
      reason: 'user-cant-be-empty',
      details: 'User cannot be empty',
    });
    return;
  }

  if (
    UserService.countUserAccess(userAccess.fileId, userAccess.userId, false) > 0
  ) {
    res.status(400).send({
      status: 'error',
      reason: 'user-already-have-access',
      details: 'User already have access',
    });
    return;
  }

  UserService.addUserAccess(userAccess.userId, userAccess.fileId);

  res.status(200).send({ status: 'ok', data: {} });
});

app.delete('/access', (req, res) => {
  const fileId = req.query.fileId;
  const session = validateSession(req, res);
  if (!session) return;

  if (!checkFilePermission(fileId, session.user_id, res)) return;

  const ids = req.body.ids;
  let totalDeleted = UserService.deleteUserAccessByIds(ids);

  if (ids.length === totalDeleted) {
    res
      .status(200)
      .send({ status: 'ok', data: { someDeletionsFailed: false } });
  } else {
    res.status(400).send({
      status: 'error',
      reason: 'not-all-deleted',
      details: '',
    });
  }
});

app.get('/access/users', validateSessionMiddleware, async (req, res) => {
  const fileId = req.query.fileId;

  if (!checkFilePermission(fileId, req.userSession.user_id, res)) return;

  const users = UserService.getAllUserAccess(fileId);
  res.json(users);
});

app.get('/multiuser', (req, res) => {
  res.json(config.multiuser);
});

app.use(errorMiddleware);
