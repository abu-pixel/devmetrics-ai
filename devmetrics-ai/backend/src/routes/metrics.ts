import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { getCache, setCache, invalidateCache } from '../lib/redis';
import { authenticate, AuthRequest } from '../middleware/auth';
import { io } from '../index';

export const metricsRouter = Router();
metricsRouter.use(authenticate);

const metricSchema = z.object({
  projectId: z.string(),
  date: z.string().datetime(),
  commits: z.number().int().min(0).default(0),
  pullRequests: z.number().int().min(0).default(0),
  mergedPRs: z.number().int().min(0).default(0),
  issuesClosed: z.number().int().min(0).default(0),
  linesAdded: z.number().int().min(0).default(0),
  linesRemoved: z.number().int().min(0).default(0),
  reviewsGiven: z.number().int().min(0).default(0),
  deployments: z.number().int().min(0).default(0),
  authorName: z.string().optional(),
  authorEmail: z.string().optional(),
});

// GET /api/metrics/overview
metricsRouter.get('/overview', async (req: AuthRequest, res, next) => {
  try {
    const orgId = req.user!.orgId!;
    const { days = '30' } = req.query;

    const cacheKey = `metrics:overview:${orgId}:${days}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const metrics = await prisma.metric.findMany({
      where: { organizationId: orgId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    const totals = metrics.reduce((acc, m) => ({
      commits: acc.commits + m.commits,
      pullRequests: acc.pullRequests + m.pullRequests,
      mergedPRs: acc.mergedPRs + m.mergedPRs,
      issuesClosed: acc.issuesClosed + m.issuesClosed,
      linesAdded: acc.linesAdded + m.linesAdded,
      linesRemoved: acc.linesRemoved + m.linesRemoved,
      reviewsGiven: acc.reviewsGiven + m.reviewsGiven,
      deployments: acc.deployments + m.deployments,
    }), { commits: 0, pullRequests: 0, mergedPRs: 0, issuesClosed: 0, linesAdded: 0, linesRemoved: 0, reviewsGiven: 0, deployments: 0 });

    // Group by date for charts
    const byDate = metrics.reduce((acc: Record<string, typeof totals & { date: string }>, m) => {
      const dateStr = m.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, commits: 0, pullRequests: 0, mergedPRs: 0, issuesClosed: 0, linesAdded: 0, linesRemoved: 0, reviewsGiven: 0, deployments: 0 };
      }
      acc[dateStr].commits += m.commits;
      acc[dateStr].pullRequests += m.pullRequests;
      acc[dateStr].mergedPRs += m.mergedPRs;
      acc[dateStr].issuesClosed += m.issuesClosed;
      acc[dateStr].linesAdded += m.linesAdded;
      acc[dateStr].linesRemoved += m.linesRemoved;
      acc[dateStr].deployments += m.deployments;
      return acc;
    }, {});

    const result = { totals, timeline: Object.values(byDate), raw: metrics };
    await setCache(cacheKey, result, 120);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/metrics/team
metricsRouter.get('/team', async (req: AuthRequest, res, next) => {
  try {
    const orgId = req.user!.orgId!;
    const { days = '30' } = req.query;

    const cacheKey = `metrics:team:${orgId}:${days}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const metrics = await prisma.metric.findMany({
      where: { organizationId: orgId, date: { gte: since }, authorEmail: { not: null } },
      orderBy: { date: 'asc' },
    });

    const byAuthor: Record<string, { name: string; email: string; commits: number; pullRequests: number; mergedPRs: number; issuesClosed: number; reviewsGiven: number; deployments: number }> = {};

    for (const m of metrics) {
      if (!m.authorEmail) continue;
      if (!byAuthor[m.authorEmail]) {
        byAuthor[m.authorEmail] = {
          name: m.authorName || m.authorEmail,
          email: m.authorEmail,
          commits: 0, pullRequests: 0, mergedPRs: 0,
          issuesClosed: 0, reviewsGiven: 0, deployments: 0,
        };
      }
      byAuthor[m.authorEmail].commits += m.commits;
      byAuthor[m.authorEmail].pullRequests += m.pullRequests;
      byAuthor[m.authorEmail].mergedPRs += m.mergedPRs;
      byAuthor[m.authorEmail].issuesClosed += m.issuesClosed;
      byAuthor[m.authorEmail].reviewsGiven += m.reviewsGiven;
      byAuthor[m.authorEmail].deployments += m.deployments;
    }

    const result = Object.values(byAuthor).sort((a, b) => b.commits - a.commits);
    await setCache(cacheKey, result, 120);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/metrics — ingest new metric (e.g. from GitHub webhook)
metricsRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const orgId = req.user!.orgId!;
    const data = metricSchema.parse(req.body);

    const metric = await prisma.metric.create({
      data: { ...data, date: new Date(data.date), organizationId: orgId },
    });

    // Invalidate cache
    await invalidateCache(`metrics:*:${orgId}:*`);

    // Broadcast via WebSocket
    io.to(`org:${orgId}`).emit('metric:update', metric);

    res.status(201).json(metric);
  } catch (err) {
    next(err);
  }
});
