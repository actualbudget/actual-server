import createDebug from 'debug';
import fs from 'node:fs';
import config, { sqlDir } from '../load-config.js';
import { join } from 'node:path';
import openDatabase from '../db.js';

/**
 * An enum of valid secret names.
 * @readonly
 * @enum {string}
 */
export const SecretName = {
  nordigen_secretId: 'nordigen_secretId',
  nordigen_secretKey: 'nordigen_secretKey',
};

class SecretsDb {
  constructor() {
    this.debug = createDebug('actual:secrets-db');
    this.db = null;
    this.migrateNordigen();
  }

  /// Migrates nordigen from config.json or process.env to app secret
  //TODO: Create a migration script for this instead
  migrateNordigen() {
    if (
      config.nordigen &&
      (!this.get(SecretName.nordigen_secretId) ||
        !this.get(SecretName.nordigen_secretKey))
    ) {
      this.set(SecretName.nordigen_secretId, config.nordigen.secretId);
      this.set(SecretName.nordigen_secretKey, config.nordigen.secretKey);
      this.debug(
        'Migrated Nordigen keys from config.json/environment to app secrets',
      );
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
    return result;
  }
}

const secretsDb = new SecretsDb();
const _cachedSecrets = new Map();
/**
 * A service for managing secrets stored in `secretsDb`.
 */
export const secretsService = {
  /**
   * Retrieves the value of a secret by name.
   * @param {SecretName} name - The name of the secret to retrieve.
   * @returns {string|null} The value of the secret, or null if the secret does not exist.
   */
  get: (name) => {
    return _cachedSecrets.get(name) ?? secretsDb.get(name)?.value ?? null;
  },

  /**
   * Sets the value of a secret by name.
   * @param {SecretName} name - The name of the secret to set.
   * @param {string} value - The value to set for the secret.
   * @returns {Object}
   */
  set: (name, value) => {
    const result = secretsDb.set(name, value);

    if (result.changes === 1) {
      _cachedSecrets.set(name, value);
    }
    return result;
  },

  /**
   * Determines whether a secret with the given name exists.
   * @param {SecretName} name - The name of the secret to check for existence.
   * @returns {boolean} True if a secret with the given name exists, false otherwise.
   */
  exists: (name) => {
    return Boolean(secretsService.get(name));
  },
};
