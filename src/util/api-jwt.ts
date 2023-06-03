import { redisClient, credsPrefix, jwtr, expiresIn } from './api-config.js';

const secret = 'TYLFtYGx23q38V/PgX/L3Ntgj9LGP2c6nTOWpKjYmJc=';

export async function generateToken(payload?) {
  if (!payload) payload = {};
  return await jwtr.sign(payload, secret, { expiresIn: expiresIn.toString() });
}

export async function getCreds(jti) {
  // get creds from redis
  const storedCreds = await redisClient.get(credsPrefix + jti);
  const creds = JSON.parse(storedCreds);
  return creds;
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  try {
    const payload = await jwtr.verify(token, secret);
    req.jti = payload.jti;
    next();
  } catch (err) {
    console.log(err);
    return res.sendStatus(403);
  }
}

export async function authenticateAndReturnToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return;

  try {
    const payload = await jwtr.verify(token, secret);
    return payload.jti;
  } catch (err) {
    console.log(err);
    return;
  }
}
