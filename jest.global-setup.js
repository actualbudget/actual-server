import getAccountDb from './src/account-db.js';
import runMigrations from './src/migrations.js';

const createUser = (userId, userName, role, master = 0, enabled = 1) => {
  getAccountDb().mutate(
    'INSERT INTO users (id, user_name, display_name, enabled, master) VALUES (?, ?, ?, ?, ?)',
    [userId, userName, `${userName} display`, enabled, master],
  );
  getAccountDb().mutate(
    'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
    [userId, role],
  );
};

const setSessionUser = (userId) => {
  getAccountDb().mutate('UPDATE sessions SET user_id = ? WHERE token = ?', [
    userId,
    'valid-token',
  ]);
};

export default async function setup() {
  await runMigrations();

  createUser(
    'genericAdmin',
    'admin',
    '213733c1-5645-46ad-8784-a7b20b400f93',
    1,
  );

  // Insert a fake "valid-token" fixture that can be reused
  const db = getAccountDb();
  await db.mutate('DELETE FROM sessions');
  await db.mutate(
    'INSERT INTO sessions (token, expires_at, user_id) VALUES (?, ?, ?)',
    ['valid-token', -1, 'genericAdmin'],
  );
  await db.mutate(
    'INSERT INTO sessions (token, expires_at, user_id) VALUES (?, ?, ?)',
    ['valid-token-admin', -1, 'genericAdmin'],
  );

  setSessionUser('genericAdmin');
}
