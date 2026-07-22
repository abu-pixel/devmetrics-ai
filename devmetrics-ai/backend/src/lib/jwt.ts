import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_change_in_production';

// Validate that secrets are set in production
if (process.env.NODE_ENV === 'production') {
  if (JWT_SECRET === 'fallback_secret_change_in_production' || JWT_REFRESH_SECRET === 'fallback_refresh_secret_change_in_production') {
    throw new Error('JWT secrets must be set in production environment');
  }
}

export interface JwtPayload {
  userId: string;
  email: string;
  orgId?: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
    algorithm: 'HS256',
  });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
  }) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    algorithms: ['HS256'],
  }) as JwtPayload;
}
