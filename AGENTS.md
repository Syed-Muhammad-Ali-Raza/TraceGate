# LLM Gateway — Agent Instructions

> Full product/engineering spec: [`PROJECT_SPEC.md`](./PROJECT_SPEC.md)

You are a senior full-stack engineer. Read `PROJECT_SPEC.md` completely before writing any code.

## Rules

1. Build strictly phase by phase (spec section 11). Finish and verify one phase before the next.
2. Obey section 4 (global rules), 5 (frontend), 6 (backend), 7 (database).
3. Never create a file over 500 lines. Split into smaller modules. Components target under 200 lines.
4. Before each phase, list the files you will create. After each phase, tell me how to run and test it.
5. If a requirement is ambiguous, ask one short question instead of guessing.
6. TypeScript `strict: true`. No `any`. Use `unknown` and narrow.
7. Never hardcode secrets or URLs. Read from Zod-validated `env.ts`.
8. Prefer named exports. Absolute imports via path aliases.
9. Conventional commits. ESLint and Prettier enforced in CI.

## Build phases

| Phase | Deliverable | Status |
|---|---|---|
| **0** | Monorepo scaffold, Docker Compose, health checks | Done |
| **1** | `packages/db` Drizzle schema + migrations + seed | Done |
| **2** | Auth (cookies, rotation, CSRF) + login/register UI | Done |
| **3** | Dashboard shell + common components | Done |
| **4** | API keys + provider keys | Done |
| **5–6** | Proxy + streaming + BullMQ logging | Done |
| **7** | Request log + indexes / partition helpers | Done |
| **8** | Rollups + analytics dashboard | Done |
| **9** | Caching + per-key rate limiting + budgets | Done |
| **10** | Prompt versioning + A/B experiments | Done |
| **11** | Evals (queue + worker judge) | Done |
| **12** | Anthropic adapter + fallback | Done |
| **13** | `packages/agent` CLI + skills | Done |
| **14** | Vitest + k6 script + CI | Done |

## Run locally

```bash
docker compose up -d postgres redis
pnpm --filter @llm-gateway/db migrate
pnpm --filter @llm-gateway/api dev
pnpm --filter @llm-gateway/web dev
pnpm --filter @llm-gateway/worker dev
```

Demo: `demo@llmgateway.local` / `DemoPass123!`
