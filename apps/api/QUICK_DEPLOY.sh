#!/bin/bash
# QR Order API - Quick Cloud Run Deployment Script
# Usage: ./QUICK_DEPLOY.sh <project-id> <region>

set -e

PROJECT_ID=${1:-}
REGION=${2:-us-central1}
SERVICE_NAME="qr-order-api"
IMAGE_NAME="qr-order-api"

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: ./QUICK_DEPLOY.sh <project-id> [region]"
  echo "Example: ./QUICK_DEPLOY.sh my-gcp-project us-central1"
  exit 1
fi

echo "🚀 Deploying QR Order API to Cloud Run"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Step 1: Build
echo "📦 Step 1: Building Docker image..."
docker build \
  -t gcr.io/$PROJECT_ID/$IMAGE_NAME:latest \
  -f apps/qr-order-api/Dockerfile \
  .

# Step 2: Push
echo "📤 Step 2: Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:latest

# Step 3: Deploy
echo "☁️  Step 3: Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image=gcr.io/$PROJECT_ID/$IMAGE_NAME:latest \
  --platform=managed \
  --region=$REGION \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --set-env-vars=NODE_ENV=production,PORT=8080 \
  --allow-unauthenticated \
  --project=$PROJECT_ID

# Step 4: Get URL
echo ""
echo "✅ Deployment complete!"
echo ""
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)' \
  --project=$PROJECT_ID)

echo "📍 Service URL: $SERVICE_URL"
echo "🏥 Health Check: $SERVICE_URL/api/health"
echo ""
echo "💡 Next steps:"
echo "  1. Set database secrets: gcloud secrets create database-credentials --data-file=-"
echo "  2. Update environment: gcloud run services update $SERVICE_NAME --update-secrets=DATABASE_URL=database-credentials:latest"
echo "  3. View logs: gcloud run services logs read $SERVICE_NAME --region=$REGION"
