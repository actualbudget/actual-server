import getAccountDb from './src/account-db.js';
import runMigrations from './src/migrations.js';

const GENERIC_ADMIN_ID = 'genericAdmin';
const ADMIN_ROLE_ID = 'ADMIN';

const createUser = (userId, userName, role, owner = 0, enabled = 1) => {
  const missingParams = [];
  if (!userId) missingParams.push('userId');
  if (!userName) missingParams.push('userName');
  if (!role) missingParams.push('role');
  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }

  if (
    typeof userId !== 'string' ||
    typeof userName !== 'string' ||
    typeof role !== 'string'
  ) {
    throw new Error(
      'Invalid parameter types. userId, userName, and role must be strings',
    );
  }

  try {
    getAccountDb().mutate(
      'INSERT INTO users (id, user_name, display_name, enabled, owner, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, userName, userName, enabled, owner, role],
    );
  } catch (error) {
    console.error(`Error creating user ${userName}:`, error);
    throw error;
  }
};

const setSessionUser = (userId, token = 'valid-token') => {
  getAccountDb().mutate('UPDATE sessions SET user_id = ? WHERE token = ?', [
    userId,
    token,
  ]);
};

export default async function setup() {
  await runMigrations();

  createUser(GENERIC_ADMIN_ID, 'admin', ADMIN_ROLE_ID, 1);

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
  setSessionUser('genericAdmin', 'valid-token-admin');
}
