import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { validateAedPayload, ValidationError, validationResponse } from '@/app/lib/validators';

const SELECT_COLS = `id, seq_no, location_name, manager_name,
  aed_affiliation AS manager_typecode,
  district_name,
  quantity AS quantity_total,
  manager_phone,
  CAST(lat AS DOUBLE) AS lat, CAST(lon AS DOUBLE) AS lon,
  status AS is_active, created_at, updated_at`;

// GET /api/aed — list all AED records
export async function GET() {
  try {
    const rows = await query(`SELECT ${SELECT_COLS} FROM aed ORDER BY id ASC`);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Get AED error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// POST /api/aed — create new AED record
export async function POST(request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  try {
    const payload = validateAedPayload(await request.json());

    const result = await query(
      `INSERT INTO aed (location_name, district_name, aed_affiliation, quantity, manager_name, manager_phone, lat, lon, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        payload.location_name,
        payload.district_name,
        payload.aed_affiliation,
        payload.quantity,
        payload.manager_name,
        payload.manager_phone,
        payload.lat, payload.lon,
        payload.is_active,
      ]
    );

    const rows = await query(`SELECT ${SELECT_COLS} FROM aed WHERE id = ?`, [result.insertId]);
    await writeAuditLog({
      session,
      action: 'create',
      entityType: 'aed',
      entityId: result.insertId,
      summary: `เพิ่มจุด AED ${payload.location_name}`,
      metadata: { district_name: payload.district_name, quantity: payload.quantity },
    });
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) return validationResponse(error);
    console.error('Create AED error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
