import { NextResponse } from 'next/server';

import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { STAFF_MODULE_KEYS } from '@/app/lib/modules';
import {
  ensureModulePermissionTable,
  getUserModulePermissions,
} from '@/app/lib/module-permissions';

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    await ensureModulePermissionTable();

    const users = await query(
      `SELECT id, username, full_name, role
       FROM users
       ORDER BY role DESC, id ASC`,
    );

    const withPermissions = await Promise.all(
      users.map(async (user) => ({
        ...user,
        module_permissions: await getUserModulePermissions(user.id, user.role),
      })),
    );

    return NextResponse.json({
      moduleKeys: STAFF_MODULE_KEYS,
      users: withPermissions,
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
