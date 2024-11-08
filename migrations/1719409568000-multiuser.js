import getAccountDb from '../src/account-db.js';

export const up = async function () {
  await getAccountDb().exec(
    `
    BEGIN TRANSACTION;
    
    CREATE TABLE users
        (id TEXT PRIMARY KEY,
        user_name TEXT, 
        display_name TEXT,
        role TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        owner INTEGER NOT NULL DEFAULT 0);

    CREATE TABLE user_access
      (user_id TEXT,
      file_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
      , FOREIGN KEY (file_id) REFERENCES files(id)
      );      

    ALTER TABLE files
        ADD COLUMN owner TEXT;
        
    DELETE FROM sessions;

    ALTER TABLE sessions
        ADD COLUMN expires_at INTEGER;

    ALTER TABLE sessions
        ADD user_id TEXT;

    ALTER TABLE sessions
        ADD auth_method TEXT;
    COMMIT;        
        `,
  );
};

export const down = async function () {
  await getAccountDb().exec(
    `
      BEGIN TRANSACTION;

      DROP TABLE IF EXISTS user_access;

      CREATE TABLE sessions_backup (
          token TEXT PRIMARY KEY
      );

      INSERT INTO sessions_backup (token)
      SELECT token FROM sessions;

      DROP TABLE sessions;
      
      ALTER TABLE sessions_backup RENAME TO sessions;

      CREATE TABLE files_backup (
          id TEXT PRIMARY KEY,
          group_id TEXT,
          sync_version SMALLINT,
          encrypt_meta TEXT,
          encrypt_keyid TEXT,
          encrypt_salt TEXT,
          encrypt_test TEXT,
          deleted BOOLEAN DEFAULT FALSE,
          name TEXT
      );

      INSERT INTO files_backup (
          id,
          group_id,
          sync_version,
          encrypt_meta,
          encrypt_keyid,
          encrypt_salt,
          encrypt_test,
          deleted,
          name
      )
      SELECT
          id,
          group_id,
          sync_version,
          encrypt_meta,
          encrypt_keyid,
          encrypt_salt,
          encrypt_test,
          deleted,
          name
      FROM files;

      DROP TABLE files;

      ALTER TABLE files_backup RENAME TO files;

      DROP TABLE IF EXISTS users;

      COMMIT;
      `,
  );
};
