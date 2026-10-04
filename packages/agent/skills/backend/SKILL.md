---
name: backend
description: Use when editing Express API modules in apps/api.
---
# Backend Skill
- Layers: routes → controller → service → repository (never skip)
- AppError + central errorHandler; response shape `{ success, data, error, meta }`
- Zod-validate every input with `.strict()`; wrap handlers in asyncHandler
- Auth cookies httpOnly; refresh rotation + reuse detection; CSRF on mutating routes
- API keys: store SHA-256 only; provider keys AES-256-GCM encrypted
- Proxy: stream passthrough immediately; enqueue logs via BullMQ; handle disconnect
- JSDoc on every service method; Pino with redaction; graceful shutdown
