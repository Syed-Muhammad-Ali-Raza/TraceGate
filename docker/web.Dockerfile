# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
  && apk add --no-cache wget
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1
RUN pnpm --filter @llm-gateway/web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache wget \
  && addgroup -S nodejs && adduser -S nodejs -G nodejs
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build --chown=nodejs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nodejs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "apps/web/server.js"]
