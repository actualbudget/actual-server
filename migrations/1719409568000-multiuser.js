import getAccountDb from '../src/account-db.js';

export const up = async function () {
  await getAccountDb().exec(
    `CREATE TABLE users
        (id TEXT PRIMARY KEY,
        user_name TEXT, 
        display_name TEXT,
        enabled INTEGER,
        owner INTEGER);

    CREATE TABLE roles
      (id TEXT PRIMARY KEY,
      permissions TEXT,
      name TEXT);

    INSERT INTO roles VALUES ('213733c1-5645-46ad-8784-a7b20b400f93', 'ADMINISTRATOR','Admin');
    INSERT INTO roles VALUES ('e87fa1f1-ac8c-4913-b1b5-1096bdb1eacc', '','Basic');
    
    CREATE TABLE user_roles
      (user_id TEXT,
      role_id TEXT);

    CREATE TABLE user_access
      (user_id TEXT,
      file_id TEXT);      

    ALTER TABLE files
        ADD COLUMN owner TEXT;
        
    DELETE FROM sessions;

    ALTER TABLE sessions
        ADD COLUMN expires_at INTEGER;

    ALTER TABLE sessions
        ADD user_id TEXT;

    ALTER TABLE sessions
        ADD auth_method TEXT;
        `,
  );
};

export const down = async function () {
  await getAccountDb().exec(
    `
      DROP TABLE users;
      DROP TABLE roles;
      DROP TABLE user_roles;
      `,
  );
};
