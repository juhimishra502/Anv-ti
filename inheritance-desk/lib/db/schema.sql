-- Inheritance Desk — Neon (Postgres) schema.
-- Applied by scripts/apply-schema.mjs (reads this file, runs each statement).
-- Full schema: all prior sqlite migrations folded into final table shapes.
--
-- Access model: the app connects as a single trusted server-side role via
-- DATABASE_URL. There is no public/anon client, so per-case authorization is
-- enforced in application code (repo.ts) via the session + family membership,
-- not via Postgres RLS. Columns use text for ISO timestamps and integer (0/1)
-- for booleans, matching the application's existing types. Safe to re-run.

CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,
  email         text UNIQUE,
  display_name  text NOT NULL,
  is_demo       integer NOT NULL DEFAULT 1,
  auth_method   text NOT NULL DEFAULT 'demo',
  created_at    text NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id          text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  text NOT NULL,
  expires_at  text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS language_preferences (
  user_id       text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ui_language   text NOT NULL DEFAULT 'en',
  voice_enabled integer NOT NULL DEFAULT 0,
  low_bandwidth integer NOT NULL DEFAULT 0,
  updated_at    text NOT NULL
);

CREATE TABLE IF NOT EXISTS consents (
  id          text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  granted     integer NOT NULL,
  recorded_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS families (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  created_by  text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  text NOT NULL
);

CREATE TABLE IF NOT EXISTS family_members (
  id           text PRIMARY KEY,
  family_id    text NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'coordinator',
  permissions  text NOT NULL DEFAULT 'full',
  invited_by   text REFERENCES users(id),
  created_at   text NOT NULL,
  UNIQUE(family_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);

CREATE TABLE IF NOT EXISTS cases (
  id          text PRIMARY KEY,
  family_id   text NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by  text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  status      text NOT NULL DEFAULT 'intake',
  created_at  text NOT NULL,
  updated_at  text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cases_family ON cases(family_id);
-- The questionnaire schema version and an answer-snapshot version (hash) recorded
-- at the moment a roadmap is generated, so a roadmap is traceable to its inputs.
ALTER TABLE cases ADD COLUMN IF NOT EXISTS questionnaire_version text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS answer_version text;

CREATE TABLE IF NOT EXISTS deceased_persons (
  id                     text PRIMARY KEY,
  case_id                text NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  full_name              text,
  residence_state        text,
  residence_district     text,
  death_state            text,
  death_district         text,
  death_date             text,
  death_registered       text,
  death_certificate      text,
  will_status            text,
  certificate_copies     text,
  will_registered        text,
  executor_present       text,
  probate_status         text,
  dispute_status         text,
  applicant_relationship text,
  nri_status             text,
  updated_at             text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deceased_case ON deceased_persons(case_id);
-- Expanded schema-driven questionnaire: the full conditional answer set is stored as
-- JSON (the typed columns above remain the engine's inputs), tagged with the schema
-- version that produced it. Safe to re-run.
ALTER TABLE deceased_persons ADD COLUMN IF NOT EXISTS answers_json text;
ALTER TABLE deceased_persons ADD COLUMN IF NOT EXISTS questionnaire_version text;

-- Registry of questionnaire schema versions (one row per published version).
CREATE TABLE IF NOT EXISTS questionnaire_schemas (
  version     text PRIMARY KEY,
  schema_json text NOT NULL,
  created_at  text NOT NULL
);

CREATE TABLE IF NOT EXISTS heirs (
  id            text PRIMARY KEY,
  case_id       text NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  full_name     text,
  relationship  text,
  is_minor      integer NOT NULL DEFAULT 0,
  is_claimant   integer NOT NULL DEFAULT 0,
  notes         text,
  created_at    text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_heirs_case ON heirs(case_id);

CREATE TABLE IF NOT EXISTS assets (
  id              text PRIMARY KEY,
  case_id         text NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  asset_type      text NOT NULL,
  service         text NOT NULL,
  label           text,
  institution     text,
  nominee_status  text,
  holding_mode    text,
  record_type     text,
  authority       text,
  scheme          text,
  created_at      text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assets_case ON assets(case_id);
-- Database-selected institution (id from the institutions table) and the full
-- per-asset sub-questionnaire answers (JSON). The typed columns above remain the
-- engine's inputs; details_json holds everything the asset wizard collects.
ALTER TABLE assets ADD COLUMN IF NOT EXISTS institution_id text;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS details_json text;

CREATE TABLE IF NOT EXISTS asset_locations (
  id                  text PRIMARY KEY,
  asset_id            text NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  state_code          text,
  district            text,
  municipality        text,
  tehsil_taluk        text,
  village_ward        text,
  property_identifier text,
  created_at          text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_asset_locations_asset ON asset_locations(asset_id);

CREATE TABLE IF NOT EXISTS roadmap_steps (
  id                    text PRIMARY KEY,
  case_id               text NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  asset_id              text REFERENCES assets(id) ON DELETE CASCADE,
  procedure_id          text,
  service               text NOT NULL,
  title                 text NOT NULL,
  requirement           text NOT NULL DEFAULT 'conditional',
  engine_status         text NOT NULL,
  completeness          text NOT NULL DEFAULT 'orientation_only',
  execution_available   integer NOT NULL DEFAULT 0,
  derived_done          integer NOT NULL DEFAULT 0,
  payload               text NOT NULL,
  user_status           text NOT NULL DEFAULT 'not_started',
  submitted_at          text,
  office                text,
  ack_number            text,
  method                text,
  follow_up_date        text,
  notes                 text,
  sort_order            integer NOT NULL DEFAULT 0,
  created_at            text NOT NULL,
  updated_at            text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_roadmap_case ON roadmap_steps(case_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id            text PRIMARY KEY,
  actor_user_id text,
  case_id       text,
  action        text NOT NULL,
  detail        text,
  created_at    text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_case ON audit_events(case_id);

CREATE TABLE IF NOT EXISTS aadhaar_verifications (
  id             text PRIMARY KEY,
  nonce_hash     text NOT NULL,
  provider       text NOT NULL,
  status         text NOT NULL,
  aadhaar_last4  text,
  masked_mobile  text,
  attempts       integer NOT NULL DEFAULT 0,
  user_id        text REFERENCES users(id) ON DELETE SET NULL,
  created_at     text NOT NULL,
  expires_at     text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_aadhaar_status ON aadhaar_verifications(status);

-- Jurisdictions: official Local Government Directory (LGD) administrative areas.
-- `code` is the primary key used everywhere as a stable geography key; for
-- LGD-sourced rows it equals the LGD code. Case/asset records store this code,
-- never a display name. Levels form the hierarchy:
--   state -> district -> subdistrict (tehsil/taluk) -> village | local_body
-- Historical names live in jurisdiction_aliases (searchable); the row `name` is
-- always the CURRENT official name (Prayagraj, not Allahabad).
CREATE TABLE IF NOT EXISTS jurisdictions (
  code           text PRIMARY KEY,
  level          text NOT NULL,
  parent_code    text,
  name           text NOT NULL,
  name_local     text,
  aliases        text NOT NULL DEFAULT '[]',
  lgd_code       text,          -- official LGD code (numeric string) when known
  parent_lgd_code text,         -- official parent LGD code (as published)
  state_code     text,          -- owning state/UT (2-letter app code, e.g. UP)
  active         integer NOT NULL DEFAULT 1,
  effective_date text,          -- LGD effective/as-of date
  source         text,          -- 'lgd' | 'lgd-state-codes' | 'reference-dataset' | ...
  version        text,          -- source/import version
  import_date    text,          -- when this row was ingested
  import_run_id  text,
  review_date    text
);
-- Backfill columns on databases created before the LGD expansion (safe to re-run).
-- These run before the indexes below so a pre-existing table gains the columns first.
ALTER TABLE jurisdictions ADD COLUMN IF NOT EXISTS parent_lgd_code text;
ALTER TABLE jurisdictions ADD COLUMN IF NOT EXISTS state_code text;
ALTER TABLE jurisdictions ADD COLUMN IF NOT EXISTS active integer NOT NULL DEFAULT 1;
ALTER TABLE jurisdictions ADD COLUMN IF NOT EXISTS effective_date text;
ALTER TABLE jurisdictions ADD COLUMN IF NOT EXISTS import_date text;
ALTER TABLE jurisdictions ADD COLUMN IF NOT EXISTS import_run_id text;
CREATE INDEX IF NOT EXISTS idx_jur_parent ON jurisdictions(parent_code);
CREATE INDEX IF NOT EXISTS idx_jur_level ON jurisdictions(level);
CREATE INDEX IF NOT EXISTS idx_jur_state ON jurisdictions(state_code);

-- Historical / alternate names, searchable. e.g. Allahabad -> Prayagraj,
-- Faizabad -> Ayodhya. `kind` distinguishes historical vs transliteration vs local.
CREATE TABLE IF NOT EXISTS jurisdiction_aliases (
  id              text PRIMARY KEY,
  jurisdiction_code text NOT NULL REFERENCES jurisdictions(code) ON DELETE CASCADE,
  alias           text NOT NULL,
  alias_norm      text NOT NULL,   -- normalized for search
  kind            text NOT NULL DEFAULT 'historical',
  source          text,
  created_at      text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jur_alias_code ON jurisdiction_aliases(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_jur_alias_norm ON jurisdiction_aliases(alias_norm);

-- Non-tree relationships between jurisdictions (e.g. a village mapped to both a
-- revenue subdistrict and an urban local body, or a merger/split lineage).
CREATE TABLE IF NOT EXISTS jurisdiction_relationships (
  id           text PRIMARY KEY,
  from_code    text NOT NULL REFERENCES jurisdictions(code) ON DELETE CASCADE,
  to_code      text NOT NULL REFERENCES jurisdictions(code) ON DELETE CASCADE,
  relation     text NOT NULL,   -- 'mapped_to' | 'renamed_from' | 'merged_into' | 'split_from'
  source       text,
  created_at   text NOT NULL,
  UNIQUE(from_code, to_code, relation)
);
CREATE INDEX IF NOT EXISTS idx_jur_rel_from ON jurisdiction_relationships(from_code);

-- One row per import run (full or modification), for auditability and counts.
CREATE TABLE IF NOT EXISTS jurisdiction_import_runs (
  id             text PRIMARY KEY,
  mode           text NOT NULL,   -- 'full' | 'modification'
  source         text NOT NULL,
  source_version text,
  source_file    text,
  started_at     text NOT NULL,
  finished_at    text,
  status         text NOT NULL DEFAULT 'running',  -- running | completed | failed
  counts         text,            -- JSON: per-level imported/updated/skipped
  errors         text,            -- JSON: validation issues (duplicates, missing parents, cycles, inactive)
  notes          text
);

-- Institutions: database-backed selectors seeded from official regulator lists
-- (RBI, IRDAI, AMFI, SEBI, DPs, RTAs, EPFO, PFRDA/NPS, India Post, IEPF). Existence
-- in a regulator list does NOT imply a verified claim pack — that is tracked
-- separately in institution_claim_packs.
CREATE TABLE IF NOT EXISTS institutions (
  id            text PRIMARY KEY,
  category      text NOT NULL,   -- bank | insurer | amc | sebi_intermediary | depository | rta | epfo | nps | india_post | iepf
  legal_name    text NOT NULL,
  short_name    text,
  regulator     text NOT NULL,   -- RBI | IRDAI | AMFI | SEBI | PFRDA | EPFO | DoP | MCA
  identifier    text,            -- registration/licence no. where published
  active        integer NOT NULL DEFAULT 1,
  source        text NOT NULL,   -- e.g. 'seed-public-list' | 'regulator-import'
  source_version text,
  created_at    text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inst_category ON institutions(category);
CREATE INDEX IF NOT EXISTS idx_inst_active ON institutions(active);

CREATE TABLE IF NOT EXISTS institution_aliases (
  id             text PRIMARY KEY,
  institution_id text NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  alias          text NOT NULL,
  alias_norm     text NOT NULL,
  created_at     text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inst_alias_inst ON institution_aliases(institution_id);
CREATE INDEX IF NOT EXISTS idx_inst_alias_norm ON institution_aliases(alias_norm);

CREATE TABLE IF NOT EXISTS institution_branches (
  id             text PRIMARY KEY,
  institution_id text NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name           text NOT NULL,
  ifsc           text,
  state_code     text,
  district       text,
  address        text,
  active         integer NOT NULL DEFAULT 1,
  created_at     text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inst_branch_inst ON institution_branches(institution_id);

-- A verified, versioned claim pack for an institution (documents/steps). Absence of
-- a row here means "no verified claim pack", even when the institution exists.
CREATE TABLE IF NOT EXISTS institution_claim_packs (
  id             text PRIMARY KEY,
  institution_id text NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  service        text NOT NULL,
  current_version text,
  status         text NOT NULL DEFAULT 'none',  -- none | draft | verified
  created_at     text NOT NULL,
  UNIQUE(institution_id, service)
);

CREATE TABLE IF NOT EXISTS institution_claim_pack_versions (
  id             text PRIMARY KEY,
  claim_pack_id  text NOT NULL REFERENCES institution_claim_packs(id) ON DELETE CASCADE,
  version        text NOT NULL,
  content_json   text NOT NULL,
  verified       integer NOT NULL DEFAULT 0,
  source_url     text,
  verified_on    text,
  created_at     text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inst_pack_ver ON institution_claim_pack_versions(claim_pack_id);

-- User-raised requests for an institution not found in the directory.
CREATE TABLE IF NOT EXISTS institution_verification_requests (
  id             text PRIMARY KEY,
  requested_by   text REFERENCES users(id) ON DELETE SET NULL,
  case_id        text REFERENCES cases(id) ON DELETE SET NULL,
  category       text,
  entered_name   text NOT NULL,
  details        text,
  status         text NOT NULL DEFAULT 'open',  -- open | resolved | rejected
  created_at     text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inst_vr_status ON institution_verification_requests(status);

CREATE TABLE IF NOT EXISTS translations (
  id          text PRIMARY KEY,
  locale      text NOT NULL,
  version     text NOT NULL,
  source_hash text NOT NULL,
  translated  text NOT NULL,
  created_at  text NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id            text PRIMARY KEY,
  case_id       text NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by   text REFERENCES users(id) ON DELETE SET NULL,
  label         text,
  original_name text,
  mime          text NOT NULL,
  size          integer NOT NULL,
  ext           text NOT NULL,
  scan_status   text NOT NULL DEFAULT 'not_scanned',
  created_at    text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);

-- Document file bytes, stored in the database (base64) so uploads survive a
-- serverless/ephemeral-filesystem deploy. Kept in a separate table from the
-- metadata so document listings stay light. Cascade-deletes with the metadata row.
CREATE TABLE IF NOT EXISTS document_blobs (
  id          text PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  content_b64 text NOT NULL,
  created_at  text NOT NULL
);
