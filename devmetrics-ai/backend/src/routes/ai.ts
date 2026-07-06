import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { getCache, setCache } from '../lib/redis';
import { authenticate, AuthRequest } from '../middleware/auth';

export const aiRouter = Router();
aiRouter.use(authenticate);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

// GET /api/ai/report — Generate weekly AI report
aiRouter.get('/report', async (req: AuthRequest, res, next) => {
  try {
    const orgId = req.user!.orgId!;
    const cacheKey = `ai:report:${orgId}`;
    const cached = await getCache<{ report: string }>(cacheKey);
    if (cached) return res.json(cached);

    // Get last 7 days of metrics
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [metrics, org] = await Promise.all([
      prisma.metric.findMany({
        where: { organizationId: orgId, date: { gte: since } },
        include: { project: true },
      }),
      prisma.organization.findUnique({ where: { id: orgId } }),
    ]);

    if (!metrics.length) {
      return res.json({ report: "No metrics data found for the past week. Start tracking commits, PRs, and deployments to get AI-powered insights!" });
    }

    // Aggregate for the prompt
    const totals = metrics.reduce((acc, m) => ({
      commits: acc.commits + m.commits,
      pullRequests: acc.pullRequests + m.pullRequests,
      mergedPRs: acc.mergedPRs + m.mergedPRs,
      issuesClosed: acc.issuesClosed + m.issuesClosed,
      deployments: acc.deployments + m.deployments,
      linesAdded: acc.linesAdded + m.linesAdded,
      linesRemoved: acc.linesRemoved + m.linesRemoved,
    }), { commits: 0, pullRequests: 0, mergedPRs: 0, issuesClosed: 0, deployments: 0, linesAdded: 0, linesRemoved: 0 });

    const prMergeRate = totals.pullRequests > 0
      ? Math.round((totals.mergedPRs / totals.pullRequests) * 100)
      : 0;

    const prompt = `You are a senior engineering manager analyzing the weekly productivity metrics for ${org?.name || 'the team'}.

Here are the metrics for the past 7 days:
- Total commits: ${totals.commits}
- Pull requests opened: ${totals.pullRequests}
- Pull requests merged: ${totals.mergedPRs} (${prMergeRate}% merge rate)
- Issues closed: ${totals.issuesClosed}
- Deployments: ${totals.deployments}
- Lines added: ${totals.linesAdded.toLocaleString()}
- Lines removed: ${totals.linesRemoved.toLocaleString()}

Write a concise, insightful weekly report in 3 sections:
1. **This Week's Highlights** — what went well (2-3 bullets)
2. **Areas to Watch** — any patterns that need attention (2-3 bullets)
3. **Recommendation** — one actionable suggestion for next week

Use a professional but friendly tone. Be specific and data-driven. Keep it under 300 words.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    });

    const report = completion.choices[0].message.content || 'Unable to generate report.';

    // Save to DB
    await prisma.aiReport.create({
      data: {
        title: `Weekly Report — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        content: report,
        periodStart: since,
        periodEnd: new Date(),
        organizationId: orgId,
      },
    });

    const result = { report };
    await setCache(cacheKey, result, 3600); // Cache for 1 hour
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/chat — Streaming AI chat about team metrics
aiRouter.post('/chat', async (req: AuthRequest, res, next) => {
  try {
    const orgId = req.user!.orgId!;
    const { message, history } = chatSchema.parse(req.body);

    // Get metrics context
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const metrics = await prisma.metric.findMany({
      where: { organizationId: orgId, date: { gte: since } },
    });

    const totals = metrics.reduce((acc, m) => ({
      commits: acc.commits + m.commits,
      pullRequests: acc.pullRequests + m.pullRequests,
      mergedPRs: acc.mergedPRs + m.mergedPRs,
      issuesClosed: acc.issuesClosed + m.issuesClosed,
      deployments: acc.deployments + m.deployments,
    }), { commits: 0, pullRequests: 0, mergedPRs: 0, issuesClosed: 0, deployments: 0 });

    const systemPrompt = `You are DevMetrics AI, an expert engineering analytics assistant. You have access to this team's last 30 days of data:
- Commits: ${totals.commits}
- Pull Requests: ${totals.pullRequests} (${totals.mergedPRs} merged)
- Issues closed: ${totals.issuesClosed}  
- Deployments: ${totals.deployments}

Answer questions about productivity, best practices, and engineering metrics. Be concise and actionable. If asked about data you don't have, say so honestly.`;

    // Set up SSE for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/reports — List past AI reports
aiRouter.get('/reports', async (req: AuthRequest, res, next) => {
  try {
    const orgId = req.user!.orgId!;
    const reports = await prisma.aiReport.findMany({
      where: { organizationId: orgId },
      orderBy: { generatedAt: 'desc' },
      take: 10,
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});
