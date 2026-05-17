# QR Menu Projesi - Hibrit Deployment Planı

Bu plan, projeyi **sıfır maliyetle** ve **yüksek ölçeklenebilirlikle** yayına almak için tasarlanmıştır.

## 🏗 Mimari Özet
- **Frontend:** Vercel (Next.js)
- **Backend (API):** Google Cloud Run (Dockerized NestJS)
- **Veritabanı:** Supabase (PostgreSQL)
- **Önbellek:** Upstash (Redis)
- **Dosya Depolama:** Supabase Storage
- **İzleme:** Sentry

---

## 📋 Hazırlık Adımları

### 1. Veritabanı ve Auth (Supabase)
- [ ] Supabase üzerinde yeni bir proje oluştur.
- [ ] `DATABASE_URL` ve `DIRECT_URL` (Prisma için) bilgilerini al.
- [ ] `SUPABASE_ANON_KEY` ve `SUPABASE_URL` bilgilerini (Görsel yükleme ve Auth için) not et.
- [ ] **Storage:** `menu-images` adında bir "Public Bucket" oluştur.

### 2. Önbellek (Upstash)
- [ ] Upstash konsolundan bir Redis veritabanı oluştur.
- [ ] `REDIS_URL` bilgisini al.

---

## 🚀 Uygulama Adımları

### Faz 1: Veritabanı Senkronizasyonu
1. Yerel `.env` dosyasını Supabase bilgileriyle güncelle.
2. `npx prisma db push` komutu ile tabloları Supabase'e aktar.
3. (Opsiyonel) Varsa seed verilerini yükle: `pnpm run db:seed`.

### Faz 2: Backend Deployment (GCP Cloud Run)
1. `qr-order-api` için Docker imajını hazırla.
2. Google Artifact Registry üzerinde depo oluştur.
3. İmajı build et ve pushla:
   ```bash
   docker build -t gcr.io/[PROJECT_ID]/qr-order-api .
   docker push gcr.io/[PROJECT_ID]/qr-order-api
   ```
4. Cloud Run servisini başlat:
   - Port: 3002 (veya 8080'e uyarla)
   - Env variables: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` vb.
   - Authentication: "Allow unauthenticated invocations" (Halk açık API için).

### Faz 3: Frontend Deployment (Vercel)
1. GitHub deponu Vercel'e bağla.
2. `apps/qr-order-web` dizinini Root Directory olarak seç.
3. Environment Variables tanımla:
   - `NEXT_PUBLIC_API_URL`: (Cloud Run'dan gelen URL)
   - `NEXT_PUBLIC_SUPABASE_URL`: ...
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: ...
4. "Deploy" butonuna bas.

---

## 🛠 Bakım ve İzleme
- [ ] Sentry entegrasyonunu her iki proje için de tamamla.
- [ ] Domain yönlendirmelerini (isteğe bağlı) yap.
- [ ] Supabase üzerinde veritabanı yedeklemelerini kontrol et.

---

## ⚠️ Kritik Uyarılar
- **CORS:** Cloud Run üzerindeki API'de Vercel domainine CORS izni verildiğinden emin olun.
- **Cold Start:** Cloud Run ilk istekte birkaç saniye gecikebilir. Bunu aşmak için "Min Instances: 1" yapılabilir (ancak bu ücretli olabilir, 0 maliyet için 0 kalmalıdır).
- **Prisma Client:** Cloud Run içinde Prisma client'ın doğru bir şekilde generate edildiğinden emin olun (Dockerfile içinde).
