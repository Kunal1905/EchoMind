CREATE TABLE "processed_payments" (
	"payment_id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"plan" varchar NOT NULL,
	"minutes_credited" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "memory_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "memory_consent_at" timestamp;