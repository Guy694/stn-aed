import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { validateDentalPayload, ValidationError, validationResponse } from '@/app/lib/validators';

// GET /api/dental/[id]
export async function GET(_req, { params }) {
  const { id } = await params;
  try {
    const rows = await query(
      `SELECT d.*,
        CAST(COALESCE(d.lat, hf.lat) AS DOUBLE) AS lat,
        CAST(COALESCE(d.lon, hf.lon) AS DOUBLE) AS lon
       FROM dental_units d
       LEFT JOIN health_facilities hf
         ON hf.name LIKE CONCAT('%', d.facility_name, '%')
         OR d.facility_name LIKE CONCAT('%', hf.name, '%')
       WHERE d.id = ?`,
      [id],
    );
    if (!rows.length) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Get dental unit error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// PUT /api/dental/[id] — อัปเดต
export async function PUT(request, { params }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  try {
    const payload = validateDentalPayload(await request.json());

    await query(
      `UPDATE dental_units SET
        facility_name = ?, district_name = ?, tambon_name = ?,
        fixed_dental_staff = ?, fixed_dental_staff_count = ?,
        fixed_dental_staff_names = ?, rotating_dental_staff_schedule = ?,
        rotating_dental_staff_names = ?, dental_services = ?,
        dental_unit_count = ?, unit_age_text = ?,
        ready_unit_count = ?, repair_unit_count = ?, broken_unit_count = ?,
        procurement_note = ?, service_days = ?,
        avg_patients_per_day = ?, avg_patients_per_month = ?,
        lat = ?, lon = ?, status = ?
       WHERE id = ?`,
      [
        payload.facility_name, payload.district_name, payload.tambon_name,
        payload.fixed_dental_staff, payload.fixed_dental_staff_count,
        payload.fixed_dental_staff_names, payload.rotating_dental_staff_schedule,
        payload.rotating_dental_staff_names, payload.dental_services,
        payload.dental_unit_count, payload.unit_age_text,
        payload.ready_unit_count, payload.repair_unit_count, payload.broken_unit_count,
        payload.procurement_note, payload.service_days,
        payload.avg_patients_per_day, payload.avg_patients_per_month,
        payload.lat, payload.lon,
        payload.status,
        id,
      ],
    );

    const [updated] = await query('SELECT * FROM dental_units WHERE id = ?', [id]);
    await writeAuditLog({
      session,
      action: 'update',
      entityType: 'dental_unit',
      entityId: id,
      summary: `แก้ไขหน่วยทันตกรรม ${payload.facility_name}`,
      metadata: { district_name: payload.district_name, dental_unit_count: payload.dental_unit_count },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) return validationResponse(error);
    console.error('Update dental unit error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// DELETE /api/dental/[id]
export async function DELETE(_req, { params }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  try {
    const [existing] = await query('SELECT facility_name FROM dental_units WHERE id = ?', [id]);
    await query('DELETE FROM dental_units WHERE id = ?', [id]);
    await writeAuditLog({
      session,
      action: 'delete',
      entityType: 'dental_unit',
      entityId: id,
      summary: `ลบหน่วยทันตกรรม ${existing?.facility_name || id}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete dental unit error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
