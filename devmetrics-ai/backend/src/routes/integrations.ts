import { Router, Response } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest, requireRole } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()
router.use(authenticate)

// GET /integrations
router.get('/', async (req: AuthRequest, res: Response) => {
  const integrations = await prisma.integration.findMany({
    where: { workspaceId: req.user!.workspaceId },
    select: { id: true, type: true, connectedAt: true, metadata: true },
  })
  res.json(integrations)
})

// POST /integrations — connect an integration
router.post('/', requireRole('OWNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    type: z.enum(['github', 'jira', 'linear']),
    accessToken: z.string().min(1),
    metadata: z.record(z.unknown()).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { workspaceId } = req.user!
  const integration = await prisma.integration.upsert({
    where: { workspaceId_type: { workspaceId, type: parsed.data.type } },
    create: { workspaceId, ...parsed.data, metadata: parsed.data.metadata ?? {} },
    update: { accessToken: parsed.data.accessToken, metadata: parsed.data.metadata ?? {} },
  })

  res.status(201).json({ id: integration.id, type: integration.type, connectedAt: integration.connectedAt })
})

// DELETE /integrations/:type
router.delete('/:type', requireRole('OWNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  await prisma.integration.deleteMany({
    where: { workspaceId: req.user!.workspaceId, type: req.params.type },
  })
  res.json({ success: true })
})

export default router
