import getAccountDb from '../account-db.js';

class UserService {
  static getUserByUsername(userName) {
    const { id } =
      getAccountDb().first('SELECT id FROM users WHERE user_name = ?', [
        userName,
      ]) || {};
    return id;
  }

  static getUserById(userId) {
    const { id } =
      getAccountDb().first('SELECT id FROM users WHERE id = ?', [userId]) || {};
    return id;
  }

  static getFileById(fileId) {
    const { id } =
      getAccountDb().first('SELECT id FROM files WHERE files.id = ?', [
        fileId,
      ]) || {};
    return id;
  }

  static validateRole(roleId) {
    const { id } =
      getAccountDb().first('SELECT id FROM roles WHERE roles.id = ?', [
        roleId,
      ]) || {};
    return id;
  }

  static getOwnerCount() {
    const { ownerCount } =
      getAccountDb().first(
        `SELECT count(*) as ownerCount FROM users WHERE users.user_name <> '' and users.owner = 1`,
      ) || {};
    return ownerCount || 0;
  }

  static getOwnerId() {
    const { id } =
      getAccountDb().first(
        `SELECT users.id FROM users WHERE users.user_name <> '' and users.owner = 1`,
      ) || {};
    return id;
  }

  static getFileOwnerId(fileId) {
    const { owner } =
      getAccountDb().first(`SELECT files.owner FROM files WHERE files.id = ?`, [
        fileId,
      ]) || {};
    return owner;
  }

  static getFileOwnerById(fileId) {
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

  static getAllUsers() {
    return getAccountDb().all(
      `SELECT users.id, user_name as userName, display_name as displayName, enabled, ifnull(owner,0) as owner, roles.id as role
           FROM users
           JOIN user_roles ON user_roles.user_id = users.id
           JOIN roles ON roles.id = user_roles.role_id
           WHERE users.user_name <> ''`,
    );
  }

  static insertUser(userId, userName, displayName, enabled) {
    getAccountDb().mutate(
      'INSERT INTO users (id, user_name, display_name, enabled, owner) VALUES (?, ?, ?, ?, 0)',
      [userId, userName, displayName, enabled],
    );
  }

  static insertUserRole(userId, roleId) {
    getAccountDb().mutate(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, roleId],
    );
  }

  static updateUser(userId, userName, displayName, enabled) {
    getAccountDb().mutate(
      'UPDATE users SET user_name = ?, display_name = ?, enabled = ? WHERE id = ?',
      [userName, displayName, enabled, userId],
    );
  }

  static updateUserRole(userId, roleId) {
    getAccountDb().mutate(
      'UPDATE user_roles SET role_id = ? WHERE user_id = ?',
      [roleId, userId],
    );
  }

  static deleteUser(userId) {
    return getAccountDb().mutate(
      'DELETE FROM users WHERE id = ? and owner = 0',
      [userId],
    ).changes;
  }

  static deleteUserRoles(userId) {
    getAccountDb().mutate('DELETE FROM user_roles WHERE user_id = ?', [userId]);
  }

  static deleteUserAccess(userId) {
    getAccountDb().mutate('DELETE FROM user_access WHERE user_id = ?', [
      userId,
    ]);
  }

  static transferAllFilesFromUser(ownerId, oldUserId) {
    getAccountDb().mutate('UPDATE files set owner = ? WHERE owner = ?', [
      ownerId,
      oldUserId,
    ]);
  }

  static updateFileOwner(ownerId, fileId) {
    getAccountDb().mutate('UPDATE files set owner = ? WHERE id = ?', [
      ownerId,
      fileId,
    ]);
  }

  static getUserAccess(fileId, userId, isAdmin) {
    return getAccountDb().all(
      `SELECT users.id as userId, user_name as userName, files.owner, display_name as displayName
           FROM users
           JOIN user_access ON user_access.user_id = users.id
           JOIN files ON files.id = user_access.file_id
           WHERE files.id = ? and (files.owner = ? OR 1 = ?)`,
      [fileId, userId, isAdmin ? 1 : 0],
    );
  }

  static countUserAccess(fileId, userId, isAdmin) {
    const { countUserAccess } =
      getAccountDb().first(
        `SELECT count(*) as countUserAccess
           FROM users
           JOIN user_access ON user_access.user_id = users.id
           JOIN files ON files.id = user_access.file_id
           WHERE files.id = ? and (files.owner = ? OR 1 = ?)`,
        [fileId, userId, isAdmin ? 1 : 0],
      ) || {};

    return countUserAccess || 0;
  }

  static checkFilePermission(fileId, userId) {
    return (
      getAccountDb().first(
        `SELECT 1 as granted
             FROM files
             WHERE files.id = ? and (files.owner = ?)`,
        [fileId, userId],
      ) || { granted: 0 }
    );
  }

  static addUserAccess(userId, fileId) {
    getAccountDb().mutate(
      'INSERT INTO user_access (user_id, file_id) VALUES (?, ?)',
      [userId, fileId],
    );
  }

  static deleteUserAccessByFileId(userIds, fileId) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('The provided userIds must be a non-empty array.');
    }

    const CHUNK_SIZE = 999; // SQLite and many databases have a limit for the number of placeholders in a query
    let totalChanges = 0;

    for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
      const chunk = userIds.slice(i, i + CHUNK_SIZE).map(String); // Convert numbers to strings
      const placeholders = chunk.map(() => '?').join(',');

      // Use parameterized query to prevent SQL injection
      const sql = `DELETE FROM user_access WHERE user_id IN (${placeholders}) AND file_id = ?`;

      // Execute the delete query with user IDs and the fileId as parameters
      const result = getAccountDb().mutate(sql, [...chunk, fileId]); // Assuming mutate properly handles parameterized queries
      totalChanges += result.changes;
    }

    return totalChanges;
  }

  static getAllUserAccess(fileId) {
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

  static getBulkUserAccess(fileIds) {
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
    return Array.from(accessMap.entries());
  }

  static getOpenIDConfig() {
    return (
      getAccountDb().first(`SELECT * FROM auth WHERE method = ?`, ['openid']) ||
      {}
    );
  }
}

export default UserService;
