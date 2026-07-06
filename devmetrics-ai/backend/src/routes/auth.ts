import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { authRateLimiter } from '../middleware/rateLimiter';
import { v4 as uuidv4 } from 'uuid';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
authRouter.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const { name, email, password, orgName } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        members: {
          create: {
            role: 'OWNER',
            organization: {
              create: { name: orgName, slug },
            },
          },
        },
      },
      include: {
        members: { include: { organization: true } },
      },
    });

    const org = user.members[0].organization;
    const accessToken = signAccessToken({ userId: user.id, email: user.email, orgId: org.id });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, orgId: org.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
      org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
authRouter.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { members: { include: { organization: true }, take: 1 } },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const org = user.members[0]?.organization;
    const accessToken = signAccessToken({ userId: user.id, email: user.email, orgId: org?.id });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, orgId: org?.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
      org: org ? { id: org.id, name: org.name, slug: org.slug, plan: org.plan } : null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = signAccessToken({ userId: payload.userId, email: payload.email, orgId: payload.orgId });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
authRouter.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});
