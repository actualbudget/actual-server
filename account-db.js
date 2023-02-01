import fs from 'fs';
import { join } from 'path';
import { openDatabase } from './db';
import config from './load-config';

let accountDb = null;

export function getAccountDb() {
  if (accountDb == null) {
    if (!fs.existsSync(config.serverFiles)) {
      console.log('MAKING SERVER DIR');
      fs.mkdirSync(config.serverFiles);
    }

    let dbPath = join(config.serverFiles, 'account.sqlite');
    let needsInit = !fs.existsSync(dbPath);

    accountDb = openDatabase(dbPath);

    if (needsInit) {
      let initSql = fs.readFileSync(join(__dirname, 'sql/account.sql'), 'utf8');
      accountDb.exec(initSql);
    }
  }

  return accountDb;
}
