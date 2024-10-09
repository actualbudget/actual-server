import getAccountDb from '../account-db.js';

export function getUserByUsername(userName) {
  const { id } =
    getAccountDb().first('SELECT id FROM users WHERE user_name = ?', [
      userName,
    ]) || {};
  return id;
}

export function getUserById(userId) {
  const { id } =
    getAccountDb().first('SELECT id FROM users WHERE id = ?', [userId]) || {};
  return id;
}

export function getFileById(fileId) {
  const { id } =
    getAccountDb().first('SELECT id FROM files WHERE files.id = ?', [
      fileId,
    ]) || {};
  return id;
}

export function validateRole(roleId) {
  const { id } =
    getAccountDb().first('SELECT id FROM roles WHERE roles.id = ?', [
      roleId,
    ]) || {};
  return id;
}

export function getOwnerCount() {
  const { ownerCount } =
    getAccountDb().first(
      `SELECT count(*) as ownerCount FROM users WHERE users.user_name <> '' and users.owner = 1`,
    ) || {};
  return ownerCount || 0;
}

export function getOwnerId() {
  const { id } =
    getAccountDb().first(
      `SELECT users.id FROM users WHERE users.user_name <> '' and users.owner = 1`,
    ) || {};
  return id;
}

export function getFileOwnerId(fileId) {
  const { owner } =
    getAccountDb().first(`SELECT files.owner FROM files WHERE files.id = ?`, [
      fileId,
    ]) || {};
  return owner;
}

export function getFileOwnerById(fileId) {
  const { id, userName, displayName } =
    getAccountDb().first(
      `SELECT users.id, users.user_name userName, users.display_name as displayName
       FROM files
       JOIN users ON users.id = files.owner
       WHERE files.id = ?`,
      [fileId],
    ) || {};
  return { id, userName, displayName };
}

export function getAllUsers() {
  return getAccountDb().all(
    `SELECT users.id, user_name as userName, display_name as displayName, enabled, ifnull(owner,0) as owner, roles.id as role
     FROM users
     JOIN user_roles ON user_roles.user_id = users.id
     JOIN roles ON roles.id = user_roles.role_id
     WHERE users.user_name <> ''`,
  );
}

export function insertUser(userId, userName, displayName, enabled) {
  getAccountDb().mutate(
    'INSERT INTO users (id, user_name, display_name, enabled, owner) VALUES (?, ?, ?, ?, 0)',
    [userId, userName, displayName, enabled],
  );
}

export function insertUserRole(userId, roleId) {
  getAccountDb().mutate(
    'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
    [userId, roleId],
  );
}

export function updateUser(userId, userName, displayName, enabled) {
  getAccountDb().mutate(
    'UPDATE users SET user_name = ?, display_name = ?, enabled = ? WHERE id = ?',
    [userName, displayName, enabled, userId],
  );
}

export function updateUserRole(userId, roleId) {
  getAccountDb().mutate(
    'UPDATE user_roles SET role_id = ? WHERE user_id = ?',
    [roleId, userId],
  );
}

export function updateUserWithRole(userId, userName, displayName, enabled, roleId) {
  getAccountDb().transaction(() => {
    getAccountDb().mutate(
      'UPDATE users SET user_name = ?, display_name = ?, enabled = ? WHERE id = ?',
      [userName, displayName, enabled, userId],
    );
    getAccountDb().mutate(
      'UPDATE user_roles SET role_id = ? WHERE user_id = ?',
      [roleId, userId],
    );
  });
}

export function deleteUser(userId) {
  return getAccountDb().mutate(
    'DELETE FROM users WHERE id = ? and owner = 0',
    [userId],
  ).changes;
}

export function deleteUserRoles(userId) {
  getAccountDb().mutate('DELETE FROM user_roles WHERE user_id = ?', [userId]);
}

export function deleteUserAccess(userId) {
  getAccountDb().mutate('DELETE FROM user_access WHERE user_id = ?', [
    userId,
  ]);
}

export function transferAllFilesFromUser(ownerId, oldUserId) {
  getAccountDb().mutate('UPDATE files set owner = ? WHERE owner = ?', [
    ownerId,
    oldUserId,
  ]);
}

export function updateFileOwner(ownerId, fileId) {
  getAccountDb().mutate('UPDATE files set owner = ? WHERE id = ?', [
    ownerId,
    fileId,
  ]);
}

export function getUserAccess(fileId, userId, isAdmin) {
  return getAccountDb().all(
    `SELECT users.id as userId, user_name as userName, files.owner, display_name as displayName
     FROM users
     JOIN user_access ON user_access.user_id = users.id
     JOIN files ON files.id = user_access.file_id
     WHERE files.id = ? and (files.owner = ? OR 1 = ?)`,
    [fileId, userId, isAdmin ? 1 : 0],
  );
}

export function countUserAccess(fileId, userId, isAdmin) {
  const { countUserAccess } =
    getAccountDb().first(
      `SELECT count(*) as countUserAccess
       FROM users
       LEFT JOIN user_access ON user_access.user_id = users.id
       JOIN files ON files.id = user_access.file_id
       WHERE files.id = ? and files.owner = ? OR users.id = ?`,
      [fileId, userId, userId],
    ) || {};

  return countUserAccess || 0;
}

export function checkFilePermission(fileId, userId) {
  return (
    getAccountDb().first(
      `SELECT 1 as granted
       FROM files
       WHERE files.id = ? and (files.owner = ?)`,
      [fileId, userId],
    ) || { granted: 0 }
  );
}

export function addUserAccess(userId, fileId) {
  getAccountDb().mutate(
    'INSERT INTO user_access (user_id, file_id) VALUES (?, ?)',
    [userId, fileId],
  );
}

export function deleteUserAccessByFileId(userIds, fileId) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('The provided userIds must be a non-empty array.');
  }

  const CHUNK_SIZE = 999;
  let totalChanges = 0;

  for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
    const chunk = userIds.slice(i, i + CHUNK_SIZE);
    const placeholders = chunk.map(() => '?').join(',');

    const sql = `DELETE FROM user_access WHERE user_id IN (${placeholders}) AND file_id = ?`;

    const result = getAccountDb().mutate(sql, [...chunk, fileId]);
    totalChanges += result.changes;
  }

  return totalChanges;
}

export function getAllUserAccess(fileId) {
  return getAccountDb().all(
    `SELECT users.id as userId, user_name as userName, display_name as displayName,
            CASE WHEN user_access.file_id IS NULL THEN 0 ELSE 1 END as haveAccess,
            CASE WHEN files.id IS NULL THEN 0 ELSE 1 END as owner
     FROM users
     LEFT JOIN user_access ON user_access.file_id = ? and user_access.user_id = users.id
     LEFT JOIN files ON files.id = ? and files.owner = users.id
     WHERE users.enabled = 1 AND users.user_name <> ''`,
    [fileId, fileId],
  );
}

export function getOpenIDConfig() {
  return (
    getAccountDb().first(`SELECT * FROM auth WHERE method = ?`, ['openid']) || {}
  );
}
