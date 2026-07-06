# DevMetrics AI — SaaS Engineering Analytics Dashboard

AI-powered developer productivity platform for engineering teams. Real-time metrics, WebSocket live updates, streaming AI chat, Stripe billing, and multi-tenant architecture.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Zustand, Socket.io |
| Backend | Node.js, Express, TypeScript, Socket.io, Zod |
| Database | PostgreSQL 16, Prisma ORM |
| Cache | Redis 7 |
| AI | OpenAI GPT-4o mini, Server-Sent Events streaming |
| Payments | Stripe Checkout + Webhooks |
| Auth | JWT access tokens + refresh token rotation, bcrypt |
| DevOps | Docker, Docker Compose, GitHub Actions CI/CD |

---

## Features

- Real-time dashboard with live WebSocket metric updates
- AI chat assistant that reads your team's actual data and answers questions about it
- Auto-generated weekly AI productivity reports
- Per-developer breakdown — commits, PRs, reviews, deployments, velocity score
- Multi-tenant architecture — each organization gets its own isolated workspace
- JWT authentication with 15-minute access tokens and 7-day refresh token rotation
- Redis caching layer with smart cache invalidation on new data
- Stripe subscription billing with Free and Pro plans
- GitHub Actions CI/CD pipeline with Docker build and SSH deployment

---

## Getting Started

### Prerequisites

- Node.js v20+
- Docker Desktop

### Run with Docker

```bash
git clone https://github.com/YOURUSERNAME/devmetrics-ai
cd devmetrics-ai

# Start Postgres and Redis
docker compose up postgres redis -d

# Backend
cd backend
cp .env.example .env
# Add OPENAI_API_KEY and STRIPE_SECRET_KEY to .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

Demo login: `demo@devmetrics.ai` / `password123`

---

## Project Structure

```
devmetrics-ai/
├── .github/workflows/ci.yml       # CI/CD pipeline
├── docker-compose.yml             # Postgres + Redis + app containers
├── backend/
│   ├── prisma/schema.prisma       # 6-model database schema
│   └── src/
│       ├── index.ts               # Express + Socket.io server
│       ├── routes/
│       │   ├── auth.ts            # Register, login, refresh, logout
│       │   ├── metrics.ts         # Overview, team, ingest endpoints
│       │   ├── ai.ts              # Streaming chat + weekly report
│       │   ├── org.ts             # Organization and project management
│       │   └── stripe.ts          # Checkout session + webhook handler
│       ├── middleware/
│       │   ├── auth.ts            # JWT authentication guard
│       │   ├── errorHandler.ts    # Global error handler
│       │   └── rateLimiter.ts     # Rate limiting per IP
│       └── lib/
│           ├── prisma.ts          # Database client singleton
│           ├── redis.ts           # Cache helpers (get, set, invalidate)
│           ├── jwt.ts             # Token sign and verify utilities
│           ├── socket.ts          # WebSocket room handlers
│           └── seed.ts            # Demo data seeder (30 days of metrics)
└── frontend/
    └── src/
        ├── app/
        │   ├── dashboard/
        │   │   ├── layout.tsx     # Auth guard + sidebar + AI chat panel
        │   │   ├── overview/      # Main metrics dashboard with charts
        │   │   ├── team/          # Developer leaderboard and breakdown
        │   │   ├── reports/       # AI-generated weekly reports archive
        │   │   └── settings/      # Billing and organization settings
        │   └── auth/
        │       ├── login/
        │       └── register/
        ├── components/
        │   ├── layout/Sidebar.tsx
        │   ├── charts/            # ActivityChart, TeamBarChart (Recharts)
        │   ├── ui/                # StatCard, LoadingSpinner
        │   └── ai-chat/           # Streaming AI chat with SSE
        ├── hooks/
        │   ├── useMetrics.ts      # Data fetching with auto-refresh
        │   └── useSocket.ts       # WebSocket connection hook
        ├── store/auth.ts          # Zustand auth store with persistence
        └── types/index.ts         # Shared TypeScript interfaces
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create user and organization |
| POST | /api/auth/login | Login and receive tokens |
| POST | /api/auth/refresh | Rotate access token |
| POST | /api/auth/logout | Invalidate refresh token |
| GET | /api/metrics/overview | Aggregated metrics with timeline |
| GET | /api/metrics/team | Per-developer metric breakdown |
| POST | /api/metrics | Ingest a new metric event |
| GET | /api/ai/report | Generate weekly AI summary |
| POST | /api/ai/chat | Streaming AI chat (SSE) |
| GET | /api/ai/reports | List past AI reports |
| POST | /api/stripe/checkout | Create Stripe checkout session |
| POST | /api/stripe/webhook | Handle Stripe subscription events |
| GET | /api/org/me | Current user and organization |
| GET | /api/org/projects | List projects |
| POST | /api/org/projects | Create a project |

---

## Deployment

**Backend → Railway**
- Connect GitHub repo, set root directory to `backend`
- Add Postgres and Redis plugins (Railway auto-fills the connection URLs)
- Add `OPENAI_API_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET` as environment variables

**Frontend → Vercel**
- Connect GitHub repo, set root directory to `frontend`
- Add `NEXT_PUBLIC_API_URL` pointing to your Railway backend URL

**After deploying, seed the database:**
```bash
npx prisma migrate deploy
npm run db:seed
```

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
PORT=4000
NODE_ENV=development
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---

## License

MIT
