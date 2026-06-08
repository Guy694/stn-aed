import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { ALL_MODULE_PERMISSION_KEYS } from '@/app/lib/modules';
import {
  ensureModulePermissionTable,
  getUserModulePermissions,
  setUserModulePermissions,
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
      moduleKeys: ALL_MODULE_PERMISSION_KEYS,
      users: withPermissions,
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

export async function POST(request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  try {
    const body = await request.json();
    const username = String(body?.username || '').trim();
    const fullName = String(body?.full_name || '').trim();
    const password = String(body?.password || '');
    const role = body?.role === 'admin' ? 'admin' : 'user';

    if (!username || !fullName || !password) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้ ชื่อ-นามสกุล และรหัสผ่าน' }, { status: 400 });
    }

    if (username.length > 120 || fullName.length > 255 || password.length < 6) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง (รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร)' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (username, full_name, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [username, fullName, passwordHash, role],
    );

    const userId = result.insertId;

    if (role !== 'admin') {
      await setUserModulePermissions(
        userId,
        Object.fromEntries(ALL_MODULE_PERMISSION_KEYS.map((key) => [key, false])),
        session.userId,
      );
    }

    const users = await query(
      `SELECT id, username, full_name, role
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId],
    );

    const createdUser = users[0];

    await writeAuditLog({
      request,
      session,
      action: 'create',
      entityType: 'user',
      entityId: userId,
      summary: `เพิ่มผู้ใช้งาน ${username}`,
      metadata: { role },
    });

    return NextResponse.json({
      user: {
        ...createdUser,
        module_permissions: await getUserModulePermissions(createdUser.id, createdUser.role),
      },
    }, { status: 201 });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' }, { status: 409 });
    }

    console.error('Create admin user error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
