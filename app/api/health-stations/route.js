import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireModuleAccess } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { validateHealthStationPayload, ValidationError, validationResponse } from '@/app/lib/validators';

// GET /api/health-stations — รายการ Health Station ทั้งหมด
export async function GET() {
  try {
    const rows = await query(`
      SELECT
        id, station_name, district_name, tambon_name, target_area,
        station_type, portable_equipment,
        has_scale, has_bp_monitor, has_dtx, has_waist_tape,
        has_educational_materials,
        has_aom_assigned, aom_schedule,
        is_open, open_hours,
        CAST(lat AS DOUBLE) AS lat, CAST(lon AS DOUBLE) AS lon,
        notes, created_at, updated_at
      FROM health_stations
      ORDER BY id ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Get health stations error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// POST /api/health-stations — เพิ่ม Health Station (ต้อง login)
export async function POST(request) {
  const { session, response } = await requireModuleAccess('manage_health_stations');
  if (response) return response;

  try {
    const payload = validateHealthStationPayload(await request.json());

    const result = await query(
      `INSERT INTO health_stations (
        station_name, district_name, tambon_name, target_area,
        station_type, portable_equipment,
        has_scale, has_bp_monitor, has_dtx, has_waist_tape,
        has_educational_materials,
        has_aom_assigned, aom_schedule,
        is_open, open_hours,
        lat, lon, notes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        payload.station_name, payload.district_name, payload.tambon_name, payload.target_area,
        payload.station_type,
        payload.portable_equipment,
        payload.has_scale, payload.has_bp_monitor,
        payload.has_dtx, payload.has_waist_tape,
        payload.has_educational_materials,
        payload.has_aom_assigned, payload.aom_schedule,
        payload.is_open, payload.open_hours,
        payload.lat, payload.lon, payload.notes,
      ],
    );

    const [created] = await query('SELECT * FROM health_stations WHERE id = ?', [result.insertId]);
    await writeAuditLog({
      request,
      session,
      action: 'create',
      entityType: 'health_station',
      entityId: result.insertId,
      summary: `เพิ่ม Health Station ${payload.station_name}`,
      metadata: { district_name: payload.district_name, station_type: payload.station_type },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) return validationResponse(error);
    console.error('Create health station error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
