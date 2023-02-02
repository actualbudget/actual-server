let bcrypt = require('bcrypt');
let uuid = require('uuid');
let { validateUser } = require('./util/validate-user');
let { getAccountDb } = require('./account-db');
let { getKey } = require('./util/read-body');

// app.use(errorMiddleware);

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

/** @type {import('fastify').FastifyPluginCallback} */
module.exports = (fastify, opts, done) => {
  fastify.register(require('./util/error-plugin'));

  // Non-authenticated endpoints:
  //
  // /boostrap (special endpoint for setting up the instance, cant call again)
  // /login

  fastify.get('/needs-bootstrap', (req, res) => {
    let accountDb = getAccountDb();
    let rows = accountDb.all('SELECT * FROM auth');

    return {
      status: 'ok',
      data: { bootstrapped: rows.length > 0 }
    };
  });

  fastify.post('/bootstrap', (req, res) => {
    let password = getKey(req, 'password');
    let accountDb = getAccountDb();

    let rows = accountDb.all('SELECT * FROM auth');
    if (rows.length !== 0) {
      res.status(400);
      return { status: 'error', reason: 'already-bootstrapped' };
    }

    if (!password) {
      res.status(400);
      return { status: 'error', reason: 'invalid-password' };
    }

    // Hash the password. There's really not a strong need for this
    // since this is a self-hosted instance owned by the user.
    // However, just in case we do it.
    let hashed = hashPassword(password);
    accountDb.mutate('INSERT INTO auth (password) VALUES (?)', [hashed]);

    let token = uuid.v4();
    accountDb.mutate('INSERT INTO sessions (token) VALUES (?)', [token]);

    return { status: 'ok', data: { token } };
  });

  fastify.post('/login', (req, res) => {
    let password = getKey(req, 'password');
    let accountDb = getAccountDb();

    let row = accountDb.first('SELECT * FROM auth');
    let confirmed = row && bcrypt.compareSync(password, row.password);

    let token = null;
    if (confirmed) {
      // Right now, tokens are permanent and there's just one in the
      // system. In the future this should probably evolve to be a
      // "session" that times out after a long time or something, and
      // maybe each device has a different token
      let row = accountDb.first('SELECT * FROM sessions');
      token = row.token;
    }

    return { status: 'ok', data: { token } };
  });

  fastify.post('/change-password', (req, res) => {
    let user = validateUser(req, res);
    if (!user) return;

    let accountDb = getAccountDb();
    let password = getKey(req, 'password');

    if (!password) {
      return { status: 'error', reason: 'invalid-password' };
    }

    let hashed = hashPassword(password);
    let token = uuid.v4();
    // Note that this doesn't have a WHERE. This table only ever has 1
    // row (maybe that will change in the future? if this this will not work)
    accountDb.mutate('UPDATE auth SET password = ?', [hashed]);
    accountDb.mutate('UPDATE sessions SET token = ?', [token]);

    return { status: 'ok', data: {} };
  });

  fastify.get('/validate', (req, res) => {
    let user = validateUser(req, res);
    if (user) {
      return { status: 'ok', data: { validated: true } };
    }
    return { status: 'error', reason: 'unauthorized' };
  });

  done();
};
