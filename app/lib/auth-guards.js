import 'server-only';

import { NextResponse } from 'next/server';

import { getSession } from '@/app/lib/session';
import { isModuleEnabledForUser } from '@/app/lib/module-permissions';

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) return { response: unauthorizedResponse() };
  if (session.role !== 'admin') return { response: forbiddenResponse() };
  return { session };
}

export async function requireModuleAccess(moduleKey) {
  const session = await getSession();
  if (!session) return { response: unauthorizedResponse() };
  if (session.role === 'admin') return { session };

  const enabled = await isModuleEnabledForUser(session.userId, session.role, moduleKey);
  if (!enabled) return { response: forbiddenResponse() };

  return { session };
}
