# DevMetrics AI — SaaS Engineering Analytics Dashboard

> AI-powered developer productivity platform for engineering teams. Built with Next.js 14, Node.js, PostgreSQL, Redis, WebSockets, OpenAI, Stripe, and Docker.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Node.js](https://img.shields.io/badge/Node.js-20-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue) ![Redis](https://img.shields.io/badge/Redis-7-red) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-purple) ![Docker](https://img.shields.io/badge/Docker-Compose-blue) ![Stripe](https://img.shields.io/badge/Stripe-Billing-purple)

## Features

- **Real-time dashboard** — Live metric updates via WebSocket (Socket.io)
- **AI chat assistant** — Streaming GPT-4o powered Q&A about your team's data
- **Weekly AI reports** — Auto-generated engineering productivity summaries
- **Team analytics** — Per-developer commit, PR, review, and deployment tracking
- **Multi-tenant** — Workspace isolation per organization
- **Stripe billing** — Free/Pro plan with Stripe Checkout + webhooks
- **JWT auth** — Access tokens (15min) + refresh token rotation (7 days)
- **Redis caching** — API response caching with smart invalidation
- **CI/CD** — GitHub Actions pipeline with Docker build + SSH deploy

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Zustand, Socket.io client |
| Backend | Node.js, Express, TypeScript, Socket.io, Zod validation |
| Database | PostgreSQL 16, Prisma ORM |
| Cache | Redis 7 (caching + pub/sub) |
| AI | OpenAI GPT-4o mini, streaming SSE responses |
| Payments | Stripe (Checkout, webhooks, subscription management) |
| Auth | JWT (access + refresh tokens), bcrypt |
| DevOps | Docker, Docker Compose, GitHub Actions CI/CD |

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/yourusername/devmetrics-ai
cd devmetrics-ai

# Backend env
cp backend/.env.example backend/.env
# Add your OPENAI_API_KEY and STRIPE_SECRET_KEY

# Frontend env
cp frontend/.env.local.example frontend/.env.local
```

### 2. Run with Docker Compose

```bash
docker compose up -d
```

### 3. Run migrations and seed demo data

```bash
docker compose exec backend npx prisma migrate dev
docker compose exec backend npm run db:seed
```

### 4. Open the app

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Demo login: `demo@devmetrics.ai` / `password123`

## Development (without Docker)

```bash
# Start infrastructure
docker compose up postgres redis -d

# Backend
cd backend && npm install
npx prisma generate && npx prisma migrate dev
npm run db:seed
npm run dev

# Frontend (new terminal)
cd frontend && npm install
npm run dev
```

## Project Structure

```
devmetrics-ai/
├── .github/workflows/ci.yml     # CI/CD pipeline
├── docker-compose.yml
├── backend/
│   ├── prisma/schema.prisma     # Database schema (6 models)
│   ├── src/
│   │   ├── index.ts             # Express + Socket.io server
│   │   ├── routes/
│   │   │   ├── auth.ts          # Register, login, refresh, logout
│   │   │   ├── metrics.ts       # Overview, team, ingest endpoints
│   │   │   ├── ai.ts            # Streaming chat + report generation
│   │   │   ├── org.ts           # Organization & project management
│   │   │   └── stripe.ts        # Checkout + webhooks
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT authentication
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   └── lib/
│   │       ├── prisma.ts        # Database client
│   │       ├── redis.ts         # Cache helpers
│   │       ├── jwt.ts           # Token utilities
│   │       ├── socket.ts        # Real-time handlers
│   │       └── seed.ts          # Demo data seeder
└── frontend/
    └── src/
        ├── app/
        │   ├── dashboard/
        │   │   ├── layout.tsx   # Auth guard + sidebar + AI chat
        │   │   ├── overview/    # Main metrics dashboard
        │   │   ├── team/        # Team leaderboard
        │   │   ├── reports/     # AI-generated reports
        │   │   └── settings/    # Billing + org settings
        │   └── auth/
        │       ├── login/
        │       └── register/
        ├── components/
        │   ├── layout/Sidebar.tsx
        │   ├── charts/          # Recharts wrappers
        │   ├── ui/              # StatCard, LoadingSpinner
        │   └── ai-chat/         # Streaming AI chat component
        ├── hooks/
        │   ├── useMetrics.ts    # Data fetching hooks
        │   └── useSocket.ts     # WebSocket hook
        ├── store/auth.ts        # Zustand auth store
        └── types/index.ts       # TypeScript interfaces
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create user + org |
| POST | /api/auth/login | Get tokens |
| POST | /api/auth/refresh | Rotate access token |
| GET | /api/metrics/overview | Aggregated metrics |
| GET | /api/metrics/team | Per-developer breakdown |
| POST | /api/metrics | Ingest metric event |
| GET | /api/ai/report | Generate weekly AI report |
| POST | /api/ai/chat | Streaming AI chat (SSE) |
| POST | /api/stripe/checkout | Create checkout session |
| POST | /api/stripe/webhook | Handle Stripe events |

## License

MIT
