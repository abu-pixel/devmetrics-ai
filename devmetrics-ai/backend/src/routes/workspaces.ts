import { Router, Response } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest, requireRole } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()
router.use(authenticate)

// GET /workspaces/me
router.get('/me', async (req: AuthRequest, res: Response) => {
  const { workspaceId, id: userId } = req.user!

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      },
    },
  })

  if (!workspace) return res.status(404).json({ error: 'Workspace not found' })
  res.json(workspace)
})

// PATCH /workspaces/me
router.patch('/me', requireRole('OWNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).max(60).optional(),
    logoUrl: z.string().url().optional().nullable(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const workspace = await prisma.workspace.update({
    where: { id: req.user!.workspaceId },
    data: parsed.data,
  })

  res.json(workspace)
})

// GET /workspaces/me/members
router.get('/me/members', async (req: AuthRequest, res: Response) => {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: req.user!.workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  res.json(members)
})

// PATCH /workspaces/me/members/:userId — update role
router.patch('/me/members/:userId', requireRole('OWNER'), async (req: AuthRequest, res: Response) => {
  const schema = z.object({ role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const member = await prisma.workspaceMember.updateMany({
    where: { workspaceId: req.user!.workspaceId, userId: req.params.userId },
    data: { role: parsed.data.role },
  })

  res.json(member)
})

// DELETE /workspaces/me/members/:userId
router.delete('/me/members/:userId', requireRole('OWNER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  if (req.params.userId === req.user!.id) {
    return res.status(400).json({ error: "Can't remove yourself" })
  }

  await prisma.workspaceMember.deleteMany({
    where: { workspaceId: req.user!.workspaceId, userId: req.params.userId },
  })

  res.json({ success: true })
})

export default router
