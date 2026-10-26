-- Visitor questions, kept 30 days for improving answers. No IP address, no email, no session id.
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  locale TEXT NOT NULL,
  question TEXT NOT NULL,
  tools TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL,
  knowledge_version TEXT NOT NULL,
  model TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS questions_created_at ON questions (created_at);

-- Daily caps. Visitor keys are salted hashes that rotate every day, never raw IPs.
CREATE TABLE IF NOT EXISTS counters (
  key TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, day)
);

-- Email verification codes for CV copies. Hashed, 10-minute lifetime, deleted once used.
CREATE TABLE IF NOT EXISTS codes (
  email_hash TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);

-- Small switches, e.g. pausing the model after OpenRouter reports the credit cap was reached.
CREATE TABLE IF NOT EXISTS state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
