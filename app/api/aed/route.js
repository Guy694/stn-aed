import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireModuleAccess } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { validateAedPayload, ValidationError, validationResponse } from '@/app/lib/validators';

const SELECT_COLS = `a.id, a.seq_no, a.location_name, a.manager_name,
  a.aed_affiliation AS manager_typecode,
  a.district_name,
  (
    SELECT t.tam_name
    FROM satun_tambon_polygon t
    WHERE a.lat IS NOT NULL
      AND a.lon IS NOT NULL
      AND ST_Contains(
        t.geometry,
        ST_SRID(POINT(CAST(a.lon AS DOUBLE), CAST(a.lat AS DOUBLE)), ST_SRID(t.geometry))
      )
    LIMIT 1
  ) AS tambon_name,
  a.quantity AS quantity_total,
  a.manager_phone,
  CAST(a.lat AS DOUBLE) AS lat, CAST(a.lon AS DOUBLE) AS lon,
  a.status AS is_active, a.created_at, a.updated_at`;

// GET /api/aed — list all AED records
export async function GET() {
  try {
    const rows = await query(`SELECT ${SELECT_COLS} FROM aed a ORDER BY a.id ASC`);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Get AED error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// POST /api/aed — create new AED record
export async function POST(request) {
  const { session, response } = await requireModuleAccess('manage_aed');
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

    const rows = await query(`SELECT ${SELECT_COLS} FROM aed a WHERE a.id = ?`, [result.insertId]);
    await writeAuditLog({
      request,
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
