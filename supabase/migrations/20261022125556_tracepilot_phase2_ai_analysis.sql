/*
# TracePilot Phase 2 — AI Analysis Runs + Provenance Flags

## Overview
Extends the Phase 1 schema to support AI-generated investigation analyses.
Adds an `ai_analysis_runs` table to persist full analysis results with provenance,
and adds `is_ai` boolean flags to `findings` and `action_tasks` so AI-generated
records can be distinguished from demo and user-created records.

## New Tables

1. **ai_analysis_runs** — Persists each AI investigation run with full provenance.
   - `id` (uuid PK)
   - `incident_id` (uuid FK → incidents, cascade delete)
   - `provider` (text) — e.g. "nebius"
   - `model` (text) — e.g. "nvidia/Nemotron-3_5-Lightning"
   - `status` (text) — "success" | "error"
   - `summary` (text, nullable) — AI-generated incident assessment
   - `result_json` (jsonb, nullable) — full validated AI response
   - `error_message` (text, nullable) — diagnostic on failure (no secrets)
   - `elapsed_ms` (integer, nullable) — measured latency
   - `created_at` (timestamptz, default now())

## Modified Tables

1. **findings** — Added `is_ai` boolean column (default false).
   Distinguishes AI-generated findings from demo and user-created findings.

2. **action_tasks** — Added `is_ai` boolean column (default false).
   Distinguishes AI-generated tasks from demo and user-created tasks.

## Security
- RLS enabled on `ai_analysis_runs` (same single-tenant pattern as Phase 1).
- Grant SELECT, INSERT, UPDATE, DELETE to `anon, authenticated`.
- Permissive policies matching existing single-tenant architecture.
- `service_role` also granted CRUD for edge function access (server-side writes).

## Notes
1. `is_ai` defaults to false so all existing demo and user records are unaffected.
2. `result_json` stores the full validated AI JSON for audit and comparison.
3. `error_message` stores safe diagnostics only — never API keys or auth headers.
4. `elapsed_ms` is only set when the timing was actually measured.
*/

-- ============================================================================
-- ai_analysis_runs
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_analysis_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id   uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  provider      text NOT NULL DEFAULT 'nebius',
  model         text NOT NULL,
  status        text NOT NULL DEFAULT 'success',
  summary       text,
  result_json   jsonb,
  error_message text,
  elapsed_ms    integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_analysis_runs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_analysis_runs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_analysis_runs TO service_role;

DROP POLICY IF EXISTS "anon_select_ai_runs" ON ai_analysis_runs;
CREATE POLICY "anon_select_ai_runs" ON ai_analysis_runs FOR SELECT
  TO anon, authenticated, service_role USING (true);

DROP POLICY IF EXISTS "anon_insert_ai_runs" ON ai_analysis_runs;
CREATE POLICY "anon_insert_ai_runs" ON ai_analysis_runs FOR INSERT
  TO anon, authenticated, service_role WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ai_runs" ON ai_analysis_runs;
CREATE POLICY "anon_update_ai_runs" ON ai_analysis_runs FOR UPDATE
  TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ai_runs" ON ai_analysis_runs;
CREATE POLICY "anon_delete_ai_runs" ON ai_analysis_runs FOR DELETE
  TO anon, authenticated, service_role USING (true);

-- ============================================================================
-- Add is_ai to findings
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'findings' AND column_name = 'is_ai'
  ) THEN
    ALTER TABLE findings ADD COLUMN is_ai boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- Add is_ai to action_tasks
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_tasks' AND column_name = 'is_ai'
  ) THEN
    ALTER TABLE action_tasks ADD COLUMN is_ai boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ai_runs_incident_id ON ai_analysis_runs(incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_created_at ON ai_analysis_runs(created_at DESC);