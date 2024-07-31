import * as bcrypt from 'bcrypt';
import getAccountDb, { clearExpiredSessions } from '../account-db.js';

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

export function bootstrapPassword(password) {
  if (password === null || password === '') {
    return { error: 'invalid-password' };
  }

  getAccountDb().mutate('DELETE FROM auth WHERE method = ?', ['password']);

  // Hash the password. There's really not a strong need for this
  // since this is a self-hosted instance owned by the user.
  // However, just in case we do it.
  let hashed = hashPassword(password);
  let accountDb = getAccountDb();
  accountDb.mutate('UPDATE auth SET active = 0');
  accountDb.mutate(
    "INSERT INTO auth (method, display_name, extra_data, active) VALUES ('password', 'Password', ?, 1)",
    [hashed],
  );

  return {};
}

export function loginWithPassword(password) {
  let accountDb = getAccountDb();
  let row = accountDb.first(
    "SELECT extra_data FROM auth WHERE method = 'password'",
  );
  let confirmed = row && bcrypt.compareSync(password, row.extra_data);

  if (confirmed) {
    let row = accountDb.first(
      'SELECT token FROM sessions WHERE user_name = ?',
      [''],
    );

    clearExpiredSessions();

    return row.token;
  } else {
    return null;
  }
}

export function changePassword(newPassword) {
  let accountDb = getAccountDb();

  if (newPassword == null || newPassword === '') {
    return { error: 'invalid-password' };
  }

  let hashed = hashPassword(newPassword);
  accountDb.mutate("UPDATE auth SET extra_data = ? WHERE method = 'password'", [
    hashed,
  ]);
  return {};
}
