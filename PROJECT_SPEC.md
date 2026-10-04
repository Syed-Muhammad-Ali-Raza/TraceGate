# LLM Gateway & Observability Platform: Project Spec

> **How to use this file:** Give this file to your AI IDE and say:
> *"Read PROJECT_SPEC.md fully. Build the project phase by phase. Follow every rule in it. Start with Phase 0."*
> Also see `AGENTS.md` for condensed IDE instructions.

---

## 1. Product Summary

Developers route their LLM calls (OpenAI, Anthropic, etc.) through our proxy. We log every request and expose analytics.

**Core features**
1. **Proxy**: OpenAI/Anthropic-compatible endpoint with streaming (SSE) passthrough
2. **Logging**: prompt, response, latency, TTFT, tokens, cost, status, model, metadata
3. **Dashboard**: analytics, cost breakdown, trace viewer, filters
4. **Prompt management**: versioning, A/B testing
5. **Evals**: automated LLM-as-judge scoring
6. **Controls**: rate limiting, response caching, API key management

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + **React 19** + TypeScript |
| UI | **shadcn/ui + Tailwind** (primary), Ant Design only for heavy components |
| Client state | **Zustand** |
| Server state | **TanStack Query v5** |
| Forms | React Hook Form + Zod |
| Charts / Tables | Recharts, TanStack Table |
| Backend | Node.js + **Express** + TypeScript |
| Validation | Zod |
| Database | PostgreSQL 16+ |
| ORM | **Drizzle ORM** |
| Queue / Cache | Redis + BullMQ |
| Auth | httpOnly cookies (JWT access + rotating refresh) |
| Infra | Docker + Docker Compose, Nginx (optional) |
| Logging | Pino |
| Testing | Vitest, Supertest, Playwright |
| Monorepo | pnpm workspaces + Turborepo |

---

## 3. Root Project Structure

```
llm-gateway/
├── apps/web|api|worker
├── packages/db|shared|agent|config
├── docker/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
├── AGENTS.md
└── README.md
```

---

## 4. Global Code Rules

- TypeScript `strict: true`. No `any`. Use `unknown` and narrow.
- **No file longer than 500 lines. Components target under 200 lines.**
- One responsibility per file or function. Functions under 40 lines where possible.
- Prefer named exports. Absolute imports via path aliases.
- Never hardcode secrets or URLs. Zod-parsed `env.ts`.
- Comment the **why**, not the what. JSDoc on every service/repository method.
- Conventional commits. ESLint and Prettier enforced in CI.

---

## 5–10. Detailed Rules

See the original handoff for full frontend (React 19, efficiency, shadcn), backend (layers, security, proxy), database (partitioning, indexes, rollups), ORM decision (Drizzle), agent CLI, and Docker rules. Condensed copies live in `AGENTS.md`.

### Backend layers
Routes → Controller → Service → Repository. Never skip. Standard response: `{ success, data, error, meta }`.

### Proxy flow
`authenticateApiKey → rateLimit → cache → provider stream → enqueue log (BullMQ)`. Logging must never slow the user request.

### Database
- Partition `llm_requests` by month
- Index `(project_id, created_at DESC)`, `(trace_id)`, BRIN on `created_at`
- Dashboards read `usage_hourly` / `usage_daily` only
- Cursor/keyset pagination — never `OFFSET`
- Tenant isolation via mandatory `project_id` filter

---

## 11. Build Phases

| Phase | Deliverable |
|---|---|
| **0** | Monorepo scaffold, Docker Compose, health checks |
| **1** | `packages/db` Drizzle schema + migrations + seed |
| **2** | Auth with httpOnly cookies, rotation, CSRF + UI |
| **3** | Dashboard shell + common components |
| **4** | API keys + provider keys |
| **5** | Proxy v1 non-streaming |
| **6** | Streaming + BullMQ batch logging |
| **7** | Partitioned request log + trace viewer |
| **8** | Rollups + analytics dashboard |
| **9** | Caching + rate limiting + budgets |
| **10** | Prompt versioning + A/B experiments |
| **11** | Evals |
| **12** | Anthropic adapter + fallback |
| **13** | `packages/agent` CLI + skills |
| **14** | Tests, k6, security review, prod CI/CD |

---

## 12. Definition of Done

- Types strict, no `any`, lint and typecheck pass
- No file over 500 lines
- Zod validation; `AppError` for errors
- No secrets in code or logs
- `EXPLAIN ANALYZE` for `llm_requests` queries
- Tests for new service logic
- Works under `docker compose up` from a clean clone

---

## 13. Instruction to the IDE

```
You are a senior full-stack engineer. Read PROJECT_SPEC.md completely before writing any code.
Rules:
1. Build strictly phase by phase (section 11). Finish and verify one phase before the next.
2. Obey section 4 (global rules), 5 (frontend), 6 (backend), 7 (database).
3. Never create a file over 500 lines. Split into smaller modules.
4. Before each phase, list the files you will create. After each phase, tell me how to run and test it.
5. If a requirement is ambiguous, ask one short question instead of guessing.
Start with Phase 0.
```
