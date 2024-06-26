import { join } from 'node:path';
import openDatabase from './db.js';
import config from './load-config.js';
import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt';
import { bootstrapPassword } from './accounts/password.js';
import { bootstrapOpenId } from './accounts/openid.js';

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
  let rows = accountDb.all('SELECT method FROM auth');
  return rows.map((r) => r['method']);
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
  let accountDb = getAccountDb();
  let row = accountDb.first('SELECT method FROM auth where active = 1');

  if (row !== null && row['method'] !== null) {
    return row['method'];
  }

  return config.loginMethod || 'password';
}

// Supported login settings:
// "password": "secret_password",
// "openid": {
//   "issuer": "https://example.org",
//   "client_id": "your_client_id",
//   "client_secret": "your_client_secret",
//   "server_hostname": "https://actual.your_website.com"
// }
export function bootstrap(loginSettings) {
  let accountDb = getAccountDb();

  if (!needsBootstrap()) {
    return { error: 'already-bootstrapped' };
  }

  const passEnabled = Object.prototype.hasOwnProperty.call(
    loginSettings,
    'password',
  );
  const openIdEnabled = Object.prototype.hasOwnProperty.call(
    loginSettings,
    'openid',
  );

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
    let { error } = bootstrapOpenId(loginSettings.openid);
    if (error) {
      return { error };
    }
  }

  const token = uuid.v4();
  accountDb.mutate(
    'INSERT INTO sessions (token, expires_at, user_id) VALUES (?, -1, ?)',
    [token, ''],
  );

  return {};
}

export function login(password) {
  if (password === undefined || password === '') {
    return { error: 'invalid-password' };
  }

  let accountDb = getAccountDb();
  let row = accountDb.first('SELECT * FROM auth');

  let confirmed = row && bcrypt.compareSync(password, row.password);

  if (!confirmed) {
    return { error: 'invalid-password' };
  }

  // Right now, tokens are permanent and there's just one in the
  // system. In the future this should probably evolve to be a
  // "session" that times out after a long time or something, and
  // maybe each device has a different token
  let sessionRow = accountDb.first('SELECT * FROM sessions');
  return { token: sessionRow.token };
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
  return accountDb.first('SELECT * FROM users WHERE user_id = ?', [userId]);
}

export function getUserPermissions(userId) {
  let accountDb = getAccountDb();
  return accountDb.all(
    `SELECT roles.permissions FROM users
                              JOIN user_roles ON user_roles.user_id = users.user_id
                              JOIN roles ON roles.role_id = user_roles.role_id
                              WHERE users.user_id = ?`,
    [userId],
  );
}
