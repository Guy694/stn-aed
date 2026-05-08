import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/session';

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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { location_name, district_name, aed_affiliation, quantity, manager_name, manager_phone, lat, lon, is_active } = body;

    if (!location_name?.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อจุดบริการ' }, { status: 400 });
    }

    const latVal = lat !== undefined && lat !== '' && lat !== null ? parseFloat(lat) : null;
    const lonVal = lon !== undefined && lon !== '' && lon !== null ? parseFloat(lon) : null;

    const result = await query(
      `INSERT INTO aed (location_name, district_name, aed_affiliation, quantity, manager_name, manager_phone, lat, lon, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        location_name.trim(),
        district_name || null,
        aed_affiliation || null,
        quantity ? parseInt(quantity) : 1,
        manager_name || null,
        manager_phone || null,
        latVal, lonVal,
        is_active ? 1 : 0,
      ]
    );

    const rows = await query(`SELECT ${SELECT_COLS} FROM aed WHERE id = ?`, [result.insertId]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Create AED error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
