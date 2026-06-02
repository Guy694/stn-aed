import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';

const VALID_STATUSES = ['pending', 'in_progress', 'resolved'];

// PATCH /api/reports/[id] — admin: update report status / admin note
export async function PATCH(request, { params }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const reportId = parseInt(id, 10);
    if (!reportId || isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [existing] = await query('SELECT id FROM aed_reports WHERE id = ?', [reportId]);
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบรายงาน' }, { status: 404 });
    }

    const body = await request.json();
    const { status, admin_note } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
    }

    const resolvedAt = status === 'resolved' ? 'NOW()' : 'NULL';

    await query(
      `UPDATE aed_reports
       SET status = COALESCE(?, status),
           admin_note = COALESCE(?, admin_note),
           resolved_at = ${resolvedAt},
           updated_at = NOW()
       WHERE id = ?`,
      [status || null, admin_note !== undefined ? admin_note.toString().trim() : null, reportId]
    );

    const [updated] = await query(`
      SELECT r.*, a.location_name, a.district_name
      FROM aed_reports r JOIN aed a ON a.id = r.aed_id
      WHERE r.id = ?
    `, [reportId]);

    await writeAuditLog({
      session,
      action: 'update_status',
      entityType: 'aed_report',
      entityId: reportId,
      summary: `อัปเดตรายงาน AED เป็น ${status || 'unchanged'}`,
      metadata: { status: status || null, has_admin_note: admin_note !== undefined },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
