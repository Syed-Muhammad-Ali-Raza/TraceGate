---
name: frontend
description: Use when creating or editing React/Next.js UI in apps/web.
---
# Frontend Skill
- React 19 + Server Components first; `'use client'` only on interactive leaves
- React Compiler on; avoid hand-written useMemo/useCallback/memo unless profiled
- No forwardRef; ref is a normal prop
- Components <200 lines target, max 500; extract to components/common if used 2+ times
- State: TanStack Query (server), Zustand selectors (UI), URL (filters), RHF (forms)
- shadcn/Tailwind primary; no mixing Ant Design for the same component type
- Virtualize long lists; dynamic import heavy editors/charts; Suspense skeletons
