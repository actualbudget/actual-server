let fs = require('fs');
let { join } = require('path');
let { openDatabase } = require('./db');
let config = require('./load-config');
let plaidDb = null;

function getPlaidDb() {
  if (plaidDb == null) {
    if (!fs.existsSync(config.serverFiles)) {
      console.log('MAKING SERVER DIR');
      fs.mkdirSync(config.serverFiles);
    }

    let dbPath = join(config.serverFiles, 'plaid.sqlite');
    let needsInit = !fs.existsSync(dbPath);

    plaidDb = openDatabase(dbPath);

    if (needsInit) {
      let initSql = fs.readFileSync(join(__dirname, 'sql/plaid.sql'), 'utf8');
      plaidDb.exec(initSql);
    }
  }

  return plaidDb;
}

function insertPlaidTables() {
  let tableWebTokens = 'CREATE TABLE IF NOT EXISTS webTokens (user_id TEXT PRIMARY KEY, token_id TEXT, time_created TEXT, contents TEXT);'
  plaidDb.exec(tableWebTokens);

  let tableAccessTokens = 'CREATE TABLE IF NOT EXISTS access_tokens (item_id TEXT PRIMARY KEY, user_id TEXT, access_token TEXT, deleted BOOLEAN);'
  plaidDb.exec(tableAccessTokens);
}

module.exports = { getPlaidDb, insertPlaidTables };
