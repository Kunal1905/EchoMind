ALTER TABLE "users_table" ALTER COLUMN "minutes_remaining" SET DEFAULT 10;--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "minutes_total" SET DEFAULT 10;--> statement-breakpoint
ALTER TABLE "processed_payments" ADD COLUMN "amount_paid" integer;--> statement-breakpoint
ALTER TABLE "processed_payments" ADD COLUMN "currency" varchar(3) DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "processed_payments" ADD COLUMN "payment_method" varchar;--> statement-breakpoint
ALTER TABLE "processed_payments" ADD COLUMN "card_last4" varchar(4);--> statement-breakpoint
ALTER TABLE "processed_payments" ADD COLUMN "billing_email" varchar;
