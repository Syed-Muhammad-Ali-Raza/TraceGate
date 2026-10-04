# Contributing

## Branching & commits

- Prefer short-lived feature branches off `main`.
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`.
- Keep PRs focused; avoid drive-by reformatting.

## Local loop

```bash
pnpm install
docker compose up -d postgres redis
pnpm db:migrate
pnpm --filter @llm-gateway/api dev
pnpm --filter @llm-gateway/web dev
pnpm --filter @llm-gateway/worker dev
```

Before you push:

```bash
pnpm typecheck
pnpm test
pnpm format:check
```

## Code conventions

### TypeScript

- `strict: true`, no `any` — use `unknown` and narrow.
- Prefer named exports.
- Files stay under **500** lines; React components target **under 200**.

### Backend

- Layers: route → controller → service → repository.
- Validate inputs with Zod (`.strict()` where request bodies are closed).
- Throw `AppError` from services; let `errorHandler` map to HTTP.
- Never log secrets (authorization headers, cookies, provider keys, passwords).

### Frontend

- Server Components by default; `'use client'` only when needed.
- Put reusable UI in `components/common` after the second use.
- Keep tokens in httpOnly cookies — not `localStorage`.

### Database

- Schema changes via Drizzle migrations only (forward-only).
- Dashboard aggregates read rollup tables, not raw `llm_requests`.
- Use keyset cursors — never `OFFSET` on the request log.

## Adding a provider

1. Implement `ProviderAdapter` under `apps/api/src/modules/proxy/providers/`.
2. Register selection + fallback in `proxy.service.ts`.
3. Document env / UI steps in `docs/API.md`.

## Security checklist (PR)

- [ ] No secrets in code or fixtures  
- [ ] New mutating dashboard routes have CSRF  
- [ ] New proxy paths authenticate API keys  
- [ ] Errors do not leak stacks in production  

## Docs

Update `README.md` and `docs/*` when you change operator-facing behavior (ports, env vars, endpoints).
