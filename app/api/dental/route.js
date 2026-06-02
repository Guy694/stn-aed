import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { validateDentalPayload, ValidationError, validationResponse } from '@/app/lib/validators';

// GET /api/dental — รายชื่อยูนิตทันตกรรมทั้งหมด พร้อมพิกัดจาก health_facilities (ถ้าตรงชื่อ)
export async function GET() {
  try {
    const rows = await query(`
      SELECT
        d.id,
        d.seq_no,
        d.facility_name,
        d.district_name,
        d.tambon_name,
        d.fixed_dental_staff,
        d.fixed_dental_staff_count,
        d.fixed_dental_staff_names,
        d.rotating_dental_staff_schedule,
        d.rotating_dental_staff_names,
        d.dental_services,
        d.dental_unit_count,
        d.unit_age_text,
        d.ready_unit_count,
        d.repair_unit_count,
        d.broken_unit_count,
        d.procurement_note,
        d.service_days,
        d.avg_patients_per_day,
        d.avg_patients_per_month,
        d.status,
        CAST(COALESCE(d.lat, (
          SELECT hf.lat FROM health_facilities hf
          WHERE hf.name LIKE CONCAT('%', d.facility_name, '%')
             OR d.facility_name LIKE CONCAT('%', hf.name, '%')
          LIMIT 1
        )) AS DOUBLE) AS lat,
        CAST(COALESCE(d.lon, (
          SELECT hf.lon FROM health_facilities hf
          WHERE hf.name LIKE CONCAT('%', d.facility_name, '%')
             OR d.facility_name LIKE CONCAT('%', hf.name, '%')
          LIMIT 1
        )) AS DOUBLE) AS lon,
        d.created_at,
        d.updated_at
      FROM dental_units d
      ORDER BY d.id ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Get dental units error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// POST /api/dental — เพิ่มยูนิตทันตกรรม (ต้อง login)
export async function POST(request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  try {
    const payload = validateDentalPayload(await request.json());

    const result = await query(
      `INSERT INTO dental_units (
        facility_name, district_name, tambon_name,
        fixed_dental_staff, fixed_dental_staff_count,
        fixed_dental_staff_names, rotating_dental_staff_schedule,
        rotating_dental_staff_names, dental_services,
        dental_unit_count, unit_age_text,
        ready_unit_count, repair_unit_count, broken_unit_count,
        procurement_note, service_days,
        avg_patients_per_day, avg_patients_per_month,
        lat, lon, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        payload.facility_name, payload.district_name, payload.tambon_name,
        payload.fixed_dental_staff, payload.fixed_dental_staff_count,
        payload.fixed_dental_staff_names, payload.rotating_dental_staff_schedule,
        payload.rotating_dental_staff_names, payload.dental_services,
        payload.dental_unit_count, payload.unit_age_text,
        payload.ready_unit_count, payload.repair_unit_count, payload.broken_unit_count,
        payload.procurement_note, payload.service_days,
        payload.avg_patients_per_day, payload.avg_patients_per_month,
        payload.lat, payload.lon, payload.status,
      ],
    );

    const [created] = await query('SELECT * FROM dental_units WHERE id = ?', [result.insertId]);
    await writeAuditLog({
      session,
      action: 'create',
      entityType: 'dental_unit',
      entityId: result.insertId,
      summary: `เพิ่มหน่วยทันตกรรม ${payload.facility_name}`,
      metadata: { district_name: payload.district_name, dental_unit_count: payload.dental_unit_count },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) return validationResponse(error);
    console.error('Create dental unit error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
