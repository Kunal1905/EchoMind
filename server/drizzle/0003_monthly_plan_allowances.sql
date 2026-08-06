ALTER TABLE "users_table" ADD COLUMN IF NOT EXISTS "minute_allowance_reset_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "minutes_remaining" SET DEFAULT 10;--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "minutes_total" SET DEFAULT 10;--> statement-breakpoint
UPDATE "users_table"
SET
  "minutes_remaining" = GREATEST(10 - GREATEST("minutes_total" - "minutes_remaining", 0), 0),
  "minutes_total" = 10,
  "minute_allowance_reset_at" = now()
WHERE "plan" = 'free';--> statement-breakpoint
UPDATE "users_table"
SET
  "plan" = 'starter',
  "minutes_remaining" = 20,
  "minutes_total" = 20,
  "minute_allowance_reset_at" = now()
WHERE "plan" <> 'free';
