import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireModuleAccess } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { validateHealthStationPayload, ValidationError, validationResponse } from '@/app/lib/validators';

// GET /api/health-stations/[id]
export async function GET(_req, { params }) {
  const { id } = await params;
  try {
    const rows = await query(
      `SELECT *, CAST(lat AS DOUBLE) AS lat, CAST(lon AS DOUBLE) AS lon
       FROM health_stations WHERE id = ?`,
      [id],
    );
    if (!rows.length) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Get health station error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// PUT /api/health-stations/[id] — อัปเดต
export async function PUT(request, { params }) {
  const { session, response } = await requireModuleAccess('manage_health_stations');
  if (response) return response;

  const { id } = await params;
  try {
    const payload = validateHealthStationPayload(await request.json());

    await query(
      `UPDATE health_stations SET
        station_name = ?, district_name = ?, tambon_name = ?, target_area = ?,
        station_type = ?, portable_equipment = ?,
        has_scale = ?, has_bp_monitor = ?, has_dtx = ?, has_waist_tape = ?,
        has_educational_materials = ?,
        has_aom_assigned = ?, aom_schedule = ?,
        is_open = ?, open_hours = ?,
        lat = ?, lon = ?, notes = ?
       WHERE id = ?`,
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
        id,
      ],
    );

    const [updated] = await query('SELECT * FROM health_stations WHERE id = ?', [id]);
    await writeAuditLog({
      session,
      action: 'update',
      entityType: 'health_station',
      entityId: id,
      summary: `แก้ไข Health Station ${payload.station_name}`,
      metadata: { district_name: payload.district_name, station_type: payload.station_type },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) return validationResponse(error);
    console.error('Update health station error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// DELETE /api/health-stations/[id]
export async function DELETE(_req, { params }) {
  const { session, response } = await requireModuleAccess('manage_health_stations');
  if (response) return response;

  const { id } = await params;
  try {
    const [existing] = await query('SELECT station_name FROM health_stations WHERE id = ?', [id]);
    await query('DELETE FROM health_stations WHERE id = ?', [id]);
    await writeAuditLog({
      session,
      action: 'delete',
      entityType: 'health_station',
      entityId: id,
      summary: `ลบ Health Station ${existing?.station_name || id}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete health station error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
