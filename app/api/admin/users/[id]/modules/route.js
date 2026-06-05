import { NextResponse } from 'next/server';

import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { ADMIN_MANAGE_MODULE_KEYS } from '@/app/lib/modules';
import {
  getUserModulePermissions,
  setUserModulePermissions,
} from '@/app/lib/module-permissions';

export async function GET(_request, { params }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    const users = await query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [id]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    const user = users[0];
    const modulePermissions = await getUserModulePermissions(user.id, user.role);

    return NextResponse.json({
      moduleKeys: ADMIN_MANAGE_MODULE_KEYS,
      modulePermissions,
    });
  } catch (error) {
    console.error('Get user modules error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const modules = body?.modules || {};

    const users = await query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [id]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    const user = users[0];
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'ไม่สามารถปิดโมดูลของแอดมินได้' }, { status: 400 });
    }

    const normalizedModules = Object.fromEntries(
      Object.entries(modules)
        .filter(([key]) => ADMIN_MANAGE_MODULE_KEYS.includes(key))
        .map(([key, value]) => [key, Boolean(value)]),
    );

    await setUserModulePermissions(user.id, normalizedModules, session.userId);

    const modulePermissions = await getUserModulePermissions(user.id, user.role);

    await writeAuditLog({
      session,
      action: 'update_permissions',
      entityType: 'user',
      entityId: user.id,
      summary: `อัปเดตสิทธิ์โมดูลผู้ใช้ ${user.id}`,
      metadata: { modules: normalizedModules },
    });

    return NextResponse.json({
      success: true,
      modulePermissions,
    });
  } catch (error) {
    console.error('Update user modules error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
