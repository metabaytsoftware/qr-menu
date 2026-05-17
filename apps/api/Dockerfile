# Stage 1: Install & Build
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm prisma@5.22.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY libs/ ./libs/
COPY core/ ./core/

RUN pnpm install --frozen-lockfile

COPY apps/api/src ./apps/api/src

ENV DATABASE_URL="file:./prisma/dev.db"
RUN cd apps/api && pnpm exec prisma generate
RUN cd apps/api && pnpm run build

# Stage 2: pnpm deploy (creates self-contained dir with production node_modules)
FROM node:22-alpine AS deployer

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY libs/ ./libs/
COPY core/ ./core/

RUN pnpm install --frozen-lockfile

# pnpm deploy bundles all production deps into /deploy
RUN pnpm deploy --filter=@meta-repo/qr-order-api --prod --legacy /deploy

# Stage 3: Minimal production image
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init openssl

COPY --from=deployer /deploy/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/src/generated ./src/generated
COPY --from=deployer /deploy/package.json ./

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]
