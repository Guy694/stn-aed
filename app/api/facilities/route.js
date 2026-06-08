import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireModuleAccess } from '@/app/lib/auth-guards';
import { writeAuditLog } from '@/app/lib/audit-log';
import { validateFacilityPayload, ValidationError, validationResponse } from '@/app/lib/validators';

// GET /api/facilities — list all facilities
export async function GET() {
  try {
    const facilities = await query(
      `SELECT id, name, typecode, changwat, address, tambon, district_name,
              CAST(lat AS DOUBLE) AS lat, CAST(lon AS DOUBLE) AS lon,
              is_active, created_at, updated_at
       FROM health_facilities
       ORDER BY id ASC`
    );
    return NextResponse.json(facilities);
  } catch (error) {
    console.error('Get facilities error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// POST /api/facilities — create new facility
export async function POST(request) {
  const { session, response } = await requireModuleAccess('manage_aed');
  if (response) return response;

  try {
    const payload = validateFacilityPayload(await request.json());

    const result = await query(
      `INSERT INTO health_facilities (name, typecode, changwat, address, tambon, district_name, lat, lon, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.name, payload.typecode, payload.changwat, payload.address, payload.tambon,
        payload.district_name, payload.lat, payload.lon, payload.is_active,
      ]
    );

    const newFacility = await query(
      'SELECT * FROM health_facilities WHERE id = ?',
      [result.insertId]
    );

    await writeAuditLog({
      request,
      session,
      action: 'create',
      entityType: 'health_facility',
      entityId: result.insertId,
      summary: `เพิ่มหน่วยบริการ ${payload.name}`,
      metadata: { name: payload.name, typecode: payload.typecode },
    });

    return NextResponse.json(newFacility[0], { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) return validationResponse(error);
    console.error('Create facility error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
