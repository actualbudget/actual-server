import Redlock from 'redlock';
import ioredis from 'ioredis';
import { createClient, RedisClientType } from 'redis';
import finalConfig from '../load-config.js';
import JWTR from 'jwt-redis';

// Initialize client with ioredis
export const redisClient = createClient() as RedisClientType;

redisClient.on('error', (err) => console.log('Redis Client Error', err));

await redisClient.connect();

export const sessionPrefix = 'actual:';
export const credsPrefix = 'actualCreds:';

export const jwtr = new JWTR.default(redisClient as RedisClientType);

// 12h
export const expiresIn = 1000 * 60 * 60 * 12;

// Create a Redlock instance for distributed locking
export const redlock = new Redlock([ioredis.Redis.createClient()]);

export const config = {
  dataDir: finalConfig.apiFiles,
  serverURL: 'http://localhost:' + finalConfig.port,
};
