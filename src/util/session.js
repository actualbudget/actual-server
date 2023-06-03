import jwt from 'jsonwebtoken';
import { redisClient, credsPrefix } from './api-config.js';

export function generateToken(payload) {
  const secret = 'TYLFtYGx23q38V/PgX/L3Ntgj9LGP2c6nTOWpKjYmJc=';
  const options = { expiresIn: '24h' };
  return jwt.sign(payload, secret, options);
}

function verifyToken(token) {
  const secret = 'TYLFtYGx23q38V/PgX/L3Ntgj9LGP2c6nTOWpKjYmJc=';
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(new Error('Invalid token'));
      } else {
        resolve(decoded);
      }
    });
  });
}

export async function getCredsForSession(sessionId, token) {
  // verify and get budgetId from token
  const { budgetId } = await verifyToken(token);
  // get creds from redis
  const storedCreds = await redisClient.get(credsPrefix + sessionId);
  const creds = JSON.parse(storedCreds);
  if (creds && creds.budgetId === budgetId) {
    return creds;
  }
}
