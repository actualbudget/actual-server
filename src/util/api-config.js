import Redlock from 'redlock';
import RedisStore from 'connect-redis';
import redis from 'ioredis';
import finalConfig from '../load-config.js';

// Initialize client with ioredis
export const redisClient = new redis.Redis();

export const sessionPrefix = 'actual:';
export const credsPrefix = 'actualCreds:';

// Initialize store.
export const redisStore = new RedisStore({
  client: redisClient,
  prefix: sessionPrefix,
});

export const oneDay = 1000 * 60 * 60 * 24;

// Create a Redlock instance for distributed locking
export const redlock = new Redlock([redisClient]);

export const config = {
  dataDir: finalConfig.apiFiles,
  serverURL: 'http://localhost:' + finalConfig.port,
  password: process.env.password,
};
