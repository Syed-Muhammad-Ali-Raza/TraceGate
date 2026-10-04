# Architecture

This document describes how the monorepo fits together in production-shaped local development.

## High-level

```
Clients / SDKs
    │  Authorization: Bearer lgw_live_…
    ▼
Express API  ──proxy──►  OpenAI / Anthropic
    │                      ▲
    │ enqueue (BullMQ)     │ fallback on 5xx
    ▼
Redis ◄──► Worker (batch insert + evals)
    │
    ▼
PostgreSQL (requests, rollups, auth, prompts)
    ▲
    │ cookie session
Next.js dashboard
```

Logging is **never** on the hot path of a successful user response: the proxy streams or returns first, then enqueues a log job.

## Backend layering (`apps/api`)

Industry-standard Express layout:

| Layer | Responsibility |
|---|---|
| `*.routes.ts` | Mount paths, middleware order |
| `*.controller.ts` | HTTP only — parse, call service, respond |
| `*.service.ts` | Business rules, throws `AppError` |
| `*.repository.ts` | Drizzle / SQL only |

Do not skip layers. Controllers must not talk to the database.

Shared cross-cutting pieces live in:

- `middlewares/` — auth, CSRF, API key auth, rate limits, errors
- `lib/` — db, redis, jwt, cookies, crypto
- `queues/` — BullMQ producers
- `utils/` — `AppError`, `asyncHandler`, response envelope

### Standard response envelope

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": null
}
```

Errors use the same shape with `success: false` and a stable `error.code`.

## Proxy flow

1. `authenticateApiKey` — hash bearer token, load project, enforce rate limit + budget  
2. Optional cache lookup (deterministic requests / `temperature = 0` when TTL > 0)  
3. Optional A/B prompt injection from a running experiment  
4. Forward to provider adapter (`openai` / `anthropic`)  
5. On primary 5xx/network failure → fallback provider if a key exists  
6. Stream chunks to the client immediately (no full-buffer wait)  
7. Enqueue log event with tokens, cost, latency, TTFT, metadata  

## Worker (`apps/worker`)

| Queue | Behavior |
|---|---|
| `log-ingestion` | Batch inserts into `llm_requests` + lightweight `usage_hourly` rows |
| `eval-runner` | Scores prompt/response pairs and writes `eval_results` |

Jobs are idempotent where practical, with retries and bounded concurrency.

## Data model (simplified)

- **Identity:** `users`, `sessions`, `organizations`, `org_members`, `projects`  
- **Access:** `api_keys`, `provider_keys`  
- **Traffic:** `llm_requests` (hot), `usage_hourly` / `usage_daily` (dashboards)  
- **Product:** `prompts`, `prompt_versions`, `experiments`, `experiment_variants`, `evals`, `eval_results`  

Dashboard charts **must** read rollups, not raw `llm_requests`. Request list/trace views may hit the raw table with keyset pagination.

## Frontend (`apps/web`)

- App Router + React 19  
- Server Components by default; client components for forms/tables  
- Feature folders under `src/features/*`  
- Shared UI under `src/components/common`  
- Zustand for UI/auth display state; cookies remain the source of tokens  

## Configuration

All runtime config is read from environment variables and validated with Zod (`apps/*/src/config/env.ts` or `lib/env.ts`). Missing or invalid config fails fast at process start.
