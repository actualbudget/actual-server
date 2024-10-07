import getAccountDb from '../account-db.js';

class UserService {
  static getUserByUsername(userName) {
    return (
      getAccountDb().first('SELECT id FROM users WHERE user_name = ?', [
        userName,
      ]) || {}
    );
  }

  static getFileById(fileId) {
    return (
      getAccountDb().first('SELECT id FROM files WHERE files.id = ?', [
        fileId,
      ]) || {}
    );
  }

  static validateRole(roleId) {
    return (
      getAccountDb().first('SELECT id FROM roles WHERE roles.id = ?', [
        roleId,
      ]) || {}
    );
  }

  static getOwnerCount() {
    return (
      getAccountDb().first(
        `SELECT count(*) as cnt
             FROM users
             WHERE users.user_name <> '' and users.owner = 1`,
      ) || {}
    );
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

  static deleteUserRoles(userId) {
    getAccountDb().mutate('DELETE FROM user_roles WHERE user_id = ?', [userId]);
  }

  static deleteUserAccess(userId) {
    getAccountDb().mutate('DELETE FROM user_access WHERE user_id = ?', [
      userId,
    ]);
  }

  static updateFileOwner(ownerId, userId) {
    getAccountDb().mutate('UPDATE files set owner = ? WHERE owner = ?', [
      ownerId,
      userId,
    ]);
  }

  static deleteUser(userId) {
    return getAccountDb().mutate(
      'DELETE FROM users WHERE id = ? and owner = 0',
      [userId],
    ).changes;
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

  static deleteUserAccessById(userId) {
    return getAccountDb().mutate('DELETE FROM user_access WHERE user_id = ?', [
      userId,
    ]).changes;
  }

  static deleteUserAccessByIds(userIds) {
    return getAccountDb().deleteByIds('user_access', userIds);
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

  static getAuthMode() {
    return (
      getAccountDb().first(
        `SELECT method from auth
             where active = 1`,
      ) || {}
    );
  }

  static getOpenIDConfig() {
    return (
      getAccountDb().first(
        `SELECT * FROM auth
         WHERE method = ?`,
        ['openid'],
      ) || {}
    );
  }
}

export default UserService;
