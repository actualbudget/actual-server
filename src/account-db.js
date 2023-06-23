import fs from 'node:fs';
import { join } from 'node:path';
import openDatabase from './db.js';
import config, { sqlDir } from './load-config.js';
import createDebug from 'debug';
import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt';
import { generators, Issuer } from 'openid-client';

const debug = createDebug('actual:account-db');

let _accountDb = null;

export default function getAccountDb() {
  if (_accountDb == null) {
    if (!fs.existsSync(config.serverFiles)) {
      debug(`creating server files directory: '${config.serverFiles}'`);
      fs.mkdirSync(config.serverFiles);
    }

    let dbPath = join(config.serverFiles, 'account.sqlite');
    let needsInit = !fs.existsSync(dbPath);

    _accountDb = openDatabase(dbPath);

    if (needsInit) {
      debug(`initializing account database: '${dbPath}'`);
      let initSql = fs.readFileSync(join(sqlDir, 'account.sql'), 'utf8');
      _accountDb.exec(initSql);
    } else {
      debug(`opening account database: '${dbPath}'`);
    }
  }

  return _accountDb;
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

export function needsBootstrap() {
  let accountDb = getAccountDb();
  let row = accountDb.first('SELECT count(*) FROM auth');
  return row['count(*)'] === 0;
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

  const passEnabled = loginSettings.hasOwnProperty('password');
  const openIdEnabled = loginSettings.hasOwnProperty('openid');

  if (!passEnabled && !openIdEnabled) {
    return { error: 'no-auth-method-selected' };
  }

  if (passEnabled && openIdEnabled) {
    return { error: 'max-one-method-allowed' };
  }

  if (passEnabled) {
    const password = loginSettings.password;
    if (password === null || password === '') {
      return { error: 'invalid-password' };
    }

    // Hash the password. There's really not a strong need for this
    // since this is a self-hosted instance owned by the user.
    // However, just in case we do it.
    let hashed = hashPassword(loginSettings.password);
    accountDb.mutate(
      "INSERT INTO auth (method, extra_data) VALUES ('password', ?)",
      [hashed],
    );
  }

  if (openIdEnabled) {
    const config = loginSettings.openid;
    if (!config.hasOwnProperty('issuer')) {
      return { error: 'missing-issuer' };
    }
    if (!config.hasOwnProperty('client_id')) {
      return { error: 'missing-client-id' };
    }
    if (!config.hasOwnProperty('client_secret')) {
      return { error: 'missing-client-secret' };
    }
    if (!config.hasOwnProperty('server_hostname')) {
      return { error: 'missing-server-hostname' };
    }

    // Beyond verifying that the configuration exists, we do not attempt
    // to check if the configuration is actually correct.
    // If the user improperly configures this during bootstrap, there is
    // no way to recover without manually editing the database. However,
    // this might not be a real issue since an analogous situation happens
    // if they forget their password.
    accountDb.mutate(
      "INSERT INTO auth (method, extra_data) VALUES ('openid', ?)",
      [JSON.stringify(loginSettings.openid)],
    );
  }

  const token = uuid.v4();
  accountDb.mutate('INSERT INTO sessions (token) VALUES (?)', [token]);

  return {};
}

export function loginWithPassword(password) {
  let accountDb = getAccountDb();
  let row = accountDb.first(
    "SELECT extra_data FROM auth WHERE method = 'password'",
  );
  let confirmed = row && bcrypt.compareSync(password, row.extra_data);

  if (confirmed) {
    // Right now, tokens are permanent and there's just one in the
    // system. In the future this should probably evolve to be a
    // "session" that times out after a long time or something, and
    // maybe each device has a different token
    let row = accountDb.first('SELECT token FROM sessions');
    return row.token;
  } else {
    return null;
  }
}

async function setupOpenIdClient(config) {
  const issuer = await Issuer.discover(config.issuer);

  const client = new issuer.Client({
    client_id: config.client_id,
    client_secret: config.client_secret,
    redirect_uri: config.server_hostname + '/account/login-openid/cb',
  });

  return client;
}

export async function loginWithOpenIdSetup(body) {
  if (!body.return_url) {
    return { error: 'return-url-missing' };
  }

  let accountDb = getAccountDb();
  let config = accountDb.first(
    "SELECT extra_data FROM auth WHERE method = 'openid'",
  );
  if (!config) {
    return { error: 'openid-not-configured' };
  }
  config = JSON.parse(config['extra_data']);

  let client;
  try {
    client = await setupOpenIdClient(config);
  } catch (err) {
    return { error: 'openid-setup-failed: ' + err };
  }

  const state = generators.state();
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);

  const now_time = Date.now();
  const expiry_time = now_time + 300 * 1000;

  accountDb.mutate(
    'DELETE FROM pending_openid_requests WHERE expiry_time < ?',
    [now_time],
  );
  accountDb.mutate(
    'INSERT INTO pending_openid_requests (state, code_verifier, return_url, expiry_time) VALUES (?, ?, ?, ?)',
    [state, code_verifier, body.return_url, expiry_time],
  );

  const url = client.authorizationUrl({
    response_type: 'code',
    scope: 'openid',
    state,
    code_challenge,
    code_challenge_method: 'S256',
  });

  return { url };
}

export async function loginWithOpenIdFinalize(body) {
  if (!body.code) {
    return { error: 'missing-authorization-code' };
  }
  if (!body.state) {
    return { error: 'missing-state' };
  }

  let accountDb = getAccountDb();
  let config = accountDb.first(
    "SELECT extra_data FROM auth WHERE method = 'openid'",
  );
  if (!config) {
    return { error: 'openid-not-configured' };
  }
  config = JSON.parse(config['extra_data']);

  let client;
  try {
    client = await setupOpenIdClient(config);
  } catch (err) {
    return { error: 'openid-setup-failed: ' + err };
  }

  let { code_verifier, return_url } = accountDb.first(
    'SELECT code_verifier, return_url FROM pending_openid_requests WHERE state = ? AND expiry_time > ?',
    [body.state, Date.now()],
  );

  try {
    let grant = await client.grant({
      grant_type: 'authorization_code',
      code: body.code,
      code_verifier,
      redirect_uri: client.redirect_uris[0],
    });
    await client.userinfo(grant);
    // The server requests have succeeded, so the user has been authenticated.
    // Ideally, we would create a session token here tied to the returned access token
    // and verify it with the server whenever the user connects.
    // However, the rest of this server code uses only a single permanent token,
    // so that is what we do here as well.
  } catch (err) {
    return { error: 'openid-grant-failed: ' + err };
  }

  let { token } = accountDb.first('SELECT token FROM sessions');
  return { url: `${return_url}/login/openid-cb?token=${token}` };
}

export function changePassword(newPassword) {
  let accountDb = getAccountDb();

  if (newPassword == null || newPassword === '') {
    return { error: 'invalid-password' };
  }

  let hashed = hashPassword(newPassword);
  let token = uuid.v4();
  // This query does nothing if password authentication was disabled during
  // bootstrap (then no row with method=password exists). Maybe we should
  // return an error here if that is the case?
  accountDb.mutate("UPDATE auth SET extra_data = ? WHERE method = 'password'", [
    hashed,
  ]);
  accountDb.mutate('UPDATE sessions SET token = ?', [token]);
  return {};
}

export function getSession(token) {
  let accountDb = getAccountDb();
  return accountDb.first('SELECT * FROM sessions WHERE token = ?', [token]);
}

export function listLoginMethods() {
  let accountDb = getAccountDb();
  let rows = accountDb.all('SELECT method FROM auth');
  return rows.map((r) => r['method']);
}
