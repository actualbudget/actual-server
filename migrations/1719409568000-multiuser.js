import getAccountDb from '../src/account-db.js';

export const up = async function () {
  await getAccountDb().exec(
    `CREATE TABLE users
        (user_id TEXT PRIMARY KEY,
        email TEXT, 
        enabled INTEGER,
        master INTEGER);

        CREATE TABLE roles
        (role_id TEXT PRIMARY KEY,
        name TEXT);

        INSERT INTO roles VALUES ('213733c1-5645-46ad-8784-a7b20b400f93', 'Admin');
        INSERT INTO roles VALUES ('e87fa1f1-ac8c-4913-b1b5-1096bdb1eacc', 'Basic');
        
        CREATE TABLE user_roles
        (user_id TEXT,
        role_id TEXT);
        
        
        DELETE FROM sessions;

        ALTER TABLE sessions
            ADD COLUMN expires_in INTEGER;

        ALTER TABLE sessions
            ADD user_id TEXT;
        `,
  );
};

export const down = async function () {
  await getAccountDb().exec(
    `
      DROP TABLE user;
      DROP TABLE roles;
      DROP TABLE user_roles;
      `,
  );
};
