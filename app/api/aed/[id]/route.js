import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireModuleAccess } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { validateAedPayload, ValidationError, validationResponse } from '@/app/lib/validators';

const SELECT_COLS = `id, seq_no, location_name, manager_name,
  aed_affiliation AS manager_typecode,
  district_name,
  quantity AS quantity_total,
  manager_phone,
  CAST(lat AS DOUBLE) AS lat, CAST(lon AS DOUBLE) AS lon,
  status AS is_active, created_at, updated_at`;

// GET /api/aed/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const rows = await query(`SELECT ${SELECT_COLS} FROM aed WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Get AED error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// PUT /api/aed/[id]
export async function PUT(request, { params }) {
  const { session, response } = await requireModuleAccess('manage_aed');
  if (response) return response;

  try {
    const { id } = await params;
    const payload = validateAedPayload(await request.json());

    await query(
      `UPDATE aed
       SET location_name = ?, district_name = ?,
           aed_affiliation = ?, quantity = ?,
           manager_name = ?, manager_phone = ?,
           lat = ?, lon = ?, status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        payload.location_name, payload.district_name, payload.aed_affiliation, payload.quantity,
        payload.manager_name, payload.manager_phone,
        payload.lat, payload.lon, payload.is_active, id,
      ]
    );

    const rows = await query(`SELECT ${SELECT_COLS} FROM aed WHERE id = ?`, [id]);
    await writeAuditLog({
      session,
      action: 'update',
      entityType: 'aed',
      entityId: id,
      summary: `แก้ไขจุด AED ${payload.location_name}`,
      metadata: { district_name: payload.district_name, quantity: payload.quantity },
    });
    return NextResponse.json(rows[0]);
  } catch (error) {
    if (error instanceof ValidationError) return validationResponse(error);
    console.error('Update AED error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// DELETE /api/aed/[id]
export async function DELETE(request, { params }) {
  const { session, response } = await requireModuleAccess('manage_aed');
  if (response) return response;

  try {
    const { id } = await params;
    const rows = await query(`SELECT id, location_name FROM aed WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });
    }
    await query(`DELETE FROM aed WHERE id = ?`, [id]);
    await writeAuditLog({
      session,
      action: 'delete',
      entityType: 'aed',
      entityId: id,
      summary: `ลบจุด AED ${rows[0].location_name || id}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete AED error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
