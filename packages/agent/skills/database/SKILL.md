---
name: database
description: Use when editing Drizzle schema, migrations, or SQL in packages/db.
---
# Database Skill
- snake_case plural tables, `_id` FKs, `created_at`/`updated_at`, `timestamptz`, numeric money
- Partition llm_requests by month; BRIN on created_at; keyset pagination never OFFSET
- Dashboards read usage_hourly/usage_daily only — never raw for charts
- Batch inserts for ingestion; tenant isolation via project_id on every query
- Forward-only migrations; never edit applied ones; EXPLAIN ANALYZE hot queries
- Drizzle schema per file; sql template for analytics
