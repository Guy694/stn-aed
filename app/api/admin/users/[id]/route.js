import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';

export async function PUT(request, { params }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();

    const users = await query('SELECT id, username, full_name, role FROM users WHERE id = ? LIMIT 1', [id]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    const current = users[0];
    const username = body?.username !== undefined ? String(body.username || '').trim() : current.username;
    const fullName = body?.full_name !== undefined ? String(body.full_name || '').trim() : current.full_name;
    const nextRole = body?.role === 'admin' ? 'admin' : 'user';
    const password = body?.password !== undefined ? String(body.password || '') : '';

    if (!username || !fullName) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้และชื่อ-นามสกุล' }, { status: 400 });
    }

    if (password && password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    if (Number(id) === Number(session.userId) && nextRole !== 'admin') {
      return NextResponse.json({ error: 'ไม่สามารถลดสิทธิ์แอดมินของตัวเองได้' }, { status: 400 });
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    if (passwordHash) {
      await query(
        `UPDATE users
         SET username = ?, full_name = ?, role = ?, password_hash = ?
         WHERE id = ?`,
        [username, fullName, nextRole, passwordHash, id],
      );
    } else {
      await query(
        `UPDATE users
         SET username = ?, full_name = ?, role = ?
         WHERE id = ?`,
        [username, fullName, nextRole, id],
      );
    }

    const [updated] = await query('SELECT id, username, full_name, role FROM users WHERE id = ? LIMIT 1', [id]);

    await writeAuditLog({
      request,
      session,
      action: 'update',
      entityType: 'user',
      entityId: id,
      summary: `แก้ไขผู้ใช้งาน ${updated.username}`,
      metadata: { role: updated.role, password_changed: Boolean(passwordHash) },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' }, { status: 409 });
    }

    console.error('Update admin user error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const action = String(body?.action || '').trim();

    if (action !== 'reset_password') {
      return NextResponse.json({ error: 'action ไม่ถูกต้อง' }, { status: 400 });
    }

    const newPassword = String(body?.new_password || '').trim();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    const users = await query('SELECT id, username FROM users WHERE id = ? LIMIT 1', [id]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);

    await writeAuditLog({
      request,
      session,
      action: 'update',
      entityType: 'user',
      entityId: id,
      summary: `รีเซ็ตรหัสผ่านผู้ใช้งาน ${users[0].username}`,
      metadata: { reset_password: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    const users = await query('SELECT id, username, role FROM users WHERE id = ? LIMIT 1', [id]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    const target = users[0];

    if (Number(target.id) === Number(session.userId)) {
      return NextResponse.json({ error: 'ไม่สามารถลบบัญชีตัวเองได้' }, { status: 400 });
    }

    await query('DELETE FROM user_module_permissions WHERE user_id = ?', [id]);
    await query('DELETE FROM users WHERE id = ?', [id]);

    await writeAuditLog({
      request,
      session,
      action: 'delete',
      entityType: 'user',
      entityId: id,
      summary: `ลบผู้ใช้งาน ${target.username}`,
      metadata: { role: target.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete admin user error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
