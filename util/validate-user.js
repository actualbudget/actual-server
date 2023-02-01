let { getAccountDb } = require('../account-db');

/**
 * @param {import('fastify').FastifyRequest} req
 * @param {import('fastify').FastifyReply} res
 */
function validateUser(req, res) {
  /** @type {any} */
  let { token } = req.body || {};

  if (!token) {
    token = req.headers['x-actual-token'];
  }

  let db = getAccountDb();
  let rows = db.all('SELECT * FROM sessions WHERE token = ?', [token]);

  if (rows.length === 0) {
    res.status(401);
    res.send({
      status: 'error',
      reason: 'unauthorized',
      details: 'token-not-found'
    });
    return null;
  }

  return rows[0];
}

module.exports = { validateUser };
