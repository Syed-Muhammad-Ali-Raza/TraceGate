---
name: security
description: Use for auth, secrets, CSRF, headers, and OWASP-related changes.
---
# Security Skill
- No secrets in logs/code; Zod env; helmet CSP; CORS allowlist never * with credentials
- Passwords argon2id; JWT access 15m cookie; opaque rotating refresh hashed in DB
- CSRF double-submit; rate limit auth + proxy; parameterized queries only
- Redact authorization/cookie/password/provider keys in Pino
