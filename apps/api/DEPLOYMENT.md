# QR Order API - Cloud Run Deployment Guide

## Prerequisites

- Google Cloud Project with billing enabled
- `gcloud` CLI installed
- Docker installed
- Project ID: `your-gcp-project-id`

## Environment Variables Required

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret

## Option 1: Automated Deployment via Cloud Build

```bash
cd c:/Projects/meta-monorepo

# Submit build to Cloud Build
gcloud builds submit \
  --config=apps/qr-order-api/cloudbuild.yaml \
  --project=your-gcp-project-id
```

## Option 2: Manual Deployment

### 1. Build Docker Image

```bash
cd c:/Projects/meta-monorepo

docker build \
  -t gcr.io/your-gcp-project-id/qr-order-api:latest \
  -f apps/qr-order-api/Dockerfile \
  .
```

### 2. Push to Google Container Registry

```bash
# Configure Docker authentication (one-time)
gcloud auth configure-docker

# Push image
docker push gcr.io/your-gcp-project-id/qr-order-api:latest
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy qr-order-api \
  --image=gcr.io/your-gcp-project-id/qr-order-api:latest \
  --platform=managed \
  --region=us-central1 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --set-env-vars=NODE_ENV=production \
  --set-env-vars=PORT=8080 \
  --update-secrets=DATABASE_URL=database-credentials:latest \
  --update-secrets=JWT_SECRET=api-secrets:latest \
  --allow-unauthenticated \
  --project=your-gcp-project-id
```

## Database Setup

### Create Secret in Google Secret Manager

```bash
# Store DATABASE_URL
echo -n "postgresql://user:password@host:5432/dbname" | \
  gcloud secrets create database-credentials \
  --data-file=- \
  --project=your-gcp-project-id

# Store JWT_SECRET
echo -n "your-jwt-secret" | \
  gcloud secrets create api-secrets \
  --data-file=- \
  --project=your-gcp-project-id
```

### Grant Service Account Access

```bash
gcloud secrets add-iam-policy-binding database-credentials \
  --member=serviceAccount:qr-order-api@your-gcp-project-id.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor \
  --project=your-gcp-project-id
```

## Verify Deployment

```bash
# Check service status
gcloud run services describe qr-order-api \
  --region=us-central1 \
  --project=your-gcp-project-id

# Get service URL
gcloud run services describe qr-order-api \
  --region=us-central1 \
  --format='value(status.url)' \
  --project=your-gcp-project-id

# Test health endpoint
curl https://your-service-url/api/health
```

## Monitoring

```bash
# View logs
gcloud run services logs read qr-order-api \
  --region=us-central1 \
  --limit=50 \
  --project=your-gcp-project-id

# Stream logs
gcloud run services logs read qr-order-api \
  --region=us-central1 \
  --follow \
  --project=your-gcp-project-id
```

## Troubleshooting

### Port Mismatch Error
Ensure `PORT=8080` is set in environment variables. The application listens on the PORT env var.

### Database Connection Failed
- Verify `DATABASE_URL` is correctly stored in Secret Manager
- Ensure Cloud Run service has IAM permission to access secrets
- Check network connectivity (Cloud SQL Proxy if using Cloud SQL)

### Build Timeout
Increase timeout in `cloudbuild.yaml`:
```yaml
timeout: 7200s  # 2 hours
```

## Scaling Configuration

Edit Cloud Run service to adjust scaling:

```bash
gcloud run services update qr-order-api \
  --min-instances=1 \
  --max-instances=10 \
  --region=us-central1 \
  --project=your-gcp-project-id
```

## Security Best Practices

- [ ] Remove `--allow-unauthenticated` if API requires authentication
- [ ] Enable Cloud Armor for DDoS protection
- [ ] Use VPC connectors for database connections
- [ ] Implement rate limiting in the application
- [ ] Regularly scan container images for vulnerabilities

## Rollback

```bash
gcloud run deploy qr-order-api \
  --image=gcr.io/your-gcp-project-id/qr-order-api:previous-tag \
  --region=us-central1 \
  --project=your-gcp-project-id
```
