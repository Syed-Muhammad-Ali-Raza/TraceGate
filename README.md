# LLM Gateway

OpenAI/Anthropic-compatible **LLM proxy** with request logging, cost tracking, analytics, prompt experiments, and evals.

If you route model traffic through this gateway, you get traces, budgets, and a dashboard without changing how your apps call the providers.

---

## What’s included

| Area | Capability |
|---|---|
| Proxy | `/v1/chat/completions` (streaming + non-streaming) |
| Providers | OpenAI + Anthropic adapters, automatic fallback |
| Auth | httpOnly JWT access cookie + rotating refresh + CSRF |
| Keys | Gateway API keys (hashed) + provider keys (AES-GCM) |
| Controls | Per-key rate limits, monthly budgets, response cache |
| Observability | BullMQ ingestion, request log, traces, hourly rollups |
| Prompts | Versioned prompts + A/B experiments |
| Evals | Queue-based LLM-as-judge jobs |
| Tooling | `packages/agent` skill installer, Vitest, k6 script, CI |

---

## Prerequisites

- Node.js **20+**
- pnpm **9+** (`corepack enable`)
- Docker Desktop (Postgres 16 + Redis 7)

---

## Quick start

```bash
# 1. Env
cp .env.example .env

# 2. Install
pnpm install

# 3. Infrastructure
docker compose up -d postgres redis

# 4. Schema + demo data
pnpm db:migrate
pnpm db:seed

# 5. Apps (three terminals, or use turbo)
pnpm --filter @llm-gateway/api dev
pnpm --filter @llm-gateway/web dev
pnpm --filter @llm-gateway/worker dev
```

| Service | Default URL |
|---|---|
| Web dashboard | http://localhost:3000 |
| API | http://localhost:4000/health |
| Postgres (host) | `localhost:15432` |
| Redis (host) | `localhost:16379` |

> If port `4000` is already taken on your machine, set `API_PORT=4010` in `.env` and `NEXT_PUBLIC_API_URL=http://localhost:4010`.

### Demo account (from seed)

- Email: `demo@llmgateway.local`
- Password: `DemoPass123!`
- A demo gateway API key is printed once by `pnpm db:seed` — store it.

---

## Repository layout

```
apps/
  web/       Next.js 15 dashboard (App Router, React 19)
  api/       Express gateway + dashboard API
  worker/    BullMQ consumers (log ingestion, evals)
packages/
  db/        Drizzle schema, migrations, seed
  shared/    Zod schemas + shared constants
  config/    Shared TypeScript config
  agent/     npx-installable IDE skills CLI
docs/        Architecture + API reference
load/k6/     Proxy load test
```

---

## Common scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Turborepo `dev` for all packages |
| `pnpm typecheck` | Strict TypeScript across the workspace |
| `pnpm test` | Unit tests (Vitest in `apps/api`) |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm db:seed` | Seed demo user / org / project / key |
| `pnpm docker:up` | Build & run full Compose stack |
| `pnpm format` | Prettier write |

---

## First useful path

1. Open http://localhost:3000/login and sign in.
2. Go to **API Keys** → save an OpenAI (or Anthropic) provider key.
3. Create a gateway key and copy the `lgw_live_…` value (shown once).
4. Call the proxy:

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer lgw_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role":"user","content":"hello"}],
    "temperature": 0
  }'
```

5. Open **Requests** / **Overview** to see logs and rollups (worker must be running).

---

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — request flow, layers, data model
- [API reference](./docs/API.md) — auth, dashboard, and proxy endpoints
- [Contributing](./docs/CONTRIBUTING.md) — local conventions and PR checklist
- [Project spec](./PROJECT_SPEC.md) — full product/engineering requirements
- [Agent instructions](./AGENTS.md) — IDE agent rules / phase status

---

## Load testing

```bash
# requires k6: https://k6.io
k6 run -e API_URL=http://localhost:4000 -e API_KEY=lgw_live_... load/k6/proxy.js
```

---

## Security notes (short)

- Never commit `.env`. Secrets are Zod-validated at boot.
- Gateway keys are stored as SHA-256 hashes; provider keys are AES-256-GCM encrypted.
- Dashboard auth uses httpOnly cookies; mutating routes require CSRF (`X-CSRF-Token`).
- Logs redact `authorization`, `cookie`, passwords, and provider keys.

---

## License

Private / unlicensed until published.
