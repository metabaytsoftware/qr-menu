# Architecture Decision Records (ADRs)

Significant architectural decisions for the **qr-menu** project.

---

## ADR-001: PWA Architecture (Serwist / next-pwa)

**Status**: Accepted
**Date**: 2026-05-01
**Participants**: Mehmet ÇALIŞKAN

### Decision

Implement Progressive Web App capabilities in the web frontend using `@ducanh2912/next-pwa` (Serwist-based) instead of a native mobile app.

### Rationale

1. **Cross-platform**: Works on iOS, Android, Desktop — single codebase.
2. **Zero App Store friction**: Distributed instantly via QR code or URL.
3. **Offline support**: Cache-first strategy for menu pages; critical for venues with poor Wi-Fi.
4. **Next.js integration**: `next-pwa` wraps `NextConfig`, service worker generated automatically at build.
5. **Installable**: `manifest.json` enables "Add to Home Screen" on all major browsers.

### Implications

- `public/sw.js` and `public/workbox-*.js` are generated at build — must be gitignored.
- Service worker is disabled in development to avoid hot-reload conflicts.

### Alternatives Considered

- **React Native**: Rejected — App Store approval overhead, separate codebase.
- **Capacitor.js**: Rejected — native bridge complexity without sufficient benefit.

---

## ADR-002: Authentication via Cloudflare Access (No self-managed JWT)

**Status**: Accepted
**Date**: 2026-05-17
**Participants**: Mehmet ÇALIŞKAN

### Decision

Admin panel authentication is fully delegated to Cloudflare Access. The API does not issue or validate JWT tokens for admin routes. All admin traffic passes through Cloudflare's zero-trust network; the `cf-access-authenticated-user-email` header is trusted on the API side.

### Rationale

1. **Operational simplicity**: No token rotation, no refresh token storage, no session management code.
2. **Security posture**: Cloudflare handles MFA, IP allowlisting, and identity provider integration.
3. **Maintenance burden**: Eliminated ~600 lines of auth-api library code from the runtime.
4. **Origin protection**: Cloud Run service is restricted to Cloudflare egress IPs — unauthenticated direct access is blocked at the network level.

### Implications

- `@meta-repo/auth-api` (JwtAuthGuard, JwtStrategy, etc.) is a build-time dependency only — no runtime guards on admin endpoints.
- API endpoints are public at the HTTP level; protection comes from Cloudflare Access sitting in front.
- If Cloudflare misconfiguration exposes the Cloud Run URL directly, all endpoints are open. The Cloud Run service must have ingress restricted to Cloudflare IPs.
- `GET /api/auth/cloudflare-user` is used by the frontend to reflect the authenticated user's email/name from Cloudflare headers.

### Alternatives Considered

- **Self-managed JWT**: Rejected — adds secret rotation, refresh token DB table, and auth-api maintenance with no UX benefit since there's a single-tenant admin panel.
- **Google IAP (Identity-Aware Proxy)**: Considered as fallback — viable if Cloudflare is dropped, requires no code changes.

---

## ADR-003: Single-Tenant Venue Model

**Status**: Accepted
**Date**: 2026-05-17
**Participants**: Mehmet ÇALIŞKAN

### Decision

The system is designed for a single venue per deployment. The `venueId` is a fixed value (`night-city-gaming`) resolved at startup from `GET /api/venues`. There is no multi-tenant routing, venue switcher, or per-user venue isolation in the admin panel.

### Rationale

1. **Scope**: Product is deployed per-venue — each customer gets their own Cloud Run + Vercel instance.
2. **Simplicity**: No tenant isolation logic, no row-level security, no venue scoping middleware.
3. **Performance**: All DB queries include `venueId` as a filter but there's only one, so indexes are trivially selective.

### Implications

- `venueId` must be seeded into the database before any other data can be created.
- Admin frontend fetches the venueId dynamically from `GET /api/venues` on first load and caches it in `localStorage`.
- Multi-tenant support would require significant rework of both the API and frontend routing.

---

## ADR-004: Analytics via Prisma Aggregation (No OLAP)

**Status**: Accepted
**Date**: 2026-05-01
**Participants**: Mehmet ÇALIŞKAN

### Decision

Serve all analytics from the `AnalyticsModule` using Prisma's `groupBy`, `aggregate`, and relational queries directly against PostgreSQL. No separate analytics store.

### Rationale

1. **Simplicity**: No ETL pipeline, no secondary DB, no sync lag.
2. **Real-time**: Data is always current.
3. **Sufficient at scale**: Current order/session volume doesn't justify ClickHouse or TimescaleDB overhead.

### Implications

- Analytics queries must use indexed columns: `venueId`, `createdAt`, `status`.
- If daily order volume exceeds ~100K, introduce Redis TTL caching on summary endpoints.

### Alternatives Considered

- **ClickHouse / TimescaleDB**: Rejected — overkill for MVP.
- **Materialized views**: Rejected — require manual refresh, add operational complexity.

---

## ADR-005: API Deployment on Cloud Run, Web on Vercel

**Status**: Accepted
**Date**: 2026-05-17
**Participants**: Mehmet ÇALIŞKAN

### Decision

- **API** (`apps/api`): Google Cloud Run, `europe-west3` (Frankfurt). Container-based, scales to zero.
- **Web** (`apps/web`): Vercel, `europe-west1`. Serverless Next.js.
- **Database**: Supabase PostgreSQL, Frankfurt region.
- **CI/CD**: GitHub Actions (Workload Identity Federation) for Cloud Run; Vercel GitHub integration for web.

### Rationale

1. **Latency**: All three components co-located in EU Central/West — sub-10ms DB round trips.
2. **Cost**: Cloud Run scales to zero; Vercel free tier covers current traffic.
3. **Operational simplicity**: No Kubernetes, no cluster management.
4. **Security**: Cloud Run ingress restricted to Cloudflare; WIF eliminates long-lived GCP service account keys in CI.

### Implications

- Cloud Run cold starts (~1-2s) are acceptable for an admin panel; customer-facing menu is served by Vercel edge with no cold start.
- Cloud Run min-instances is set to 1 to avoid cold starts during active hours.
- Secrets are stored in GCP Secret Manager and injected at container startup.

---

## Template for New ADRs

```markdown
## ADR-XXX: [Title]

**Status**: Proposed | Accepted | Deprecated
**Date**: YYYY-MM-DD
**Participants**: [Names]

### Decision

[What was decided?]

### Rationale

1. [Reason]

### Implications

- [Impact]

### Alternatives Considered

- [Alternative]: Why rejected
```
