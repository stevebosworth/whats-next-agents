import { db } from './db.js';
import { tasks } from '../db/schema/tasks.js';
import { HLC } from '@packages/core';
import { eq, and } from 'drizzle-orm';

/**
 * Syncs a single task with the database using HLC for conflict resolution.
 */
export async function syncTask(userId: string, clientTask: any) {
  const existing = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, clientTask.id), eq(tasks.userId, userId)),
  });

  if (!existing || HLC.compare(clientTask.hlcTimestamp, existing.hlcTimestamp) > 0) {
    // If it's a new task or the client's version is newer
    await db.insert(tasks).values({
      ...clientTask,
      userId,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: tasks.id,
      set: {
        ...clientTask,
        updatedAt: new Date(),
      },
    });
    return true; // Successfully updated or inserted
  }
  return false; // Ignored due to stale timestamp
}
