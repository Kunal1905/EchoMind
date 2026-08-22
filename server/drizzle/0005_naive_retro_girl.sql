ALTER TABLE "users_table" ALTER COLUMN "minutes_remaining" SET DEFAULT 5;--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "minutes_total" SET DEFAULT 5;--> statement-breakpoint
UPDATE "users_table"
SET
  "minutes_remaining" = GREATEST(5 - GREATEST("minutes_total" - "minutes_remaining", 0), 0),
  "minutes_total" = 5
WHERE "plan" = 'free';
