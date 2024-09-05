import { join } from 'node:path';
import openDatabase from './db.js';
import config from './load-config.js';
import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt';
import { bootstrapPassword } from './accounts/password.js';
import { bootstrapOpenId } from './accounts/openid.js';
import { TOKEN_EXPIRATION_NEVER } from './app-admin.js';

let _accountDb;

export default function getAccountDb() {
  if (_accountDb === undefined) {
    const dbPath = join(config.serverFiles, 'account.sqlite');
    _accountDb = openDatabase(dbPath);
  }

  return _accountDb;
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

export function needsBootstrap() {
  let accountDb = getAccountDb();
  let rows = accountDb.all('SELECT * FROM auth');
  return rows.length === 0;
}

export function listLoginMethods() {
  let accountDb = getAccountDb();
  let rows = accountDb.all('SELECT method, display_name, active FROM auth');
  return rows.map((r) => ({
    method: r.method,
    active: r.active,
    displayName: r.display_name,
  }));
}

/*
 * Get the Login Method in the following order
 * req (the frontend can say which method in the case it wants to resort to forcing password auth)
 * config options
 * fall back to using password
 */
export function getLoginMethod(req) {
  if (
    typeof req !== 'undefined' &&
    (req.body || { loginMethod: null }).loginMethod
  ) {
    return req.body.loginMethod;
  }

  return config.loginMethod || 'password';
}

export async function bootstrap(loginSettings) {
  const passEnabled = Object.prototype.hasOwnProperty.call(
    loginSettings,
    'password',
  );
  const openIdEnabled = Object.prototype.hasOwnProperty.call(
    loginSettings,
    'openid',
  );

  const { cnt } =
    getAccountDb().first(
      `SELECT count(*) as cnt
   FROM users
   WHERE users.user_name <> '' and users.master = 1`,
    ) || {};

  if (!openIdEnabled || (openIdEnabled && cnt > 0)) {
    if (!needsBootstrap()) {
      return { error: 'already-bootstrapped' };
    }
  }

  if (!passEnabled && !openIdEnabled) {
    return { error: 'no-auth-method-selected' };
  }

  if (passEnabled && openIdEnabled) {
    return { error: 'max-one-method-allowed' };
  }

  if (passEnabled) {
    let { error } = bootstrapPassword(loginSettings.password);
    if (error) {
      return { error };
    }
  }

  if (openIdEnabled) {
    let { error } = await bootstrapOpenId(loginSettings.openid);
    if (error) {
      return { error };
    }
  }

  return {};
}

export function isAdmin(userId) {
  const user =
    getAccountDb().first('SELECT master FROM users WHERE id = ?', [userId]) ||
    {};
  if (user?.master === 1) return true;
  return getUserPermissions(userId).some((value) => value === 'ADMINISTRATOR');
}

export function hasPermission(userId, permission) {
  return getUserPermissions(userId).some((value) => value === permission);
}

export async function enableOpenID(loginSettings, checkFileConfig = true) {
  if (checkFileConfig && config.loginMethod) {
    return { error: 'unable-to-change-file-config-enabled' };
  }

  let { error } = (await bootstrapOpenId(loginSettings.openId)) || {};
  if (error) {
    return { error };
  }

  getAccountDb().mutate('DELETE FROM sessions');
}

export async function disableOpenID(
  loginSettings,
  checkFileConfig = true,
  checkForOldPassword = false,
) {
  if (checkFileConfig && config.loginMethod) {
    return { error: 'unable-to-change-file-config-enabled' };
  }

  if (checkForOldPassword) {
    let accountDb = getAccountDb();
    const { extra_data: passwordHash } =
      accountDb.first('SELECT extra_data FROM auth WHERE method = ?', [
        'password',
      ]) || {};

    if (!loginSettings?.password) {
      return { error: 'invalid-password' };
    }

    if (passwordHash) {
      let confirmed =
        passwordHash &&
        bcrypt.compareSync(loginSettings.password, passwordHash);

      if (!confirmed) {
        return { error: 'invalid-password' };
      }
    }
  }

  let { error } = (await bootstrapPassword(loginSettings.password)) || {};
  if (error) {
    return { error };
  }

  getAccountDb().mutate('DELETE FROM sessions');
  getAccountDb().mutate('DELETE FROM users WHERE user_name <> ?', ['']);
  getAccountDb().mutate('DELETE FROM user_roles');
  getAccountDb().mutate('DELETE FROM auth WHERE method = ?', ['openid']);
}

export function login(password) {
  if (password === undefined || password === '') {
    return { error: 'invalid-password' };
  }

  let accountDb = getAccountDb();
  const { extra_data: passwordHash } =
    accountDb.first('SELECT extra_data FROM auth WHERE method = ?', [
      'password',
    ]) || {};

  let confirmed = passwordHash && bcrypt.compareSync(password, passwordHash);

  if (!confirmed) {
    return { error: 'invalid-password' };
  }

  let sessionRow = accountDb.first('SELECT * FROM sessions');

  let token = sessionRow ? sessionRow.token : uuid.v4();

  let { c } = accountDb.first('SELECT count(*) as c FROM users');
  let userId = null;
  if (c === 0) {
    userId = uuid.v4();
    accountDb.mutate(
      'INSERT INTO users (id, user_name, display_name, enabled, master) VALUES (?, ?, ?, 1, 1)',
      [userId, '', ''],
    );

    accountDb.mutate(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, '213733c1-5645-46ad-8784-a7b20b400f93'],
    );
  } else {
    let { id: userIdFromDb } = accountDb.first(
      'SELECT id FROM users WHERE user_name = ?',
      [''],
    );

    userId = userIdFromDb;
  }

  let expiration = TOKEN_EXPIRATION_NEVER;
  if (
    config.token_expiration != 'never' &&
    config.token_expiration != 'openid-provider' &&
    typeof config.token_expiration === 'number'
  ) {
    expiration = Math.floor(Date.now() / 1000) + config.token_expiration * 60;
  }

  if (!sessionRow) {
    accountDb.mutate(
      'INSERT INTO sessions (token, expires_at, user_id, auth_method) VALUES (?, ?, ?, ?)',
      [token, expiration, userId, 'password'],
    );
  } else {
    accountDb.mutate(
      'UPDATE sessions SET user_id = ?, expires_at = ? WHERE token = ?',
      [userId, expiration, token],
    );
  }

  return { token };
}

export function changePassword(newPassword) {
  if (newPassword === undefined || newPassword === '') {
    return { error: 'invalid-password' };
  }

  let accountDb = getAccountDb();

  let hashed = hashPassword(newPassword);
  let token = uuid.v4();

  // Note that this doesn't have a WHERE. This table only ever has 1
  // row (maybe that will change in the future? if so this will not work)
  accountDb.mutate('UPDATE auth SET password = ?', [hashed]);
  accountDb.mutate('UPDATE sessions SET token = ?', [token]);

  return {};
}

export function getSession(token) {
  let accountDb = getAccountDb();
  return accountDb.first('SELECT * FROM sessions WHERE token = ?', [token]);
}

export function getUserInfo(userId) {
  let accountDb = getAccountDb();
  return accountDb.first('SELECT * FROM users WHERE id = ?', [userId]);
}

export function getUserPermissions(userId) {
  let accountDb = getAccountDb();
  const permissions =
    accountDb.all(
      `SELECT roles.permissions FROM users
                              JOIN user_roles ON user_roles.user_id = users.id
                              JOIN roles ON roles.id = user_roles.role_id
                              WHERE users.id = ?`,
      [userId],
    ) || [];

  const uniquePermissions = Array.from(
    new Set(
      permissions.flatMap((rolePermission) =>
        rolePermission.permissions.split(',').map((perm) => perm.trim()),
      ),
    ),
  );
  return uniquePermissions;
}

export function clearExpiredSessions() {
  const clearThreshold = Math.floor(Date.now() / 1000) - 3600;

  const deletedSessions = getAccountDb().mutate(
    'DELETE FROM sessions WHERE expires_at <> -1 and expires_at < ?',
    [clearThreshold],
  ).changes;

  console.log(`Deleted ${deletedSessions} old sessions`);
}

export async function toogleAuthentication() {
  if (config.loginMethod === 'openid') {
    const { cnt } = getAccountDb().first(
      'SELECT count(*) as cnt FROM auth WHERE method = ? and active = 1',
      ['openid'],
    );
    if (cnt == 0) {
      const { error } = (await enableOpenID(config, false)) || {};

      if (error) {
        console.error(error);
        return false;
      }
    }
  } else if (config.loginMethod) {
    const { cnt } = getAccountDb().first(
      'SELECT count(*) as cnt FROM auth WHERE method <> ? and active = 1',
      ['openid'],
    );
    if (cnt == 0) {
      const { error } = (await disableOpenID(config, false)) || {};

      if (error) {
        console.error(error);
        return false;
      }
    }
  }

  return true;
}
