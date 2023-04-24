import createDebug from 'debug';
import fs from 'node:fs';
import config, { sqlDir } from '../load-config.js';
import { join } from 'node:path';
import openDatabase from '../db.js';
class SecretsDb {
  constructor() {
    this.debug = createDebug('actual:secrets-db');
    this.db = null;
    this.migrateNordigen();
  }

  /// Migrates nordigen from config.json or process.env to app secret
  migrateNordigen() {
    const hasNordigenConfigs =
      config.nordigen?.secretId && config.nordigen?.secretKey;
    const hasNordigenEnvs =
      process.env?.ACTUAL_NORDIGEN_SECRET_ID &&
      process.env?.ACTUAL_NORDIGEN_SECRET_KEY;

    if (!this.get('nordigen_secretId') && !this.get('nordigen_secretKey')) {
      if (hasNordigenEnvs) {
        this.set('nordigen_secretId', process.env?.ACTUAL_NORDIGEN_SECRET_ID);
        this.set('nordigen_secretKey', process.env?.ACTUAL_NORDIGEN_SECRET_KEY);
        this.debug('Migrated Nordigen keys from process.env to app secrets');
      }

      if (hasNordigenConfigs) {
        this.set('nordigen_secretId', config.nordigen?.secretId);
        this.set('nordigen_secretKey', config.nordigen?.secretKey);
        this.debug('Migrated Nordigen keys from config.json to app secrets');
      }
    }
  }

  open() {
    if (!fs.existsSync(config.serverFiles)) {
      this.debug(`creating server files directory: '${config.serverFiles}'`);
      fs.mkdirSync(config.serverFiles);
    }

    const dbPath = join(config.serverFiles, 'secrets.sqlite');
    const needsInit = !fs.existsSync(dbPath);

    let db = openDatabase(dbPath);

    if (needsInit) {
      this.debug(`initializing secrets database: '${dbPath}'`);
      let initSql = fs.readFileSync(join(sqlDir, 'secrets.sql'), 'utf8');
      db.exec(initSql);
    } else {
      this.debug(`opening secrets database: '${dbPath}'`);
    }

    return db;
  }

  set(name, value) {
    if (!this.db) {
      this.db = this.open();
    }

    this.debug(`setting secret '${name}' to '${value}'`);
    const result = this.db.mutate(
      `INSERT OR REPLACE INTO secrets (name, value) VALUES (?,?)`,
      [name, value],
    );
    this.close();
    return result;
  }

  get(name) {
    if (!this.db) {
      this.db = this.open();
    }

    this.debug(`getting secret '${name}'`);
    const result = this.db.first(`SELECT value FROM secrets WHERE name =?`, [
      name,
    ]);
    this.close();
    return result;
  }

  close() {
    this.db.close();
    this.db = null;
  }
}

const secretsDb = new SecretsDb();
export const secretsService = {
  get: (name) => {
    const secret = secretsDb.get(name)?.value;
    if (!secret) return null;

    return secretsDb.get(name)?.value;
  },
  set: (name, value) => {
    return secretsDb.set(name, value);
  },
  exists: (name) => {
    return Boolean(secretsDb.get(name));
  },
};
