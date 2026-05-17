# QR Menu - Production Setup Guide (qr-menu.fx8.io)

## 📋 Production Deployment Checklist

### ✅ Completed Services
- [x] **Supabase** - Database (PostgreSQL) & Storage
- [x] **Upstash** - Redis Cache
- [x] **Google Cloud Run** - API Backend
- [ ] **Vercel** - Frontend (Next.js)
- [ ] **Domain Setup** - qr-menu.fx8.io

---

## 🔧 Vercel Configuration (Web Frontend)

### Step 1: Connect GitHub to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import the GitHub repository: `qr-menu-repo`
4. Set **Root Directory** to: `apps/web`
5. Click "Deploy"

### Step 2: Environment Variables (Vercel Settings)
After initial deployment, add these to Vercel Environment Variables:

**Production Environment:**
```
NEXT_PUBLIC_BASE_URL=https://qr-menu.fx8.io
NEXT_PUBLIC_API_URL=https://api.qr-menu.fx8.io
```

**If using Supabase Storage for images (optional):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Connect Custom Domain
1. In Vercel Project Settings → "Domains"
2. Add domain: `qr-menu.fx8.io`
3. Vercel will provide DNS records (CNAME + TXT)
4. Update your domain registrar's DNS settings:
   ```
   CNAME: cname.vercel-dns.com
   TXT: vc-domain-verify=qr-menu.fx8.io
   ```
5. Wait for DNS propagation (5-30 minutes)

### Step 4: Enable SSL/TLS
- Vercel automatically provides free SSL certificates via Let's Encrypt
- Check "SSL/TLS" is set to "Automatic"

---

## 🔌 Cloud Run API Configuration

### Current Setup
- **Service Name**: `qr-order-api`
- **Port**: 8080 (Cloud Run standard)
- **Region**: Europe (eu-central-1 for low latency)
- **Authentication**: Allow unauthenticated invocations (public API)

### Required Environment Variables in Cloud Run
Update your Cloud Run service with these secrets/variables:

```bash
gcloud run services update qr-order-api \
  --set-env-vars \
    NODE_ENV=production,\
    LOG_LEVEL=info,\
    PORT=8080,\
    JWT_SECRET=<your-secure-jwt-secret>,\
    REFRESH_TOKEN_SECRET=<your-secure-refresh-token>,\
    REDIS_URL=<upstash-redis-url>,\
    CORS_ORIGIN=https://qr-menu.fx8.io \
  --update-secrets \
    DATABASE_URL=projects/PROJECT_ID/secrets/database-url/versions/latest,\
    DIRECT_URL=projects/PROJECT_ID/secrets/direct-url/versions/latest
```

### Get Your Cloud Run URL
```bash
gcloud run services describe qr-order-api --region=europe-west1
```
The service URL will be: `https://qr-order-api-xxxxxx.a.run.app`

---

## 🌐 Custom Domain Setup for API

If you want `api.qr-menu.fx8.io` to point to Cloud Run:

### Option 1: Using Cloud Run Custom Domains
1. Go to Cloud Run → qr-order-api → Manage Custom Domains
2. Set domain: `api.qr-menu.fx8.io`
3. Add DNS CNAME: `goog-managed-ssl.api.qr-menu.fx8.io`

### Option 2: Using Vercel Proxy (Easier)
In `apps/web/next.config.ts`:
```typescript
rewrites: async () => ({
  source: '/api/:path*',
  destination: 'https://qr-order-api-xxxxxx.a.run.app/api/:path*'
})
```

Then update `NEXT_PUBLIC_API_URL` to:
```
NEXT_PUBLIC_API_URL=https://qr-menu.fx8.io
```

This proxies all `/api/` requests through Next.js to Cloud Run, avoiding CORS issues.

---

## 🔐 Security Checklist

### JWT Secrets
- [ ] Generate secure JWT_SECRET (min 32 chars, use `openssl rand -hex 32`)
- [ ] Store in Vercel Secrets → Reference in Cloud Run
- [ ] Rotate secrets quarterly
- [ ] Never commit secrets to Git

### Database Connection
- [ ] Use `DATABASE_URL` in production (pooled connection)
- [ ] Use `DIRECT_URL` only for migrations
- [ ] Enable Supabase network restrictions if possible
- [ ] Regular backups enabled in Supabase

### CORS Configuration
- [ ] API CORS_ORIGIN set to production domain only
- [ ] Test CORS with curl before going live

### Rate Limiting (Recommended)
Add rate limiting to Cloud Run API using:
- Upstash Redis + rate-limit middleware
- Or Google Cloud Armor policies

---

## 📊 Monitoring & Logging

### Cloud Run Logs
```bash
gcloud run logs read qr-order-api --region=europe-west1 --limit=100
```

### Vercel Analytics
- Dashboard: https://vercel.com/dashboard
- Real-time insights: Vercel Analytics Pro
- Error tracking: Vercel Error tracking or Sentry

### Optional: Sentry Integration
1. Create Sentry projects for API and Web
2. Add to Cloud Run env: `SENTRY_DSN=...`
3. Add to Vercel env: `NEXT_PUBLIC_SENTRY_DSN=...`

---

## 🚀 Deployment Order

### Phase 1: Prepare
1. Test locally with production env vars
2. Build & test Docker image for Cloud Run
3. Ensure all Database migrations are applied

### Phase 2: Deploy Backend
1. Update Cloud Run service with new image
2. Verify health check: `GET /health`
3. Test API endpoints manually

### Phase 3: Deploy Frontend
1. Deploy to Vercel (automatic from main branch)
2. Verify API connectivity
3. Test full user flow (menu → order → success)

### Phase 4: DNS & Domain
1. Configure DNS records for qr-menu.fx8.io
2. Wait for DNS propagation
3. Verify SSL certificate is active

---

## 🧪 Testing Checklist

- [ ] Frontend loads at https://qr-menu.fx8.io
- [ ] API responds at https://api.qr-menu.fx8.io (or proxied)
- [ ] CORS requests work without errors
- [ ] Menu items load correctly
- [ ] Order placement succeeds
- [ ] Image uploads work (if using Supabase Storage)
- [ ] Redis caching is active (verify with metrics)
- [ ] SSL certificate is valid (check browser)

---

## 🔗 Useful Commands

### Vercel Deployment
```bash
# Deploy manually (if not using GitHub)
npm i -g vercel
vercel --prod --cwd apps/web

# View deployment logs
vercel logs --prod
```

### Cloud Run Status
```bash
# List services
gcloud run services list --region=europe-west1

# View service details
gcloud run services describe qr-order-api --region=europe-west1

# Stream logs
gcloud run logs read qr-order-api --region=europe-west1 --follow
```

### Database
```bash
# Check Prisma migrations
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

---

## 📞 Support & Troubleshooting

### Common Issues

**CORS Errors**
- Check `CORS_ORIGIN` env var in Cloud Run
- Verify Vercel proxy is configured correctly
- Check browser console for actual error

**DNS Not Resolving**
- Wait 5-30 minutes for propagation
- Use: `nslookup qr-menu.fx8.io`
- Verify CNAME records in registrar

**Cold Start Issues**
- Cloud Run cold starts are 1-2 seconds (acceptable)
- For faster response: Set Min Instances to 1 (costs ~$15/month)
- Or: Use scheduled health checks to keep warm

**Database Connection Issues**
- Verify DATABASE_URL is correct
- Check Supabase network permissions
- Test with: `psql $DATABASE_URL -c "SELECT 1"`

---

## 📅 Maintenance Schedule

- **Daily**: Monitor error logs in Vercel & Cloud Run
- **Weekly**: Check performance metrics
- **Monthly**: Review security logs, update dependencies
- **Quarterly**: Rotate JWT secrets, review access controls
- **Yearly**: Review architecture, plan upgrades

---

**Last Updated**: May 17, 2026
**Status**: Ready for Vercel Deployment
