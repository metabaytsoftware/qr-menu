# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm prisma@5.22.0

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/qr-order-api/package.json ./apps/qr-order-api/
COPY apps/qr-order-api/prisma ./apps/qr-order-api/prisma

# Install all dependencies (needed for workspace resolution)
RUN pnpm install --frozen-lockfile

# Setup workspace package links
RUN mkdir -p /app/node_modules/@meta-repo && \
    cd /app/node_modules/@meta-repo && \
    ln -s ../../libs/auth-api auth-api && \
    ln -s ../../libs/types types

# Copy source
COPY apps/qr-order-api ./apps/qr-order-api
COPY libs ./libs
COPY core ./core

# Build shared packages first
RUN cd /app/libs/types && npm run build 2>/dev/null || true
RUN cd /app/libs/auth-api && npm run build 2>/dev/null || true

# Generate Prisma Client
WORKDIR /app
ENV DATABASE_URL="file:./prisma/dev.db"
RUN cd apps/qr-order-api && prisma generate

# Build app with TypeScript
WORKDIR /app/apps/qr-order-api
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init openssl

# Copy hoisted node_modules, built libs, and app files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/apps/qr-order-api/dist ./dist
COPY --from=builder /app/apps/qr-order-api/package.json ./
COPY --from=builder /app/apps/qr-order-api/prisma ./prisma
COPY --from=builder /app/apps/qr-order-api/src/generated ./src/generated

ENV PORT=8080
ENV NODE_ENV=production

# Setup workspace package links in production
RUN mkdir -p /app/node_modules/@meta-repo && \
    cd /app/node_modules/@meta-repo && \
    ln -s ../../libs/auth-api auth-api && \
    ln -s ../../libs/types types

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]
