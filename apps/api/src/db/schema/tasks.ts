import { pgTable, uuid, text, integer, boolean, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  quietHoursStart: varchar('quiet_hours_start', { length: 5 }).default('22:00').notNull(),
  quietHoursEnd: varchar('quiet_hours_end', { length: 5 }).default('08:00').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull(),
  taskType: text('task_type', { enum: ['deep_work', 'admin', 'quick'] }).default('admin').notNull(),
  tags: text('tags').array().default([]).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  dueAt: timestamp('due_at'),
  timezoneMode: text('timezone_mode', { enum: ['floating', 'fixed'] }).default('floating').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  hlcTimestamp: text('hlc_timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
