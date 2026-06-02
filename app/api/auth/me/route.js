import { NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';
import { getUserModulePermissions } from '@/app/lib/module-permissions';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const modulePermissions = await getUserModulePermissions(session.userId, session.role);

  return NextResponse.json({
    userId: session.userId,
    username: session.username,
    fullName: session.fullName,
    role: session.role,
    modulePermissions,
  });
}
