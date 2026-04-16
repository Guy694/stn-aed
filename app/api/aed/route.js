import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// GET /api/aed — list all AED records
export async function GET() {
  try {
    const rows = await query(
      `SELECT id, source_sheet, location_name, manager_name, manager_typecode,
              changwat, district_name, tambon_name, village_no,
              quantity_total, quantity_damaged,
              CAST(lat AS DOUBLE) AS lat, CAST(lon AS DOUBLE) AS lon,
              coordinate_source, is_active, created_at, updated_at
       FROM aed
       ORDER BY id ASC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Get AED error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
