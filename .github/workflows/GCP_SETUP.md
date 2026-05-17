# GCP Setup for GitHub Actions CI/CD

Run these commands once to configure Workload Identity Federation and Artifact Registry.

## Prerequisites
```bash
gcloud config set project qr-menu-496520
```

## 1. Enable required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com
```

## 2. Create Artifact Registry repository
```bash
gcloud artifacts repositories create qr-menu \
  --repository-format=docker \
  --location=europe-west3 \
  --description="QR Menu Docker images"
```

## 3. Create Service Account
```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"
```

## 4. Grant permissions to Service Account
```bash
SA_EMAIL="github-actions@qr-menu-496520.iam.gserviceaccount.com"

# Push to Artifact Registry
gcloud projects add-iam-policy-binding qr-menu-496520 \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.writer"

# Deploy to Cloud Run
gcloud projects add-iam-policy-binding qr-menu-496520 \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.admin"

# Act as Cloud Run service account
gcloud projects add-iam-policy-binding qr-menu-496520 \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"

# Read secrets from Secret Manager
gcloud projects add-iam-policy-binding qr-menu-496520 \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

## 5. Create Workload Identity Federation Pool & Provider
```bash
GITHUB_REPO="YOUR_GITHUB_USERNAME/qr-menu-repo"

# Create pool
gcloud iam workload-identity-pools create github-pool \
  --location=global \
  --display-name="GitHub Actions Pool"

# Create provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$GITHUB_REPO'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Get provider resource name (copy this for GitHub Secret)
gcloud iam workload-identity-pools providers describe github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --format="value(name)"
```

## 6. Bind Service Account to WIF Pool
```bash
SA_EMAIL="github-actions@qr-menu-496520.iam.gserviceaccount.com"
WIF_POOL="projects/572304365391/locations/global/workloadIdentityPools/github-pool"

gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$WIF_POOL/attribute.repository/YOUR_GITHUB_USERNAME/qr-menu-repo"
```

## 7. Create GCP Secrets (if not already created)
```bash
# DATABASE_URL
echo -n "postgresql://..." | gcloud secrets create DATABASE_URL --data-file=-

# JWT_SECRET
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
```

## 8. Add GitHub Secrets
In your GitHub repo → Settings → Secrets and variables → Actions:

| Secret Name | Value |
|-------------|-------|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Output of step 5 provider describe (e.g. `projects/572304365391/locations/global/workloadIdentityPools/github-pool/providers/github-provider`) |
| `GCP_SERVICE_ACCOUNT` | `github-actions@qr-menu-496520.iam.gserviceaccount.com` |
