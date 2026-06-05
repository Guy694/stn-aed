import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireModuleAccess } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { validateFacilityPayload, ValidationError, validationResponse } from '@/app/lib/validators';

// GET /api/facilities/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT id, name, typecode, changwat, address, tambon, district_name,
              CAST(lat AS DOUBLE) AS lat, CAST(lon AS DOUBLE) AS lon,
              is_active, created_at, updated_at
       FROM health_facilities WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Get facility error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// PUT /api/facilities/[id]
export async function PUT(request, { params }) {
  const { session, response } = await requireModuleAccess('manage_aed');
  if (response) return response;

  try {
    const { id } = await params;
    const payload = validateFacilityPayload(await request.json());

    await query(
      `UPDATE health_facilities
       SET name=?, typecode=?, changwat=?, address=?, tambon=?, district_name=?, lat=?, lon=?, is_active=?
       WHERE id=?`,
      [
        payload.name, payload.typecode, payload.changwat, payload.address, payload.tambon,
        payload.district_name, payload.lat, payload.lon, payload.is_active, id,
      ]
    );

    const updated = await query(
      'SELECT * FROM health_facilities WHERE id = ?',
      [id]
    );
    await writeAuditLog({
      session,
      action: 'update',
      entityType: 'health_facility',
      entityId: id,
      summary: `แก้ไขหน่วยบริการ ${payload.name}`,
      metadata: { name: payload.name, typecode: payload.typecode },
    });

    return NextResponse.json(updated[0]);
  } catch (error) {
    if (error instanceof ValidationError) return validationResponse(error);
    console.error('Update facility error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// DELETE /api/facilities/[id]
export async function DELETE(request, { params }) {
  const { session, response } = await requireModuleAccess('manage_aed');
  if (response) return response;

  try {
    const { id } = await params;
    const [existing] = await query('SELECT name FROM health_facilities WHERE id = ?', [id]);
    await query('DELETE FROM health_facilities WHERE id = ?', [id]);
    await writeAuditLog({
      session,
      action: 'delete',
      entityType: 'health_facility',
      entityId: id,
      summary: `ลบหน่วยบริการ ${existing?.name || id}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete facility error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
