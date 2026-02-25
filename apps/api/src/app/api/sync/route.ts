import { NextResponse } from 'next/server';
import { db } from '../../../lib/db.js';
import { tasks } from '../../../db/schema/tasks.js';
import { getSessionUser } from '../../../lib/auth.js';
import { HLC } from '@packages/core';
import { eq, and, gt, sql } from 'drizzle-orm';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientTasks, lastSyncTimestamp } = await req.json();

  // 1. Process Client Updates (Merge)
  for (const clientTask of clientTasks) {
    const existing = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, clientTask.id), eq(tasks.userId, user.id)),
    });

    if (!existing || HLC.compare(clientTask.hlcTimestamp, existing.hlcTimestamp) > 0) {
      await db.insert(tasks).values({
        ...clientTask,
        userId: user.id,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: tasks.id,
        set: {
          ...clientTask,
          updatedAt: new Date(),
        },
      });
    }
  }

  // 2. Fetch Server Updates Since lastSyncTimestamp
  const serverUpdates = await db.query.tasks.findMany({
    where: and(
      eq(tasks.userId, user.id),
      lastSyncTimestamp ? gt(tasks.hlcTimestamp, lastSyncTimestamp) : undefined
    ),
  });

  return NextResponse.json({ serverUpdates });
}
