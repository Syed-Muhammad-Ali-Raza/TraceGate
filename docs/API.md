# API reference

Base URL (local): `http://localhost:4000`  
JSON content type unless streaming.

All dashboard JSON responses use:

```ts
{ success: boolean; data: T; error: { code: string; message: string } | null; meta: unknown }
```

---

## Health

### `GET /health`

Liveness probe for Docker / load balancers.

---

## Auth (`/api/v1/auth`)

Cookie-based session for the dashboard. Tokens are **not** returned in JSON bodies.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/csrf` | — | Sets readable `lgw_csrf` cookie; returns `{ csrfToken }` |
| `POST` | `/register` | CSRF | Creates user + org + default project |
| `POST` | `/login` | CSRF | Issues access + refresh cookies |
| `POST` | `/refresh` | Refresh cookie | Rotates refresh; reuse revokes family |
| `POST` | `/logout` | Access + CSRF | Revokes session, clears cookies |
| `GET` | `/me` | Access cookie | Current user |

**CSRF:** for `POST`/`PUT`/`PATCH`/`DELETE` dashboard routes, send header:

```
X-CSRF-Token: <value of lgw_csrf cookie>
```

Fetch helpers must use `credentials: 'include'`.

---

## API keys (`/api/v1/api-keys`, `/api/v1/provider-keys`)

Requires dashboard access cookie (+ CSRF on writes).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/api-keys` | List non-revoked gateway keys (prefix only) |
| `POST` | `/api/v1/api-keys` | Create key — response includes `rawKey` **once** |
| `POST` | `/api/v1/api-keys/:id/revoke` | Revoke |
| `GET` | `/api/v1/provider-keys` | List configured providers (no secrets) |
| `POST` | `/api/v1/provider-keys` | Upsert encrypted OpenAI/Anthropic key |

Gateway key format: `lgw_live_<64 hex chars>`.

---

## Proxy

### `POST /v1/chat/completions`

Also available at `/api/v1/proxy/chat/completions`.

**Auth:** `Authorization: Bearer lgw_live_…`

OpenAI-compatible body:

```json
{
  "model": "gpt-4o-mini",
  "messages": [{ "role": "user", "content": "hi" }],
  "stream": false,
  "temperature": 0,
  "max_tokens": 256
}
```

Optional grouping headers:

- `X-Trace-Id`
- `X-Session-Id`
- `X-User-Id`
- `X-Custom-Metadata` (JSON string)

Models starting with `claude` route to Anthropic; others to OpenAI. On primary 5xx/network failure the gateway attempts the other provider if a key exists.

---

## Requests & analytics

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/requests?cursor=` | Keyset page of `llm_requests` |
| `GET` | `/api/v1/requests/:id` | Trace detail |
| `GET` | `/api/v1/analytics` | `usage_hourly` / `usage_daily` rollups |

---

## Prompts, experiments, evals

| Method | Path | Description |
|---|---|---|
| `GET/POST` | `/api/v1/prompts` | List / create prompt + v1 |
| `GET` | `/api/v1/prompts/:id/versions` | Version history |
| `GET/POST` | `/api/v1/experiments` | List / create |
| `POST` | `/api/v1/experiments/:id/variants` | Add traffic variant |
| `POST` | `/api/v1/experiments/:id/activate` | Set status `running` |
| `GET/POST` | `/api/v1/evals` | List / create judge config |
| `GET` | `/api/v1/evals/:id/results` | Scores |
| `POST` | `/api/v1/evals/:id/run` | Enqueue judge job |

---

## Error codes (common)

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing/invalid session or API key |
| `CSRF_FAILED` | 403 | CSRF cookie/header mismatch |
| `VALIDATION_ERROR` | 400 | Zod rejection |
| `RATE_LIMITED` | 429 | Auth or API-key limit |
| `BUDGET_EXCEEDED` | 402 | Monthly key budget hit |
| `PROVIDER_KEY_MISSING` | 400 | No encrypted provider key |
| `NOT_FOUND` | 404 | Missing resource |
