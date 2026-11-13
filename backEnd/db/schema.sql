-- PostgreSQL schema for ResumeATS.
-- Runs automatically on every server start (all statements are idempotent).

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_name     VARCHAR(160),
  resume_text     TEXT         NOT NULL,
  resume_file     JSONB,
  resume_asset    JSONB,
  job_description TEXT,
  score           SMALLINT     NOT NULL CHECK (score BETWEEN 0 AND 100),
  result          JSONB        NOT NULL,
  source          VARCHAR(20)  NOT NULL DEFAULT 'gemini',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_created
  ON analyses (user_id, created_at DESC);
