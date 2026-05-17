# Production Configuration Summary
**Status**: Ready for Final Deployment  
**Target Domain**: qr-menu.fx8.io  
**Deployment Date**: May 17, 2026

---

## 📦 Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    qr-menu.fx8.io (Vercel)                 │
│              ↓ NEXT_PUBLIC_API_URL                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Next.js App (apps/web)                                 │ │
│  │ • Frontend UI                                          │ │
│  │ • API Proxy: /api/* → Cloud Run                        │ │
│  │ • PWA Support                                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Environment Variables:                                    │
│  • NEXT_PUBLIC_BASE_URL=https://qr-menu.fx8.io           │
│  • NEXT_PUBLIC_API_URL=https://api.qr-menu.fx8.io        │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────────┐
        │   Cloud Run (EU Region)                 │
        │   qr-order-api service                  │
        │                                         │
        │  ┌─────────────────────────────────┐   │
        │  │ NestJS API (apps/api)           │   │
        │  │ • REST endpoints                │   │
        │  │ • JWT Authentication            │   │
        │  │ • Business Logic                │   │
        │  └─────────────────────────────────┘   │
        │                                         │
        │  Environment Variables:                 │
        │  • NODE_ENV=production                 │
        │  • PORT=8080                           │
        │  • LOG_LEVEL=info                      │
        │  • CORS_ORIGIN=https://qr-menu.fx8.io │
        │  • JWT_SECRET=(secure)                 │
        │  • REDIS_URL=(Upstash)                 │
        └─────────────────────────────────────────┘
                   ↓              ↓
        ┌──────────────────┐  ┌──────────────────┐
        │   Supabase       │  │   Upstash Redis  │
        │   PostgreSQL     │  │   Cache Layer    │
        │                  │  │                  │
        │ • Database       │  │ • Session Store  │
        │ • Storage        │  │ • Rate Limiting  │
        │ • Backups        │  │ • Cache Keys     │
        └──────────────────┘  └──────────────────┘
```

---

## 🗂️ Files Updated/Created

### 1. **apps/api/.env** (Updated)
```
✅ NODE_ENV=production
✅ PORT=8080 (Cloud Run standard)
✅ LOG_LEVEL=info
✅ JWT_SECRET=<to be set in Cloud Run>
✅ REDIS_URL=<Upstash credentials>
✅ CORS_ORIGIN=https://qr-menu.fx8.io
✅ DATABASE_URL=<Supabase pooled>
✅ DIRECT_URL=<Supabase direct>
```

### 2. **apps/web/.env** (Updated)
```
✅ NEXT_PUBLIC_BASE_URL=https://qr-menu.fx8.io
✅ NEXT_PUBLIC_API_URL=https://api.qr-menu.fx8.io
```

### 3. **apps/web/vercel.json** (Updated)
```
✅ Framework: nextjs
✅ Build command: next build
✅ Domains: ["qr-menu.fx8.io"]
✅ API proxy headers configured
```

### 4. **.env.production** (Created)
Reference file for production variables (do not commit secrets)

### 5. **PRODUCTION_SETUP.md** (Created)
Complete production deployment guide with:
- Vercel configuration steps
- Cloud Run setup
- Domain configuration
- Security checklist
- Monitoring setup

### 6. **VERCEL_DEPLOYMENT.md** (Created)
Step-by-step Vercel deployment guide in Turkish:
- GitHub integration
- Environment variables
- Domain binding
- SSL/TLS setup
- Troubleshooting

---

## 🔑 Required Environment Variables

### For Cloud Run (Backend)
```bash
# Critical - Must be set before deployment
NODE_ENV=production
PORT=8080
JWT_SECRET=<generate: openssl rand -hex 32>
REFRESH_TOKEN_SECRET=<generate: openssl rand -hex 32>
REDIS_URL=<from Upstash console>
CORS_ORIGIN=https://qr-menu.fx8.io

# Already configured
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### For Vercel (Frontend)
```
NEXT_PUBLIC_BASE_URL=https://qr-menu.fx8.io
NEXT_PUBLIC_API_URL=https://api.qr-menu.fx8.io
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All code committed to main branch
- [ ] TypeScript compilation: `pnpm tsc`
- [ ] Local build test: `pnpm build`
- [ ] API running on Cloud Run
- [ ] Database accessible from Cloud Run
- [ ] Redis (Upstash) credentials ready
- [ ] JWT secrets generated and secured
- [ ] Domain qr-menu.fx8.io registered

### Vercel Deployment
- [ ] GitHub repo connected to Vercel
- [ ] Root directory set to `apps/web`
- [ ] Environment variables added
- [ ] Initial deployment successful
- [ ] Domain CNAME configured
- [ ] DNS records propagated (5-30 min)
- [ ] SSL certificate active

### Cloud Run Deployment
- [ ] Docker image built and tested
- [ ] Service deployed with production config
- [ ] Environment variables set (including secrets)
- [ ] Health check endpoint responding
- [ ] CORS configured for production domain
- [ ] Logs accessible and monitored

### Post-Deployment
- [ ] Frontend accessible at https://qr-menu.fx8.io
- [ ] API responds without CORS errors
- [ ] Full user flow tested (view menu → order → success)
- [ ] Error pages displaying correctly
- [ ] Performance metrics baseline established
- [ ] Monitoring and alerting configured

---

## 🚀 Deployment Steps (In Order)

### Step 1: Configure Cloud Run (Already Done ✅)
```bash
# Your API is already running on Cloud Run
# Just verify environment variables are set
```

### Step 2: Connect Vercel to GitHub (Next)
1. Go to vercel.com
2. Import GitHub repo
3. Set root directory to `apps/web`
4. Deploy

### Step 3: Bind Domain (After Vercel Deployment)
1. Add domain in Vercel Settings
2. Add DNS CNAME records to registrar
3. Wait for DNS propagation
4. Verify SSL certificate

### Step 4: Final Testing (All Services)
1. Visit https://qr-menu.fx8.io
2. Test full workflow
3. Check browser console for errors
4. Monitor Cloud Run logs

---

## 🔐 Security Configuration

| Aspect | Status | Notes |
|--------|--------|-------|
| HTTPS/TLS | ✅ Automatic (Let's Encrypt) | Vercel manages certificates |
| CORS | ✅ Configured | Only qr-menu.fx8.io allowed |
| JWT Secrets | ⏳ Pending | Set in Cloud Run before deployment |
| Database Creds | ✅ Secure | Stored as Cloud Run secrets |
| Environment Vars | ✅ Protected | No secrets in git, use Vercel secrets |
| Rate Limiting | 🔄 Recommended | Consider Upstash rate limiting |
| Logging | ✅ Configured | INFO level in production |

---

## 📊 Performance Expectations

After deployment, monitor:

| Metric | Target | How to Check |
|--------|--------|-------------|
| Initial Load | < 2s | Vercel Analytics |
| API Response | < 500ms | Network tab (F12) |
| Time to Interactive | < 3s | Google PageSpeed |
| Core Web Vitals | Green | PageSpeed Insights |
| Uptime | 99%+ | Vercel dashboard |

---

## 🧪 Testing URLs

After deployment:

**Frontend**
- Production: https://qr-menu.fx8.io
- Vercel Preview: Will be generated for PRs

**API (If custom domain used)**
- Cloud Run: https://qr-order-api-xxxxx.a.run.app/api/health
- Through Frontend: https://qr-menu.fx8.io/api/health

**Logs**
- Cloud Run: `gcloud run logs read qr-order-api --region=europe-west1`
- Vercel: Vercel Dashboard → Deployments → Logs

---

## 📋 Next Steps

1. **Immediate** (within 1 hour)
   - [ ] Review this document
   - [ ] Verify all credentials
   - [ ] Generate JWT secrets

2. **Deploy Vercel** (next 30 minutes)
   - [ ] Connect GitHub
   - [ ] Set environment variables
   - [ ] Deploy

3. **Configure Domain** (next 2-4 hours)
   - [ ] Add DNS records
   - [ ] Wait for propagation
   - [ ] Verify SSL

4. **Final Testing** (1 hour)
   - [ ] Full workflow test
   - [ ] Performance check
   - [ ] Error log review

5. **Go Live** 🎉
   - [ ] Monitor for 24 hours
   - [ ] Watch error logs
   - [ ] Be ready to scale

---

## 🔗 Important Links

| Service | URL | Purpose |
|---------|-----|---------|
| Vercel Dashboard | https://vercel.com/dashboard | Manage deployments |
| Cloud Run Console | https://console.cloud.google.com/run | Manage API |
| Supabase Dashboard | https://app.supabase.com | Manage database |
| Upstash Console | https://console.upstash.com | Manage Redis |
| Domain Registrar | [Your registrar] | Manage DNS |

---

## 📞 Support Contacts

- **Vercel Help**: https://vercel.com/help
- **Next.js Docs**: https://nextjs.org/docs
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **GitHub Support**: https://support.github.com

---

**Configuration Status**: ✅ COMPLETE
**Ready to Deploy**: YES
**Last Updated**: May 17, 2026, 13:30 UTC
