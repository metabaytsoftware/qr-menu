# qr-menu — Claude Code Context

A modern, self-contained QR-based digital menu and ordering system with integrated restaurant management platform.

---

## 🎯 Project Overview

**qr-menu** is a full-stack application for restaurants to provide digital menus via QR codes and manage orders:

- **Backend** (`apps/api/`) — NestJS API with PostgreSQL/Supabase
- **Frontend** (`apps/web/`) — Next.js 16 + React 19, PWA-enabled
- **Shared** (`libs/`) — Domain logic, types, utilities
- **Deployment** — Cloud Run (API), Vercel (Web), Supabase (Database)

---

## 🏗️ Architecture & Tech Stack

### Core Technologies
| Component | Stack | Version |
|-----------|-------|---------|
| **API** | NestJS | 10+ |
| **Web** | Next.js | 16 + React 19 |
| **Database** | PostgreSQL (Supabase) | 15+ |
| **ORM** | Prisma | 5+ |
| **Package Manager** | pnpm | 9+ |
| **Language** | TypeScript | 5.3+ |
| **Styling** | Tailwind CSS | 4+ |
| **Container** | Docker | Alpine Linux |

### Deployment Architecture
```
┌─────────────────────────────────────────────────┐
│           qr-menu Application                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Web Frontend             API Backend           │
│  (Next.js 16)             (NestJS)              │
│  Vercel Hosting           Cloud Run             │
│  europe-west1             europe-west3          │
│                           (Frankfurt)           │
│                                                 │
│  ├─ Admin Dashboard       ├─ REST API          │
│  ├─ QR Code Display       ├─ Menu Service      │
│  ├─ Station Mgmt          ├─ Order Service     │
│  ├─ Reports              ├─ Auth Service      │
│  └─ Settings             └─ Database Sync     │
│                                                 │
│        ↓        Database Connection       ↓     │
│                                                 │
│        PostgreSQL (Supabase - Frankfurt)       │
│        Connection via pgbouncer pooling        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📂 Directory Structure

```
qr-menu-repo/
├── apps/
│   ├── api/                 # NestJS backend service
│   │   ├── src/
│   │   │   ├── modules/     # Domain modules (menu, orders, etc)
│   │   │   ├── common/      # Shared utilities, decorators, guards
│   │   │   ├── guards/      # JWT auth, role-based access
│   │   │   ├── filters/     # Global exception filters
│   │   │   ├── interceptors/# Request/response logging
│   │   │   └── app.module.ts
│   │   ├── prisma/          # Database schema & migrations
│   │   ├── Dockerfile       # Alpine-based multi-stage build
│   │   ├── cloudbuild.yaml  # Cloud Build configuration
│   │   ├── service.yaml     # Cloud Run service definition
│   │   └── package.json
│   │
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App router structure
│       │   │   ├── admin/   # Admin pages
│       │   │   ├── api/     # API routes (reverse proxy)
│       │   │   └── layout.tsx
│       │   ├── components/  # Reusable React components
│       │   ├── lib/         # Utilities, helpers, API client
│       │   └── styles/      # Global styles
│       ├── public/          # Static assets
│       ├── Dockerfile       # Docker build for web
│       ├── vercel.json      # Vercel deployment config
│       ├── next.config.ts   # Next.js configuration
│       └── package.json
│
├── libs/                    # Shared libraries (monorepo workspace)
│   ├── types/              # Shared TypeScript types
│   ├── shared/             # Utilities, helpers, constants
│   ├── auth-api/           # Authentication library
│   ├── finance/            # Financial calculations
│   ├── automation/         # Workflow automation
│   └── youtube/            # YouTube integration
│
├── package.json            # Root workspace config
├── pnpm-workspace.yaml     # pnpm workspace definition
├── tsconfig.base.json      # Shared TypeScript config
├── CLAUDE.md               # This file - AI context
├── DEPLOYMENT_PLAN.md      # Deployment strategy & checklist
├── ARCHITECTURE.md         # Technical decisions & trade-offs
├── CONTRIBUTING.md         # Development guidelines
└── README.md               # Project overview
```

---

## 🔐 Authentication & Security

### JWT Implementation
- **Issuer**: API backend (NestJS)
- **Storage**: HttpOnly cookies (secure, CSRF-protected)
- **Expiry**: 24 hours (access), 7 days (refresh)
- **Scope**: Role-based access control (RBAC)

### Environment Variables
Create `.env` files locally (never commit):

**apps/api/.env**:
```
DATABASE_URL=postgresql://user:password@localhost/qr_menu
JWT_SECRET=your_secret_key
JWT_EXPIRY=24h
NODE_ENV=development
SUPABASE_DB_URL=postgresql://...@db.supabase.co/postgres
```

**apps/web/.env**:
```
NEXT_PUBLIC_BASE_URL=http://localhost:3003
NEXT_PUBLIC_API_URL=http://localhost:3002
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (or Supabase account)
- Docker & Docker Compose (optional, for local deployment)

### Development Setup
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Run database migrations
cd apps/api
npx prisma migrate dev

# Start dev servers
pnpm dev  # Runs all apps in parallel
```

### Build & Deploy
```bash
# Build all packages
pnpm build

# Deploy API to Cloud Run
cd apps/api
./QUICK_DEPLOY.sh

# Deploy Web to Vercel
cd apps/web
vercel deploy --prod
```

---

## 🏛️ Database Architecture

### PostgreSQL Schema
- **Venues** — Restaurant/business locations
- **Menus** — Digital menu definitions
- **Items** — Menu items with pricing
- **Orders** — Customer order records
- **Stations** — Kitchen/serving stations
- **Users** — Admin/staff accounts with roles
- **Sessions** — Active user sessions

### Prisma ORM
- Generates type-safe client
- Handles migrations
- Built-in query optimization
- Alpine Linux binary target for Docker

**Key Models**:
```typescript
model Venue { id, name, address, timezone, config... }
model Menu { id, venueId, name, items... }
model Order { id, venueId, items, status, createdAt... }
model User { id, email, role, venueId, password... }
```

---

## 📋 Development Workflow

### Code Style & Quality
- **Language**: TypeScript strict mode
- **Formatting**: Prettier (automatic)
- **Linting**: ESLint + @typescript-eslint
- **Testing**: Jest (unit & integration)
- **Pre-commit**: Format + lint validation

### Commit Convention
Use conventional commits:
```
feat: add new station management feature
fix: resolve JWT expiry validation bug
docs: update deployment instructions
refactor: simplify menu service logic
test: add unit tests for order calculations
chore: update dependencies
```

### Branch Strategy
- `main` — Production releases (protected)
- `dev` — Integration branch
- `feature/*` — Feature branches
- `bugfix/*` — Bug fix branches

All PRs require:
- ✅ CI/CD pipeline passing
- ✅ Code review approval
- ✅ TypeScript type checking
- ✅ Test coverage (minimum 80%)

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Automated)
- **On Push**: Lint, type-check, test all packages
- **On PR**: Run full test suite, preview deployments
- **On Merge to main**: Build, tag release, deploy to production

### Manual Deployment
```bash
# API (Cloud Run)
cd apps/api
./QUICK_DEPLOY.sh

# Web (Vercel)
cd apps/web
vercel deploy --prod
```

---

## 🧠 Behavioral Guidelines (Coding Best Practices)

### 1. Think Before Coding
- **State assumptions** explicitly — ask if unclear
- **Present trade-offs** for multiple approaches
- **Push back** on over-engineered solutions
- **Surface confusion** rather than proceeding blindly

### 2. Simplicity First
- **Minimum code** that solves the problem
- **No extra features** — only what's requested
- **No premature abstractions** — 3 similar lines is fine
- **No speculative flexibility** — build for today, not hypothetical future

### 3. Surgical Changes
- **Touch only what's necessary** — no adjacent cleanup
- **Match existing code style** strictly
- **Remove only your own orphans** (imports, variables, functions)
- **Every changed line traces to the user's request**

### 4. Goal-Driven Execution
Define success criteria and verify:
```
Task: "Add menu item validation"
Criteria:
  - Write tests for invalid inputs → test fails
  - Implement validation → test passes
  - No regressions in existing menu tests
```

---

## 🔗 Integration Points

### Cloud Run API
- **Region**: europe-west3 (Frankfurt)
- **Health Check**: `GET /api/health`
- **Endpoint**: `https://qr-order-api-572304365391.europe-west3.run.app`
- **Database**: PostgreSQL via pgbouncer

### Vercel Web Frontend
- **Region**: europe-west1 (default)
- **Domain**: Configure via Vercel dashboard
- **Environment**: Set via Vercel UI (NEXT_PUBLIC_API_URL, etc)
- **Builds**: Triggered on GitHub push

### Supabase PostgreSQL
- **Host**: db.supabase.co
- **Region**: Frankfurt
- **Connection**: pgbouncer pooling (6543)
- **Credentials**: Via environment variables

---

## 📚 Documentation References

- **[README.md](README.md)** — Project overview and features
- **[DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md)** — Step-by-step deployment checklist
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Technical decisions and rationale
- **[apps/api/DEPLOYMENT.md](apps/api/DEPLOYMENT.md)** — API-specific deployment
- **[apps/web/README.md](apps/web/README.md)** — Frontend documentation

---

## 🛠️ Useful Commands

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Development server | `pnpm dev` |
| Build all | `pnpm build` |
| Run tests | `pnpm test` |
| Format code | `pnpm format` |
| Lint | `pnpm lint` |
| Type check | `pnpm type-check` |
| DB migrations | `cd apps/api && npx prisma migrate dev` |
| DB studio | `cd apps/api && npx prisma studio` |
| Deploy API | `cd apps/api && ./QUICK_DEPLOY.sh` |
| Deploy Web | `cd apps/web && vercel deploy --prod` |

---

## 🤝 Getting Help

- **Claude Code**: Run `/help` for CLI assistance
- **GitHub Issues**: Report bugs and request features
- **Code Review**: Ask in PR comments for guidance
- **Documentation**: Check ARCHITECTURE.md for design decisions

---

## 📝 License

Proprietary — For internal use only.

---

**Last Updated**: 2026-05-17  
**Maintained by**: Mehmet ÇALIŞKAN
