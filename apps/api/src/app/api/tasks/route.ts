import { NextResponse } from 'next/server';
import { db } from '../../lib/db.js';
import { tasks } from '../../db/schema/tasks.js';
import { getSessionUser } from '../../lib/auth.js';
import { eq, and, isNull } from 'drizzle-orm';
import { syncTask } from '../../lib/sync.js';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await db.query.tasks.findMany({
    where: and(eq(tasks.userId, user.id), isNull(tasks.deletedAt)),
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientTask = await req.json();
  const success = await syncTask(user.id, clientTask);

  if (success) {
    return NextResponse.json({ status: 'ok' });
  } else {
    return NextResponse.json({ status: 'ignored', reason: 'stale' }, { status: 409 });
  }
}
