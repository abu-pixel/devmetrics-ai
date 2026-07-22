import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis';

// Global rate limiter (200 requests per 15 minutes)
export const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redis as any,
    prefix: 'rl:global:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Auth rate limiter (10 requests per 15 minutes)
export const authRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis as any,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
  skip: (req) => process.env.NODE_ENV === 'test',
});
