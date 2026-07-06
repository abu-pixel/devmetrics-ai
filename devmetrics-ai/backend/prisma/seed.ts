import { PrismaClient, MetricType, Plan, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const passwordHash = await bcrypt.hash('demo1234', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@devmetrics.ai' },
    update: {},
    create: {
      email: 'demo@devmetrics.ai',
      name: 'Alex Chen',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexchen',
      passwordHash,
    },
  })

  // Create workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme-engineering' },
    update: {},
    create: {
      name: 'Acme Engineering',
      slug: 'acme-engineering',
      plan: Plan.PRO,
      subscriptionStatus: 'ACTIVE',
      members: {
        create: { userId: user.id, role: Role.OWNER },
      },
    },
  })

  // Create teams
  const teams = await Promise.all([
    prisma.team.upsert({
      where: { id: 'team-platform' },
      update: {},
      create: {
        id: 'team-platform',
        workspaceId: workspace.id,
        name: 'Platform',
        color: '#6366f1',
        members: {
          create: [
            { githubLogin: 'alexchen', name: 'Alex Chen', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexchen' },
            { githubLogin: 'sarah_dev', name: 'Sarah Kim', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarahkim' },
            { githubLogin: 'mike_codes', name: 'Mike Torres', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=miketorres' },
          ],
        },
      },
    }),
    prisma.team.upsert({
      where: { id: 'team-growth' },
      update: {},
      create: {
        id: 'team-growth',
        workspaceId: workspace.id,
        name: 'Growth',
        color: '#10b981',
        members: {
          create: [
            { githubLogin: 'priya_eng', name: 'Priya Patel', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priyapatel' },
            { githubLogin: 'james_full', name: 'James Okafor', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jamesokafor' },
          ],
        },
      },
    }),
  ])

  // Seed 90 days of metrics
  const metricTypes: MetricType[] = [
    'COMMITS', 'PRS_OPENED', 'PRS_MERGED',
    'CODE_REVIEWS', 'ISSUES_CLOSED', 'DEPLOY_FREQUENCY',
  ]

  const metrics: Parameters<typeof prisma.metric.createMany>[0]['data'] = []
  const today = new Date()

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const date = new Date(today)
    date.setDate(today.getDate() - daysAgo)
    date.setHours(0, 0, 0, 0)

    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const multiplier = isWeekend ? 0.2 : 1

    for (const team of teams) {
      for (const type of metricTypes) {
        const baseValues: Record<MetricType, number> = {
          COMMITS: 12,
          PRS_OPENED: 4,
          PRS_MERGED: 3,
          CODE_REVIEWS: 6,
          ISSUES_CLOSED: 5,
          DEPLOY_FREQUENCY: 1.5,
          LEAD_TIME: 48,
          CHANGE_FAIL_RATE: 0.05,
        }
        const base = baseValues[type] * multiplier
        const value = Math.max(0, base + (Math.random() - 0.5) * base * 0.4)

        metrics.push({
          workspaceId: workspace.id,
          teamId: team.id,
          type,
          value: Math.round(value * 10) / 10,
          date,
        })
      }
    }
  }

  await prisma.metric.createMany({ data: metrics, skipDuplicates: true })

  console.log(`✅ Seeded workspace: ${workspace.name}`)
  console.log(`✅ Seeded ${metrics.length} metrics`)
  console.log(`\n🔑 Demo login:\n   Email: demo@devmetrics.ai\n   Password: demo1234`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
