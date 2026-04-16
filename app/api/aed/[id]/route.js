import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/session';

const SELECT_COLS = `id, source_sheet, location_name, manager_name, manager_typecode,
  changwat, district_name, tambon_name, village_no,
  quantity_total, quantity_damaged,
  CAST(lat AS DOUBLE) AS lat, CAST(lon AS DOUBLE) AS lon,
  coordinate_source, is_active, created_at, updated_at`;

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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { lat, lon, is_active, location_name, district_name, tambon_name } = body;

    const latVal = lat !== undefined && lat !== '' && lat !== null ? parseFloat(lat) : null;
    const lonVal = lon !== undefined && lon !== '' && lon !== null ? parseFloat(lon) : null;

    await query(
      `UPDATE aed
       SET location_name = ?, district_name = ?, tambon_name = ?,
           lat = ?, lon = ?, is_active = ?,
           coordinate_source = IF(? IS NOT NULL AND ? IS NOT NULL, 'manual', coordinate_source),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [location_name, district_name, tambon_name, latVal, lonVal, is_active ? 1 : 0,
       latVal, lonVal, id]
    );

    const rows = await query(`SELECT ${SELECT_COLS} FROM aed WHERE id = ?`, [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Update AED error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
