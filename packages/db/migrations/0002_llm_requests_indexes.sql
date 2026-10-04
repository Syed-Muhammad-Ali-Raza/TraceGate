-- Phase 7/14: prepare monthly RANGE partitioning helpers for llm_requests.
-- Existing non-partitioned table remains; attach future months via this function.

CREATE OR REPLACE FUNCTION create_llm_requests_partition(target_month date)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  partition_name text := format('llm_requests_%s', to_char(start_date, 'YYYY_MM'));
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I (LIKE llm_requests INCLUDING ALL)',
    partition_name
  );
  -- Index patterns expected on hot partitions (safe if already present via INCLUDING ALL).
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I (project_id, created_at DESC)',
    partition_name || '_project_created_idx',
    partition_name
  );
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I (trace_id)',
    partition_name || '_trace_idx',
    partition_name
  );
  RAISE NOTICE 'Ensured partition table % for % to %', partition_name, start_date, end_date;
END;
$$;

SELECT create_llm_requests_partition(current_date);
SELECT create_llm_requests_partition((current_date + interval '1 month')::date);

CREATE INDEX IF NOT EXISTS llm_requests_project_created_idx
  ON llm_requests (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS llm_requests_project_model_created_idx
  ON llm_requests (project_id, model, created_at DESC);

CREATE INDEX IF NOT EXISTS llm_requests_trace_idx
  ON llm_requests (trace_id);

CREATE INDEX IF NOT EXISTS llm_requests_errors_idx
  ON llm_requests (project_id, created_at DESC)
  WHERE status_code >= 400;
