import { NextResponse } from 'next/server';

import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { ensureRegistrationRequestTable } from '@/app/lib/registration-requests';

export async function GET(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    await ensureRegistrationRequestTable();

    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get('status') || 'pending').trim();

    const validStatuses = new Set(['pending', 'approved', 'rejected', 'all']);
    const filterStatus = validStatuses.has(status) ? status : 'pending';

    const rows = filterStatus === 'all'
      ? await query(
          `SELECT r.id, r.source, r.line_user_id, r.username, r.full_name, r.email, r.phone, r.position_name,
                  r.facility_name, r.note, r.status, r.reviewed_at, r.created_at, r.user_id,
                  reviewer.username AS reviewed_by_username
           FROM staff_registration_requests r
           LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
           ORDER BY r.created_at DESC`,
        )
      : await query(
          `SELECT r.id, r.source, r.line_user_id, r.username, r.full_name, r.email, r.phone, r.position_name,
                  r.facility_name, r.note, r.status, r.reviewed_at, r.created_at, r.user_id,
                  reviewer.username AS reviewed_by_username
           FROM staff_registration_requests r
           LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
           WHERE r.status = ?
           ORDER BY r.created_at DESC`,
          [filterStatus],
        );

    return NextResponse.json({ requests: rows });
  } catch (error) {
    console.error('List registration requests error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
