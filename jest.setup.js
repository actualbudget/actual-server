import fs from 'node:fs';
import path from 'node:path';
import config from './src/load-config.js';
import getAccountDb from './src/account-db.js';

// Delete previous test database (force creation of a new one)
const dbPath = path.join(config.serverFiles, 'account.sqlite');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

// Create path for test user files and delete previous files there
if (fs.existsSync(config.userFiles))
  fs.rmSync(config.userFiles, { recursive: true });
fs.mkdirSync(config.userFiles);

// Insert a fake "valid-token" fixture that can be reused
const db = getAccountDb();
db.mutate('INSERT INTO sessions (token) VALUES (?)', ['valid-token']);
