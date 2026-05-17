# Vercel Deployment Guide - qr-menu.fx8.io

## 🎯 Overview
Bu rehber, Next.js web uygulamasını Vercel'de qr-menu.fx8.io domain'i ile nasıl yayınlayacağınızı adım adım anlatır.

**Deployment Time**: ~5-10 dakika (DNS propagation hariç)

---

## ✅ Pre-Deployment Checklist

- [ ] GitHub repository'de erişim izni
- [ ] Cloud Run API service'in çalışmakta olduğunu doğrula
- [ ] Cloud Run URL'ini al (örn: `https://qr-order-api-xxxxx.a.run.app`)
- [ ] Supabase database'in aktif olduğunu kontrol et
- [ ] Redis (Upstash) bağlantısını test et
- [ ] JWT secrets hazırla (32+ karakter)

---

## 📱 Step 1: Vercel Dashboard'a Giriş

1. https://vercel.com adresine git
2. GitHub hesabınız ile giriş yap (veya sign up)
3. "Add New..." → "Project" tıkla

![Vercel Dashboard](https://vercel.com/_next/image?url=%2Fapi%2Fscreenshot%2F...)

---

## 🔗 Step 2: GitHub Repository'i Bağla

1. "Import Project" tıkla
2. "Import from Git Repository" seç
3. Repository'yi bul: `qr-menu-repo`
4. Seç ve "Continue" tıkla

**Eğer repo liste'de yoksa:**
- "Configure GitHub App" tıkla
- Repository'e erişim izni ver
- Geri dön ve repo'yu seç

---

## ⚙️ Step 3: Proje Ayarlarını Yapılandır

### Project Name
```
qr-menu (otomatik olacak)
```

### Root Directory
Bu çok önemli! **`apps/web` seç** (monorepo yapısında)

1. "Root Directory" yazan yere tıkla
2. `apps/web` seç
3. Vercel otomatik olarak Next.js framework'ü algılayacak

### Build Settings
```
Build Command:     next build
Output Directory:  .next
Install Command:   pnpm install
```

---

## 🔐 Step 4: Environment Variables Ekle

Deployment öncesi environment variables'ı ayarla:

1. "Environment Variables" bölümüne git
2. Şu variables'ları ekle:

### Development ve Preview için:
```
NEXT_PUBLIC_BASE_URL   = http://localhost:3003  (dev)
NEXT_PUBLIC_API_URL    = http://localhost:3002  (dev)
```

### Production için (bu step'te opsiyonel, sonra da ekleyebilirsin):
```
NEXT_PUBLIC_BASE_URL   = https://qr-menu.fx8.io
NEXT_PUBLIC_API_URL    = https://qr-order-api-xxxxx.a.run.app
```

**Not:** `NEXT_PUBLIC_` prefix'i olan variables, frontend'te kullanılabilir (browser'da görünür).

---

## 🚀 Step 5: Deploy Butonuna Bas

1. Tüm ayarları kontrol et
2. "Deploy" butonuna tıkla
3. Vercel deployment'ı başlatacak (2-3 dakika)

Vercel otomatik olarak:
- ✅ Repo'yu clone eder
- ✅ Dependencies install eder (`pnpm install`)
- ✅ Uygulamayı build eder (`next build`)
- ✅ Production'da çalıştırır

---

## 🌐 Step 6: Domain Bağlantısı (qr-menu.fx8.io)

Deployment başarılı olduktan sonra:

### 6.1: Vercel'de Domain Ekle
1. Project Settings → "Domains"
2. "Add Domain" tıkla
3. Domain adını gir: `qr-menu.fx8.io`
4. "Continue" tıkla

### 6.2: DNS Kayıtlarını Ekle
Vercel size DNS kayıtlarını verecek. Örnek:

```
Type: CNAME
Name: qr-menu
Value: cname.vercel-dns.com
```

veya

```
Type: A
Value: 76.76.19.165
```

Domain registrarınızda (GoDaddy, Namecheap, etc.) bu kayıtları ekle:

1. Domain registratorunuza gir
2. DNS Settings / Name Servers bölümüne git
3. CNAME veya A record'u ekle
4. 5-30 dakika bekle (DNS propagation)

### 6.3: SSL Sertifikası
Vercel otomatik olarak Let's Encrypt SSL sertifikası verecektir.
- Settings → "SSL/TLS" → "Automatic" (varsayılan)
- Her şey otomatik olur!

---

## 🔌 Step 7: Environment Variables'ı Production'da Güncelle

Şimdi production environment variables'ı ayarla:

1. Vercel Project → Settings → "Environment Variables"
2. `NEXT_PUBLIC_API_URL` variable'ını bul (var mı kontrol et)
3. Production için değer güncelle:

```
NEXT_PUBLIC_API_URL = https://qr-order-api-xxxxx.a.run.app
```

**Cloud Run URL'ini nereden alıyorum?**
```bash
# Cloud Shell veya yerel makinede:
gcloud run services describe qr-order-api --region=europe-west1

# Output'ta "Service URL:" satırını ara
# Örn: https://qr-order-api-abc123.a.run.app
```

---

## 🧪 Step 8: Verification

Deployment'tan sonra kontrol et:

### Frontend'i Test Et
1. https://qr-menu.fx8.io adresine git
2. Sayfa yükleniyor mu?
3. Konsol'da hata var mı? (F12 → Console)

### API Bağlantısını Test Et
1. Network tab'ı aç (F12 → Network)
2. Menu sayfasını yükle
3. API call'larına bak:
   - İçin `/api/menu` request'ini ara
   - Response status 200 olmalı
   - CORS hataları olmamalı

### Test Flow
```
1. Frontend yükle
2. Menu öğelerini gör
3. Bir menu item tıkla
4. Sipariş formunu doldur
5. Gönder butonuna tıkla
6. Başarı mesajını gör
```

---

## 🐛 Troubleshooting

### Problem: "Failed to connect to API"

**Çözüm:**
1. Cloud Run API'nin çalışmakta olduğunu kontrol et
2. CORS_ORIGIN'i kontrol et:
   ```bash
   gcloud run services describe qr-order-api --region=europe-west1
   # CORS_ORIGIN=https://qr-menu.fx8.io olmalı
   ```
3. Vercel env variables'ını kontrol et

### Problem: "DNS not resolving"

**Çözüm:**
```bash
# DNS propagation'ını kontrol et
nslookup qr-menu.fx8.io

# Should return: 76.76.19.165 (Vercel IP)
```
- 5-30 dakika bekle
- Domain registratorunun DNS ayarlarını kontrol et

### Problem: "SSL certificate invalid"

**Çözüm:**
- Vercel otomatik sertifika sağlar
- 24 saat bekle (bazen sertifika generate etmesi uzun alır)
- Hala hata varsa: Vercel Support'a ulaş

### Problem: "Build failed"

**Çözüm:**
1. Build logs'u kontrol et:
   - Vercel Dashboard → Project → Deployments → [latest] → Build Logs
2. Common issues:
   - `pnpm install` başarısız → Lock file'ı kontrol et
   - TypeScript error → `pnpm tsc` local'de çalıştır
   - Missing env var → environment variables'ı kontrol et

---

## 📊 Monitoring After Deployment

### Vercel Analytics
- Dashboard → Analytics
- Sayfa yükleme zamanı, user metrics vs.

### Real-time Logs
```bash
# Vercel CLI ile
vercel logs --prod qr-menu

# veya Dashboard'dan:
# Project → Deployments → [latest] → Logs
```

### Performance Check
- Google PageSpeed Insights: https://pagespeed.web.dev/
- Vercel Analytics deftere bak
- Core Web Vitals kontrol et

---

## 🔄 CI/CD: Otomatik Deployment

GitHub'dan main branch'e push yaptığında otomatik deploy olur:

1. Git push yap
2. Vercel otomatik deployment başlatır
3. Build başarılı ise otomatik production'a deploy olur

**Preview Deployments:**
- Her PR'ya otomatik preview deployment yapılır
- https://qr-menu-pr-123.vercel.app şeklinde
- Merge'ten öncce test edilebilir

---

## 🛡️ Production Best Practices

### Security
- [ ] CORS_ORIGIN sadece production domain'i işaret etsin
- [ ] JWT_SECRET güvenli ve unique olsun
- [ ] Sensitive variables Vercel Secrets'e konulsun
- [ ] SSL/TLS enforce olsun (HTTPS yönlendirmesi)

### Performance
- [ ] Image optimization enabled (Next.js built-in)
- [ ] Caching headers doğru konfigüre edilsin
- [ ] CDN caching aktif olsun (Vercel default)
- [ ] Database connection pooling aktif olsun

### Monitoring
- [ ] Error tracking (Sentry veya Vercel built-in)
- [ ] Uptime monitoring (Vercel dışında tool)
- [ ] Daily log review
- [ ] Monthly performance review

---

## 🔄 Future: Automatic Deployment Pipeline

Şu setup önerilir:

```
main branch → Automatic deployment → qr-menu.fx8.io
develop branch → Preview deployment → Preview URL
PR → Preview deployment → PR comment'inde URL
```

Bu otomatik olarak Vercel'de setup'lanır!

---

## 📞 Support

**Vercel Docs**: https://vercel.com/docs
**Next.js Docs**: https://nextjs.org/docs
**Issues**: GitHub Issues'ta soru sor veya Vercel Support'a git

---

**Last Updated**: May 17, 2026
**Status**: Ready for Vercel Deployment
