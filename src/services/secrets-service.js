import createDebug from 'debug';
import fs from 'node:fs';
import config, { sqlDir } from '../load-config.js';
import { join } from 'node:path';
import openDatabase from '../db.js';
class SecretsDb {
  constructor() {
    this.debug = createDebug('actual:secrets-db');
    this.db = null;
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
    return secretsDb.get(name);
  },
  set: (name, value) => {
    return secretsDb.set(name, value);
  },
  exists: (name) => {
    return Boolean(secretsDb.get(name));
  },
};
