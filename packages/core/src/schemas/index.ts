import { z } from 'zod'

export const TimezoneModeSchema = z.enum(['floating', 'fixed'])

export const TaskTypeSchema = z.enum(['deep_work', 'admin', 'quick'])

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  duration_minutes: z.number().int().positive(),
  task_type: TaskTypeSchema.default('admin'),
  tags: z.array(z.string()).max(10).default([]),
  is_completed: z.boolean().default(false),
  due_at: z.string().datetime().nullable().optional(),
  timezone_mode: TimezoneModeSchema.default('floating'),
  timezone: z.string().default('UTC'),
  hlc_timestamp: z.string(), // e.g., "001740000000000_0000001_node-id"
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable().optional(),
})

export type Task = z.infer<typeof TaskSchema>

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  quiet_hours_start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('22:00'),
  quiet_hours_end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('08:00'),
  timezone: z.string().default('UTC'),
})

export type User = z.infer<typeof UserSchema>
