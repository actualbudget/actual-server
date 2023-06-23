import fs from 'node:fs';
import { join } from 'node:path';
import openDatabase from '../db.js';
import config, { sqlDir } from '../load-config.js';
import createDebug from 'debug';
import * as uuid from 'uuid';
import { bootstrapPassword } from './password.js';
import { bootstrapOpenId } from './openid.js';

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
  // TODO We should use a transaction here to make bootstrap atomic

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
  accountDb.mutate('INSERT INTO sessions (token) VALUES (?)', [token]);

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
