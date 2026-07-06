import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const orgRouter = Router();
orgRouter.use(authenticate);

// GET /api/org/me
orgRouter.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        members: {
          include: {
            organization: {
              include: { members: { include: { user: true } }, _count: { select: { projects: true, metrics: true } } },
            },
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
});

// GET /api/org/projects
orgRouter.get('/projects', async (req: AuthRequest, res, next) => {
  try {
    const orgId = req.user!.orgId!;
    const projects = await prisma.project.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { metrics: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// POST /api/org/projects
orgRouter.post('/projects', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({ name: z.string().min(1), repoUrl: z.string().url().optional(), description: z.string().optional() });
    const data = schema.parse(req.body);
    const project = await prisma.project.create({
      data: { ...data, organizationId: req.user!.orgId! },
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});
