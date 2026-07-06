import { Router, Response } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest, requireRole } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { invalidateCache } from '../lib/redis'

const router = Router()
router.use(authenticate)

// GET /teams
router.get('/', async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.user!

  const teams = await prisma.team.findMany({
    where: { workspaceId },
    include: { members: true, _count: { select: { metrics: true } } },
    orderBy: { createdAt: 'asc' },
  })

  res.json(teams)
})

// POST /teams
router.post('/', requireRole('OWNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(1).max(60),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { workspaceId } = req.user!
  const team = await prisma.team.create({
    data: { workspaceId, ...parsed.data },
    include: { members: true },
  })

  await invalidateCache(`metrics:${workspaceId}:*`)
  res.status(201).json(team)
})

// GET /teams/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.user!

  const team = await prisma.team.findFirst({
    where: { id: req.params.id, workspaceId },
    include: { members: true },
  })

  if (!team) return res.status(404).json({ error: 'Team not found' })
  res.json(team)
})

// POST /teams/:id/members
router.post('/:id/members', requireRole('OWNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    githubLogin: z.string().min(1),
    name: z.string().min(1),
    avatarUrl: z.string().url().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { workspaceId } = req.user!
  const team = await prisma.team.findFirst({ where: { id: req.params.id, workspaceId } })
  if (!team) return res.status(404).json({ error: 'Team not found' })

  const member = await prisma.teamMember.create({
    data: { teamId: team.id, ...parsed.data },
  })

  res.status(201).json(member)
})

// DELETE /teams/:id
router.delete('/:id', requireRole('OWNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.user!
  const team = await prisma.team.findFirst({ where: { id: req.params.id, workspaceId } })
  if (!team) return res.status(404).json({ error: 'Team not found' })

  await prisma.team.delete({ where: { id: team.id } })
  await invalidateCache(`metrics:${workspaceId}:*`)
  res.json({ success: true })
})

export default router
