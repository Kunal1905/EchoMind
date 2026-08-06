import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users_table", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  plan: varchar("plan").default("free").notNull(),
  minutesRemaining: integer("minutes_remaining").default(10).notNull(),
  minutesTotal: integer("minutes_total").default(10).notNull(),
  minuteAllowanceResetAt: timestamp("minute_allowance_reset_at").defaultNow().notNull(),
  memoryConsent: boolean("memory_consent").default(false).notNull(),
  memoryConsentAt: timestamp("memory_consent_at"),
});

export const sessionChatTable = pgTable("history", {
  sessionId: varchar("session_id").primaryKey(),
  createdBy: varchar("created_by"),
  notes: text("notes"),
  summary: text("summary"),
  durationSec: integer("duration_sec").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moodEntriesTable = pgTable("mood_entries", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id"),
  moodScore: integer("mood_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ✅ Idempotency guard for the Razorpay webhook. Razorpay delivers webhooks
// at-least-once (retries on timeout/non-2xx), so "payment.captured" can
// arrive more than once for the same payment. paymentId is Razorpay's own
// payment.entity.id — globally unique per payment — as the primary key.
// The webhook does INSERT ... ON CONFLICT DO NOTHING and only credits
// minutes if its own insert wins the race, which makes double-crediting
// impossible even under concurrent/duplicate delivery.
export const processedPaymentsTable = pgTable("processed_payments", {
  paymentId: varchar("payment_id").primaryKey(),
  userId: varchar("user_id").notNull(),
  plan: varchar("plan").notNull(),
  minutesCredited: integer("minutes_credited").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
export type InsertSession = typeof sessionChatTable.$inferInsert;
export type SelectSession = typeof sessionChatTable.$inferSelect;
export type InsertMoodEntry = typeof moodEntriesTable.$inferInsert;
export type SelectMoodEntry = typeof moodEntriesTable.$inferSelect;
export type InsertProcessedPayment = typeof processedPaymentsTable.$inferInsert;
export type SelectProcessedPayment = typeof processedPaymentsTable.$inferSelect;
