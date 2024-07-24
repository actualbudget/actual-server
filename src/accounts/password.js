import * as bcrypt from 'bcrypt';
import * as uuid from 'uuid';
import getAccountDb from '../account-db.js';

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
    "INSERT INTO auth (method, extra_data, active) VALUES ('password', ?, 1)",
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
    // Right now, tokens are permanent and there's just one in the
    // system. In the future this should probably evolve to be a
    // "session" that times out after a long time or something, and
    // maybe each device has a different token
    let row = accountDb.first('SELECT token FROM sessions');
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
  let token = uuid.v4();
  // This query does nothing if password authentication was disabled during
  // bootstrap (then no row with method=password exists). Maybe we should
  // return an error here if that is the case?
  accountDb.mutate("UPDATE auth SET extra_data = ? WHERE method = 'password'", [
    hashed,
  ]);
  accountDb.mutate('UPDATE sessions SET token = ?', [token]);
  return {};
}
