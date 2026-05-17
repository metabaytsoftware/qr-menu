# qr-menu Architecture & Technical Decisions

This document records key architectural decisions, trade-offs, and their rationale.

---

## 🏛️ System Architecture

### Monorepo Structure (pnpm workspaces)

**Decision**: Use pnpm monorepo with separate `apps/` and `libs/` directories.

**Rationale**:
- Single source of truth for types, utilities, and shared logic
- Atomic commits across API, web, and libraries
- Simplified dependency management (all versions synchronized)
- Optimized deployments (each app only bundles what it uses)

**Trade-off**:
- ✅ Shared code, coordinated changes
- ❌ Larger repository, longer clone times
- ❌ CI/CD runs all tests on any change (mitigated with Turbo caching)

**Alternative Considered**: Separate repositories
- Would need separate npm packages for shared code
- Complex versioning and release coordination
- Rejected: monorepo provides better DX for a small team

---

## 🔌 Frontend Architecture

### Next.js 16 + React 19

**Decision**: Use Next.js with App Router (not Pages Router).

**Rationale**:
- Server Components reduce JavaScript shipped to client
- Integrated API routes (reverse proxy to backend)
- Built-in image optimization, font loading
- PWA support via `next-pwa` package
- Vercel deployment is zero-config

**Trade-off**:
- ✅ Fast perceived performance, good Core Web Vitals
- ❌ Smaller ecosystem than traditional React SPAs
- ❌ Server Component paradigm requires learning curve

**Alternative Considered**: Vite + React SPA
- Faster dev server startup
- More control over build config
- Rejected: PWA needs + serverless deployment favor Next.js

### API Proxy via next.config.ts

**Decision**: Reverse proxy API requests via Next.js rewrites.

```typescript
rewrites: async () => ({
  source: "/api/:path*",
  destination: `${apiUrl}/api/:path*"
})
```

**Rationale**:
- Avoids CORS issues in development
- Same-origin calls in production
- API URL configurable via environment variable
- Transparent to frontend code

**Trade-off**:
- ✅ Simple CORS handling
- ❌ Adds latency (though negligible for Frankfurt region)
- ❌ Must handle API errors in Next.js layer

---

## 🎯 Backend Architecture

### NestJS with Modular Structure

**Decision**: Use NestJS with feature-based modules.

**Rationale**:
- Enterprise-grade framework with built-in dependency injection
- Strong TypeScript support and decorators
- Module system enables clear separation of concerns
- Ecosystem of useful packages (@nestjs/jwt, @nestjs/passport, etc)

**Structure**:
```
src/
├── modules/           # Feature modules
│   ├── menu/         # Menu CRUD & querying
│   ├── orders/       # Order management
│   ├── auth/         # JWT, roles, guards
│   └── venues/       # Venue configuration
├── common/           # Shared utilities
│   ├── decorators/   # Custom @Decorators
│   ├── guards/       # JWT, role-based auth
│   ├── filters/      # Global exception handling
│   └── interceptors/ # Logging, request tracking
└── app.module.ts     # Root module
```

**Trade-off**:
- ✅ Scalable, testable architecture
- ❌ Boilerplate code required
- ❌ Steeper learning curve vs Express.js

---

## 💾 Database Architecture

### PostgreSQL + Prisma ORM

**Decision**: PostgreSQL with Prisma ORM for type safety.

**Rationale**:
- PostgreSQL: industry-standard, JSONB support, strong consistency
- Prisma: generates type-safe client from schema, handles migrations
- Supabase: managed PostgreSQL with pgbouncer pooling
- Alpine Linux binary target for Docker reduces image size

**Schema Design**:
```sql
-- Core entities
Venue (id, name, address, timezone, config_json)
Menu (id, venueId, name, isActive)
MenuItem (id, menuId, name, price, category)

-- Order management
Order (id, venueId, items_json, status, createdAt)
OrderItem (id, orderId, menuItemId, quantity)

-- Access control
User (id, email, role: enum(ADMIN|MANAGER|STAFF), venueId, passwordHash)
Session (id, userId, token, expiresAt)

-- Station management
Station (id, venueId, name, type)
StationConfig (id, stationId, categories_json)
```

**Trade-off**:
- ✅ Type-safe queries, strong consistency
- ✅ Easy migrations and schema versioning
- ❌ Requires running migrations on deploy
- ❌ Not suitable for unstructured data (use JSONB for flexible fields)

### Connection Pooling (pgbouncer)

**Decision**: Use pgbouncer connection pooling via Supabase.

**Rationale**:
- Cloud Run instances are ephemeral; connection limit: ~100/DB
- pgbouncer pools connections, handles concurrent requests
- Supabase provides pgbouncer by default (port 6543)
- Reduces connection overhead during cold starts

**Configuration**:
```
DATABASE_URL=postgresql://user:pass@db.supabase.co:6543/postgres
```

**Trade-off**:
- ✅ Efficient resource usage
- ❌ Requires awareness of pool limits in application
- ❌ Connection reuse can cause subtle session state issues (use session mode)

---

## 🔐 Authentication & Authorization

### JWT + Role-Based Access Control (RBAC)

**Decision**: JWT tokens in HttpOnly cookies with role-based guards.

**Rationale**:
- Stateless: scales to multiple API instances
- HttpOnly cookies: CSRF protection, no XSS exposure
- Role-based: supports ADMIN, MANAGER, STAFF tiers
- Guards: enforce permissions at route level

**Flow**:
```
1. POST /auth/login { email, password }
   → Validate credentials
   → Generate JWT (24h expiry)
   → Set HttpOnly cookie
   → Return user + permissions

2. GET /api/orders (authenticated)
   → Guard extracts JWT from cookie
   → Validates signature & expiry
   → Attaches user to request
   → Proceeds to handler

3. @Roles('MANAGER', 'ADMIN')  # Decorator on handler
   → Guard checks user.role
   → Rejects if unauthorized
```

**Trade-off**:
- ✅ Secure (CSRF-protected HttpOnly cookies)
- ✅ Scales without server sessions
- ❌ Token revocation requires blacklist (add if needed)
- ❌ Cookie-based limits SPA patterns (acceptable for admin panel)

**Alternative Considered**: Bearer tokens in Authorization header
- More RESTful, SPA-friendly
- Rejected: XSS risk without careful handling; cookies safer for admin panel

---

## 🚀 Deployment Architecture

### Cloud Run for API (Serverless)

**Decision**: Google Cloud Run (europe-west3 Frankfurt region).

**Rationale**:
- Fully managed serverless container platform
- Auto-scaling: 0 → N instances based on traffic
- Pay-per-request pricing (cost-efficient)
- Frankfurt region: optimal for European users
- Integrates with Cloud Build for CI/CD

**Configuration**:
```yaml
# service.yaml
kind: Service
metadata:
  name: qr-order-api
spec:
  template:
    spec:
      containers:
      - image: europe-west3-docker.pkg.dev/PROJECT/api:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: value
```

**Trade-off**:
- ✅ Scales automatically, no server management
- ✅ Cost-efficient (pay only for running time)
- ❌ Cold starts (~5s first request)
- ❌ Vendor lock-in (Google Cloud)
- ❌ 60-min timeout limit (okay for API, not batch jobs)

**Cold Start Mitigation**:
- Use lightweight Alpine Linux image (~100MB vs 300MB+)
- Prisma Client: minimize dependencies
- Consider Cloud Run's native concurrency setting (default 80 per instance)

**Alternative Considered**: Kubernetes (GKE)
- More control, better for long-running processes
- Rejected: overkill for current scale; Cloud Run simpler

### Vercel for Web Frontend

**Decision**: Vercel for Next.js hosting.

**Rationale**:
- Next.js-native platform, zero-config deployment
- GitHub integration: auto-deploy on push
- Built-in CDN, analytics, edge functions
- Automatic HTTPS, SSL certificates
- Preview deployments on PR branches

**Configuration**:
```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Trade-off**:
- ✅ Easiest Next.js deployment
- ✅ GitHub integration out-of-box
- ❌ Vendor lock-in (Vercel)
- ❌ Limited control over infrastructure
- ❌ EU data residency not guaranteed

**Alternative Considered**: Self-hosted (Docker on Cloud Run)
- More control, simpler infrastructure
- Would still use Cloud Run, just own the container
- Rejected: Vercel provides better DX, GitHub integration is seamless

### Database: Supabase PostgreSQL

**Decision**: Supabase managed PostgreSQL (Frankfurt region).

**Rationale**:
- Fully managed: automated backups, patching, monitoring
- pgbouncer pooling included
- Supabase dashboard for schema, data management
- Integrates with Prisma migrations
- Cost-effective (~$25/mo for starter)

**Trade-off**:
- ✅ Hands-off operation
- ✅ Automatic backups
- ❌ Vendor lock-in
- ❌ Less control over performance tuning
- ❌ Data stored with Supabase infrastructure

**Alternative Considered**: Google Cloud SQL
- Native GCP integration
- Rejected: Supabase provides same features, better Prisma integration

---

## 📊 Monitoring & Observability

### Logging Strategy

**Decision**: Structured logging to stdout (Cloud Run native).

**Rationale**:
- Cloud Run captures stdout → Cloud Logging
- Structured JSON logs enable filtering/searching
- No extra monitoring service needed

**Implementation**:
```typescript
// Use NestJS logger with JSON formatting
import { Logger } from '@nestjs/common';

const logger = new Logger('MenuService');
logger.log(`Menu created: ${menuId}`, { venueId, userId });
```

**Trade-off**:
- ✅ Zero infrastructure
- ❌ Limited querying capabilities
- ❌ No performance profiling

**Future**: Add APM (Datadog, New Relic) if performance becomes critical.

### Error Handling

**Decision**: Global exception filter with structured responses.

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: HttpArgumentsHost) {
    const response = host.getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;
    
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Jest)

**Decision**: Jest for unit tests, minimum 80% coverage.

**Placement**: `src/**/*.spec.ts` files alongside implementation.

**Rationale**:
- Jest: fast, built-in mocking, coverage reporting
- Colocated: easier to find and maintain tests
- 80% coverage: catches most bugs without excessive overhead

### Integration Tests

**Decision**: Test database interactions with real PostgreSQL (Docker).

**Setup**:
```bash
# Docker Compose spins up test database
docker compose -f docker-compose.test.yml up
npm run test:integration
```

**Rationale**:
- Real DB interactions: catches Prisma/SQL bugs
- Isolated database per test run
- CI runs integration tests on each PR

---

## 🔄 Versioning & Releases

### Semantic Versioning

**Decision**: Follow semver for API and packages.

**Format**: `MAJOR.MINOR.PATCH`

**Bump rules**:
- `MAJOR` (1.0.0 → 2.0.0): Breaking API changes
- `MINOR` (1.0.0 → 1.1.0): New features (backward compatible)
- `PATCH` (1.0.0 → 1.0.1): Bug fixes

**Release Process**:
```bash
# Tag commit
git tag v1.2.3
git push origin v1.2.3

# GitHub Actions triggers deployment
```

---

## 🔮 Future Considerations

### When to Refactor
- If adding a feature requires >50 lines in a single file
- If test coverage drops below 75%
- If a module is >500 lines

### When to Add Abstractions
- When same pattern appears in ≥3 places
- When complexity hides business logic
- Not before—minimum viable abstractions only

### Scaling Plans
- **User load**: Add caching (Redis) if needed
- **Data volume**: Implement database indexing, query optimization
- **API complexity**: Consider GraphQL if REST becomes unwieldy
- **Multi-region**: Add replica databases, edge functions

---

## 📋 Decision Record (ADR)

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-04-21 | NestJS + Prisma | Type safety + DX | ✅ Active |
| 2026-04-21 | Next.js App Router | SSR + PWA support | ✅ Active |
| 2026-04-25 | Cloud Run (europe-west3) | Regional latency + cost | ✅ Active |
| 2026-05-10 | Vercel for web | GitHub integration + DX | ✅ Active |
| 2026-05-15 | Supabase PostgreSQL | Managed + Prisma integration | ✅ Active |

---

**Last Updated**: 2026-05-17  
**Last Reviewed**: 2026-05-17
