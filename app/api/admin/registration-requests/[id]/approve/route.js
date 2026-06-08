import { NextResponse } from 'next/server';

import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { ensureRegistrationRequestTable, ensureUserEmailColumn } from '@/app/lib/registration-requests';
import { writeAuditLog } from '@/app/lib/audit-log';
import { sendRegistrationApprovedEmail } from '@/app/lib/email';

export async function POST(request, { params }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  try {
    await ensureRegistrationRequestTable();
    await ensureUserEmailColumn();

    const { id } = await params;
    const requestId = Number(id);
    if (!Number.isFinite(requestId) || requestId <= 0) {
      return NextResponse.json({ error: 'request id ไม่ถูกต้อง' }, { status: 400 });
    }

    const requests = await query(
      `SELECT id, source, line_user_id, username, full_name, email, password_hash, status
       FROM staff_registration_requests
       WHERE id = ?
       LIMIT 1`,
      [requestId],
    );

    if (requests.length === 0) {
      return NextResponse.json({ error: 'ไม่พบคำขอ' }, { status: 404 });
    }

    const registration = requests[0];
    if (registration.status !== 'pending') {
      return NextResponse.json({ error: 'คำขอนี้ถูกดำเนินการแล้ว' }, { status: 409 });
    }

    const existingByUsername = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [registration.username]);
    if (existingByUsername.length > 0) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' }, { status: 409 });
    }

    const existingByLine = registration.line_user_id
      ? await query('SELECT id FROM users WHERE line_user_id = ? LIMIT 1', [registration.line_user_id])
      : [];

    if (existingByLine.length > 0) {
      return NextResponse.json({ error: 'LINE นี้ผูกกับผู้ใช้อื่นแล้ว' }, { status: 409 });
    }

    const insertResult = await query(
      `INSERT INTO users (username, password_hash, full_name, email, role, line_user_id)
       VALUES (?, ?, ?, ?, 'user', ?)`,
      [
        registration.username,
        registration.password_hash,
        registration.full_name,
        registration.email || null,
        registration.line_user_id || null,
      ],
    );

    const userId = insertResult.insertId;

    await query(
      `UPDATE staff_registration_requests
       SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), user_id = ?
       WHERE id = ?`,
      [session.userId, userId, requestId],
    );

    let approvalEmail = { skipped: true, reason: 'No email on registration request' };
    if (registration.email) {
      try {
        approvalEmail = await sendRegistrationApprovedEmail({
          to: registration.email,
          fullName: registration.full_name,
          username: registration.username,
        });
      } catch (emailError) {
        console.error('Send registration approval email error:', emailError);
        approvalEmail = { sent: false, error: emailError.message || 'ส่งอีเมลไม่สำเร็จ' };
      }
    }

    await writeAuditLog({
      request,
      session,
      action: 'approve_registration',
      entityType: 'registration_request',
      entityId: requestId,
      summary: `อนุมัติคำขอลงทะเบียน ${registration.username}`,
      metadata: {
        source: registration.source,
        createdUserId: userId,
        approvalEmail,
      },
    });

    return NextResponse.json({ success: true, userId, approvalEmail });
  } catch (error) {
    console.error('Approve registration error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
