import { NextResponse } from 'next/server';

import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { ensureRegistrationRequestTable } from '@/app/lib/registration-requests';
import { writeAuditLog } from '@/app/lib/audit-log';

export async function POST(request, { params }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  try {
    await ensureRegistrationRequestTable();

    const { id } = await params;
    const requestId = Number(id);
    if (!Number.isFinite(requestId) || requestId <= 0) {
      return NextResponse.json({ error: 'request id ไม่ถูกต้อง' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const rejectNote = String(body?.note || '').trim() || null;

    const requests = await query(
      `SELECT id, username, source, status
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

    await query(
      `UPDATE staff_registration_requests
       SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), note = COALESCE(?, note)
       WHERE id = ?`,
      [session.userId, rejectNote, requestId],
    );

    await writeAuditLog({
      request,
      session,
      action: 'reject_registration',
      entityType: 'registration_request',
      entityId: requestId,
      summary: `ปฏิเสธคำขอลงทะเบียน ${registration.username}`,
      metadata: {
        source: registration.source,
        note: rejectNote,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject registration error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
