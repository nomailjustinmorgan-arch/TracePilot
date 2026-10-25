/*
# TracePilot Phase 1 — Core Schema

## Overview
Creates the foundational tables for the TracePilot incident investigation platform.
This is a single-tenant application (no auth in Phase 1), so all policies use
`TO anon, authenticated` to allow the anon-key frontend client to read and write.

## New Tables

1. **incidents** — The top-level investigation record.
   - `id` (uuid PK)
   - `title` (text, not null)
   - `description` (text, not null)
   - `affected_service` (text, not null)
   - `environment` (text, default 'Unknown')
   - `severity` (text, default 'Medium') — Low | Medium | High | Critical
   - `status` (text, default 'Draft') — Draft | Investigating | Action Required | Resolved
   - `start_time` (timestamptz, nullable) — when the incident was first detected
   - `is_demo` (boolean, default false) — flags seeded demonstration data
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())

2. **evidence** — Evidence ledger entries associated with an incident.
   - `id` (uuid PK)
   - `incident_id` (uuid FK → incidents, cascade delete)
   - `source_type` (text, not null) — note | reference_url
   - `title` (text, not null)
   - `content` (text, nullable)
   - `source_url` (text, nullable)
   - `verification_state` (text, default 'user_provided') — user_provided | externally_verified
   - `is_demo` (boolean, default false)
   - `created_at` (timestamptz, default now())

3. **findings** — Classified findings for an investigation.
   - `id` (uuid PK)
   - `incident_id` (uuid FK → incidents, cascade delete)
   - `title` (text, not null)
   - `description` (text, not null)
   - `classification` (text, not null) — observed | inferred | unknown
   - `confidence_explanation` (text, nullable)
   - `evidence_ids` (uuid[], default '{}') — references to supporting evidence
   - `is_demo` (boolean, default false)
   - `created_at` (timestamptz, default now())

4. **action_tasks** — Remediation/action plan tasks.
   - `id` (uuid PK)
   - `incident_id` (uuid FK → incidents, cascade delete)
   - `title` (text, not null)
   - `rationale` (text, nullable)
   - `priority` (text, default 'Medium') — Low | Medium | High
   - `status` (text, default 'Open') — Open | In Progress | Complete
   - `verification_steps` (text, nullable)
   - `is_demo` (boolean, default false)
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())

## Security
- RLS enabled on all tables.
- Grants: SELECT, INSERT, UPDATE, DELETE to `anon, authenticated` on all tables (single-tenant, no auth).
- Policies: permissive `USING (true)` / `WITH CHECK (true)` since this is an intentionally shared single-tenant app with no sign-in.

## Notes
1. `updated_at` is managed by the application layer (explicit updates).
2. `evidence_ids` on findings is a simple array of UUIDs — no FK constraint, to keep evidence deletion non-blocking.
3. All tables use `gen_random_uuid()` for stable IDs.
*/

-- ============================================================================
-- incidents
-- ============================================================================
CREATE TABLE IF NOT EXISTS incidents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text NOT NULL,
  affected_service text NOT NULL,
  environment     text NOT NULL DEFAULT 'Unknown',
  severity        text NOT NULL DEFAULT 'Medium',
  status          text NOT NULL DEFAULT 'Draft',
  start_time      timestamptz,
  is_demo         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON incidents TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_incidents" ON incidents;
CREATE POLICY "anon_select_incidents" ON incidents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_incidents" ON incidents;
CREATE POLICY "anon_insert_incidents" ON incidents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_incidents" ON incidents;
CREATE POLICY "anon_update_incidents" ON incidents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_incidents" ON incidents;
CREATE POLICY "anon_delete_incidents" ON incidents FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================================
-- evidence
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id        uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  source_type        text NOT NULL,
  title              text NOT NULL,
  content            text,
  source_url         text,
  verification_state text NOT NULL DEFAULT 'user_provided',
  is_demo            boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON evidence TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_evidence" ON evidence;
CREATE POLICY "anon_select_evidence" ON evidence FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_evidence" ON evidence;
CREATE POLICY "anon_insert_evidence" ON evidence FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_evidence" ON evidence;
CREATE POLICY "anon_update_evidence" ON evidence FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_evidence" ON evidence;
CREATE POLICY "anon_delete_evidence" ON evidence FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================================
-- findings
-- ============================================================================
CREATE TABLE IF NOT EXISTS findings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  description           text NOT NULL,
  classification        text NOT NULL,
  confidence_explanation text,
  evidence_ids          uuid[] NOT NULL DEFAULT '{}',
  is_demo               boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON findings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_findings" ON findings;
CREATE POLICY "anon_select_findings" ON findings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_findings" ON findings;
CREATE POLICY "anon_insert_findings" ON findings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_findings" ON findings;
CREATE POLICY "anon_update_findings" ON findings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_findings" ON findings;
CREATE POLICY "anon_delete_findings" ON findings FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================================
-- action_tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS action_tasks (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id        uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  title              text NOT NULL,
  rationale          text,
  priority           text NOT NULL DEFAULT 'Medium',
  status             text NOT NULL DEFAULT 'Open',
  verification_steps text,
  is_demo            boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE action_tasks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON action_tasks TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_action_tasks" ON action_tasks;
CREATE POLICY "anon_select_action_tasks" ON action_tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_action_tasks" ON action_tasks;
CREATE POLICY "anon_insert_action_tasks" ON action_tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_action_tasks" ON action_tasks;
CREATE POLICY "anon_update_action_tasks" ON action_tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_action_tasks" ON action_tasks;
CREATE POLICY "anon_delete_action_tasks" ON action_tasks FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_evidence_incident_id ON evidence(incident_id);
CREATE INDEX IF NOT EXISTS idx_findings_incident_id ON findings(incident_id);
CREATE INDEX IF NOT EXISTS idx_action_tasks_incident_id ON action_tasks(incident_id);
CREATE INDEX IF NOT EXISTS idx_incidents_updated_at ON incidents(updated_at DESC);