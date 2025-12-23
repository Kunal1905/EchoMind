import { pgTable, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users_table', {
  id: varchar('id').primaryKey(), 
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  freeTrialUsed: integer('free_trial_used').default(0),
  freeTrialLimit: integer('free_trial_limit').default(3),
  premiumCallsRemaining: integer('premium_calls_remaining').default(0).notNull(),
  premiumCallsTotal: integer('premium_calls_total').default(0).notNull(),
});

export const SessionChatTable = pgTable('history', {
  sessionId: varchar('session_id').primaryKey(),
  createdBy: varchar('created_by'),
  notes: text('notes'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
export type InsertSession = typeof SessionChatTable.$inferInsert;
export type SelectSession = typeof SessionChatTable.$inferSelect;