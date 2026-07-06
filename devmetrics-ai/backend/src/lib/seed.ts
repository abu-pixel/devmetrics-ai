import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@devmetrics.ai' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'demo@devmetrics.ai',
      passwordHash,
      members: {
        create: {
          role: 'OWNER',
          organization: {
            create: {
              name: 'Acme Engineering',
              slug: 'acme-engineering',
              plan: 'PRO',
            },
          },
        },
      },
    },
    include: { members: { include: { organization: true } } },
  });

  const orgId = user.members[0].organization.id;

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Platform API',
      repoUrl: 'https://github.com/acme/platform-api',
      description: 'Core backend API',
      organizationId: orgId,
    },
  });

  // Seed 30 days of metrics
  const authors = [
    { name: 'Alex Rivera', email: 'alex@acme.com' },
    { name: 'Sam Chen', email: 'sam@acme.com' },
    { name: 'Jordan Lee', email: 'jordan@acme.com' },
    { name: 'Taylor Kim', email: 'taylor@acme.com' },
  ];

  const metrics = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    for (const author of authors) {
      if (Math.random() > 0.2) { // 80% chance author has activity that day
        metrics.push({
          date,
          commits: Math.floor(Math.random() * 8) + 1,
          pullRequests: Math.floor(Math.random() * 3),
          mergedPRs: Math.floor(Math.random() * 2),
          issuesClosed: Math.floor(Math.random() * 4),
          linesAdded: Math.floor(Math.random() * 500) + 50,
          linesRemoved: Math.floor(Math.random() * 200),
          reviewsGiven: Math.floor(Math.random() * 3),
          deployments: Math.random() > 0.85 ? 1 : 0,
          authorName: author.name,
          authorEmail: author.email,
          projectId: project.id,
          organizationId: orgId,
        });
      }
    }
  }

  await prisma.metric.createMany({ data: metrics, skipDuplicates: true });
  console.log(`✅ Seeded ${metrics.length} metrics`);
  console.log('📧 Demo login: demo@devmetrics.ai / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
