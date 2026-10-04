# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
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
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter @llm-gateway/worker build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
COPY --from=build /app/apps/worker/dist ./dist
COPY --from=build /app/apps/worker/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
USER nodejs
CMD ["node", "dist/index.js"]
