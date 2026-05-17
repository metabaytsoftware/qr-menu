# ??? QR Menu - Restaurant Management System

Complete restaurant ordering and management system with QR codes for table ordering.

## ?? Project Structure

`
qr-menu/
+-- apps/
¦   +-- api/          # NestJS Backend (Cloud Run)
¦   +-- web/          # Next.js Frontend (Vercel)
+-- libs/             # Shared libraries
+-- package.json      # Workspace root
+-- pnpm-workspace.yaml
`

## ?? Live Deployments

- **API**: https://qr-order-api-572304365391.europe-west3.run.app
- **Web**: (Configure in Vercel)

## ??? Tech Stack

| Component | Technology |
|-----------|------------|
| API | NestJS + Prisma |
| Web | Next.js 16 + React 19 |
| Database | PostgreSQL (Supabase) |
| Hosting | Cloud Run + Vercel |
| Package Manager | pnpm |

## ?? Features

### API
- ? Order Management
- ? Table/Station Tracking
- ? Session Management
- ? Tariff Configuration
- ? Payment Processing
- ? Authentication (JWT)

### Web (Admin Dashboard)
- ? Station Management
- ? Order Tracking
- ? Menu Management
- ? Admin Panel

## ?? Quick Start

### Prerequisites
- Node.js 22+
- pnpm 10+
- PostgreSQL

### Installation

`ash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# API: http://localhost:8080
# Web: http://localhost:3003
`

### Environment Variables

#### API (.env)
`
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=development
PORT=8080
`

#### Web (.env)
`
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_BASE_URL=http://localhost:3003
`

## ?? Docker Deployment

`ash
# Build Docker image
docker build -t qr-order-api:latest -f apps/api/Dockerfile .

# Run container
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  qr-order-api:latest
`

## ?? Cloud Deployment

### API (Cloud Run)

Already deployed at: https://qr-order-api-572304365391.europe-west3.run.app

Deploy updates:
`ash
docker build -t gcr.io/qr-menu-496520/qr-order-api:latest -f apps/api/Dockerfile .
docker push gcr.io/qr-menu-496520/qr-order-api:latest
gcloud run deploy qr-order-api \
  --image=gcr.io/qr-menu-496520/qr-order-api:latest \
  --region=europe-west3 \
  --platform=managed
`

### Web (Vercel)

1. Connect this repo to Vercel
2. Set environment variables:
   - NEXT_PUBLIC_API_URL=https://qr-order-api-572304365391.europe-west3.run.app
3. Deploy (automatic on push)

## ?? Available Scripts

### Root
- \pnpm dev\ - Start all dev servers
- \pnpm build\ - Build all apps
- \pnpm lint\ - Lint all code
- \pnpm test\ - Run tests

### API (apps/api)
- \pnpm dev\ - Start NestJS dev server
- \pnpm build\ - Compile TypeScript
- \pnpm start\ - Start production server
- \prisma migrate dev\ - Create database migration
- \prisma studio\ - Open Prisma Studio

### Web (apps/web)
- \pnpm dev\ - Start Next.js dev server
- \pnpm build\ - Build for production
- \pnpm start\ - Start production server

## ?? Security

- JWT authentication on all API endpoints
- Database credentials in environment variables
- HTTPS enforced in production
- CORS configured

## ?? License

MIT
