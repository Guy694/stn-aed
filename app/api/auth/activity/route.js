import { NextResponse } from 'next/server';

import { deleteSession, getSession, refreshSession } from '@/app/lib/session';

export async function POST() {
  const session = await getSession();

  if (!session) {
    await deleteSession();
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await refreshSession(session);
  return NextResponse.json({ success: true });
}
