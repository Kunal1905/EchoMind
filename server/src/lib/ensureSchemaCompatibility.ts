import { sql } from "drizzle-orm";
import { db } from "../config/db";

export async function ensureSchemaCompatibility() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "processed_payments" (
      "payment_id" varchar PRIMARY KEY NOT NULL,
      "user_id" varchar NOT NULL,
      "plan" varchar NOT NULL,
      "minutes_credited" integer NOT NULL,
      "amount_paid" integer,
      "currency" varchar(3) DEFAULT 'INR',
      "payment_method" varchar,
      "card_last4" varchar(4),
      "billing_email" varchar,
      "created_at" timestamp DEFAULT now()
    )
  `);

  await db.execute(sql`ALTER TABLE "processed_payments" ADD COLUMN IF NOT EXISTS "amount_paid" integer`);
  await db.execute(sql`ALTER TABLE "processed_payments" ADD COLUMN IF NOT EXISTS "currency" varchar(3) DEFAULT 'INR'`);
  await db.execute(sql`ALTER TABLE "processed_payments" ADD COLUMN IF NOT EXISTS "payment_method" varchar`);
  await db.execute(sql`ALTER TABLE "processed_payments" ADD COLUMN IF NOT EXISTS "card_last4" varchar(4)`);
  await db.execute(sql`ALTER TABLE "processed_payments" ADD COLUMN IF NOT EXISTS "billing_email" varchar`);

  await db.execute(sql`
    ALTER TABLE "users_table"
    ADD COLUMN IF NOT EXISTS "plan" varchar DEFAULT 'free' NOT NULL
  `);
  await db.execute(sql`
    ALTER TABLE "users_table"
    ADD COLUMN IF NOT EXISTS "minutes_remaining" integer DEFAULT 10 NOT NULL
  `);
  await db.execute(sql`
    ALTER TABLE "users_table"
    ALTER COLUMN "minutes_remaining" SET DEFAULT 10
  `);
  await db.execute(sql`
    ALTER TABLE "users_table"
    ADD COLUMN IF NOT EXISTS "minutes_total" integer DEFAULT 10 NOT NULL
  `);
  await db.execute(sql`
    ALTER TABLE "users_table"
    ALTER COLUMN "minutes_total" SET DEFAULT 10
  `);
  await db.execute(sql`
    ALTER TABLE "users_table"
    ADD COLUMN IF NOT EXISTS "minute_allowance_reset_at" timestamp DEFAULT now() NOT NULL
  `);
  await db.execute(sql`
    ALTER TABLE "users_table"
    ADD COLUMN IF NOT EXISTS "memory_consent" boolean DEFAULT false NOT NULL
  `);
  await db.execute(sql`
    ALTER TABLE "users_table"
    ADD COLUMN IF NOT EXISTS "memory_consent_at" timestamp
  `);
}
