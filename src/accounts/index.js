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

    _accountDb = openDatabase(dbPath);
    _accountDb.transaction(() => runMigrations(_accountDb));
  }

  return _accountDb;
}

function runMigrations(db) {
  const migrationsDir = join(sqlDir, 'migrations');
  let migrations = fs.readdirSync(migrationsDir);
  migrations.sort();

  // Detection due to https://stackoverflow.com/a/1604121
  const tableExistsMigrations = !!db.first(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name='migrations'",
  );
  const tableExistsAuth = !!db.first(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name='auth'",
  );

  if (!tableExistsMigrations) {
    // If the definition of the migrations table ever changes we might have
    // difficulty properly applying this change, but this is unlikely.
    db.mutate('CREATE TABLE migrations (id TEXT PRIMARY KEY)');
    if (tableExistsAuth) {
      // Original version of the database before migrations were introduced,
      // register the fact that the old schema already exists.
      db.mutate("INSERT INTO migrations VALUES ('20000000_old_schema.sql')");
    }
  }

  let firstUnapplied = null;
  for (var i = 0; i < migrations.length; i++) {
    const applied = !db.first('SELECT 1 FROM migrations WHERE id = ?', [
      migrations[i],
    ]);

    if (applied) {
      if (firstUnapplied === null) {
        firstUnapplied = i;
      }
    } else {
      if (firstUnapplied !== null) {
        throw new Error('out-of-sync migrations');
      }
    }
  }

  if (firstUnapplied !== null) {
    for (var i = firstUnapplied; i < migrations.length; i++) {
      const migrationSql = fs.readFileSync(join(migrationsDir, migrations[i]), {
        encoding: 'utf8',
      });
      db.exec(migrationSql);
      db.mutate('INSERT INTO migrations (id) VALUES (?)', [migrations[i]]);
    }
  }
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
