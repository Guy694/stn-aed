import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/session';
import { isModuleEnabledForUser } from '@/app/lib/module-permissions';

// GET /api/reports — admin: list all reports (newest first)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'admin') {
    const [canReports, canManageAed] = await Promise.all([
      isModuleEnabledForUser(session.userId, session.role, 'my_reports'),
      isModuleEnabledForUser(session.userId, session.role, 'manage_aed'),
    ]);

    if (!canReports && !canManageAed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const rows = await query(`
      SELECT
        r.id, r.aed_id, r.reporter_name, r.reporter_phone,
        r.report_type, r.description, r.status, r.admin_note,
        r.notified_at, r.resolved_at, r.created_at, r.updated_at,
        a.location_name, a.district_name, a.manager_name, a.manager_phone
      FROM aed_reports r
      JOIN aed a ON a.id = r.aed_id
      ORDER BY r.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
