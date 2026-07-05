-- Drop old table if it exists (from old schema)
DROP TABLE IF EXISTS "users_table";

-- Users table
CREATE TABLE "users_table" (
  "id"               VARCHAR PRIMARY KEY,
  "name"             TEXT          NOT NULL,
  "email"            TEXT          NOT NULL DEFAULT '',
  "created_at"       TIMESTAMP     DEFAULT NOW(),
  "plan"             VARCHAR(20)   NOT NULL DEFAULT 'free',
  "minutes_remaining" INTEGER      NOT NULL DEFAULT 5,
  "minutes_total"    INTEGER       NOT NULL DEFAULT 0
);

-- Sessions / history table
CREATE TABLE "history" (
  "session_id"   VARCHAR    PRIMARY KEY,
  "created_by"   VARCHAR    NOT NULL,
  "notes"        TEXT,
  "summary"      TEXT,
  "duration_sec" INTEGER    DEFAULT 0,
  "created_at"   TIMESTAMP  DEFAULT NOW()
);

CREATE INDEX "history_created_by_idx" ON "history" ("created_by");

-- Mood entries
CREATE TABLE "mood_entries" (
  "id"          VARCHAR    PRIMARY KEY,
  "user_id"     VARCHAR    NOT NULL,
  "session_id"  VARCHAR,
  "mood_score"  INTEGER    NOT NULL,
  "created_at"  TIMESTAMP  DEFAULT NOW()
);

CREATE INDEX "mood_entries_user_id_idx" ON "mood_entries" ("user_id");