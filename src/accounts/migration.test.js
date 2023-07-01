import fs from 'fs';
import openDatabase from '../db.js';
import { runMigrations } from './index.js';

function expectCorrectSchema(db) {
  expect(
    db.all(
      "select tbl_name, sql from sqlite_master where type = 'table' order by tbl_name",
    ),
  ).toEqual([
    {
      tbl_name: 'auth',
      sql: 'CREATE TABLE "auth"\n  (method TEXT PRIMARY KEY,\n   extra_data TEXT)',
    },
    {
      tbl_name: 'files',
      sql: 'CREATE TABLE files\n  (id TEXT PRIMARY KEY,\n   group_id TEXT,\n   sync_version SMALLINT,\n   encrypt_meta TEXT,\n   encrypt_keyid TEXT,\n   encrypt_salt TEXT,\n   encrypt_test TEXT,\n   deleted BOOLEAN DEFAULT FALSE,\n   name TEXT)',
    },
    {
      tbl_name: 'migrations',
      sql: 'CREATE TABLE migrations (id TEXT PRIMARY KEY)',
    },
    {
      tbl_name: 'pending_openid_requests',
      sql: 'CREATE TABLE pending_openid_requests\n  (state TEXT PRIMARY KEY,\n   code_verifier TEXT,\n   return_url TEXT,\n   expiry_time INTEGER)',
    },
    {
      tbl_name: 'secrets',
      sql: 'CREATE TABLE secrets (\n  name TEXT PRIMARY KEY,\n  value BLOB\n)',
    },
    {
      tbl_name: 'sessions',
      sql: 'CREATE TABLE sessions\n  (token TEXT PRIMARY KEY)',
    },
  ]);
}

function expectAllMigrations(db) {
  expect(db.all('select id from migrations order by id')).toEqual([
    { id: '20000000_old_schema.sql' },
    { id: '20230625_extend_auth.sql' },
    { id: '20230701_integrate_secretsdb.sql' },
  ]);
}

describe('database migration', () => {
  it('works from fresh install', () => {
    let db = openDatabase(':memory:');
    runMigrations(db);
    expectCorrectSchema(db);
    expectAllMigrations(db);
  });

  it('works if already migrated', () => {
    const databaseFile = '/tmp/test_migration_1.sqlite';

    {
      let db = openDatabase(databaseFile);
      runMigrations(db);
      db.close();
    }

    {
      let db = openDatabase(databaseFile);
      expectCorrectSchema(db);
      expectAllMigrations(db);
    }

    fs.unlinkSync(databaseFile);
  });

  it('works from old schema', () => {
    // Contents extracted with `sqlite3 db .dump`
    // from fresh database created on commit debb33a63 with password `test`
    let db = openDatabase(':memory:');
    db.exec(`PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE auth
  (password TEXT PRIMARY KEY);
INSERT INTO auth VALUES('$2b$12$Vm4a2d7ClRbxsYeWBS291eBLs4cBYV0zwyWwamdSaaXpFxSTjWSXq');
CREATE TABLE sessions
  (token TEXT PRIMARY KEY);
INSERT INTO sessions VALUES('a4e2e791-b941-4963-be90-1a24b06c21b3');
CREATE TABLE files
  (id TEXT PRIMARY KEY,
   group_id TEXT,
   sync_version SMALLINT,
   encrypt_meta TEXT,
   encrypt_keyid TEXT,
   encrypt_salt TEXT,
   encrypt_test TEXT,
   deleted BOOLEAN DEFAULT FALSE,
   name TEXT);
CREATE TABLE secrets (
  name TEXT PRIMARY KEY,
  value BLOB
);
COMMIT;
`);

    runMigrations(db);
    expectCorrectSchema(db);
    expectAllMigrations(db);

    expect(db.all('select * from auth')).toEqual([
      {
        method: 'password',
        extra_data:
          '$2b$12$Vm4a2d7ClRbxsYeWBS291eBLs4cBYV0zwyWwamdSaaXpFxSTjWSXq',
      },
    ]);

    expect(db.all('select * from sessions')).toEqual([
      {
        token: 'a4e2e791-b941-4963-be90-1a24b06c21b3',
      },
    ]);
  });
});
