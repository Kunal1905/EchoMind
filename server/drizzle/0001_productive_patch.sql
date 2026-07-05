CREATE TABLE "mood_entries" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"session_id" varchar,
	"mood_score" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "history" (
	"session_id" varchar PRIMARY KEY NOT NULL,
	"created_by" varchar,
	"notes" text,
	"summary" text,
	"duration_sec" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users_table" DROP CONSTRAINT "users_table_email_unique";--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "plan" varchar DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "minutes_remaining" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "minutes_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" DROP COLUMN "age";