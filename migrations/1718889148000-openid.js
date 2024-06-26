import getAccountDb from '../src/account-db.js';

export const up = async function () {
  await getAccountDb().exec(
    `CREATE TABLE auth_new
        (method TEXT PRIMARY KEY,
        extra_data TEXT, active INTEGER);

        INSERT INTO auth_new (method, extra_data, active)
        SELECT 'password', password, 1 FROM auth;
        DROP TABLE auth;
        ALTER TABLE auth_new RENAME TO auth;

        CREATE TABLE pending_openid_requests
        (state TEXT PRIMARY KEY,
        code_verifier TEXT,
        return_url TEXT,
        expiry_time INTEGER);`,
  );
};

export const down = async function () {
  await getAccountDb().exec(
    `
      DROP TABLE auth;
      DROP TABLE pending_openid_requests;
      `,
  );
};
