import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/session';

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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, typecode, changwat = 'สตูล', address = '', tambon = '', district_name = '', lat, lon, is_active = 1 } = body;

    if (!name || !typecode || lat == null || lon == null) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO health_facilities (name, typecode, changwat, address, tambon, district_name, lat, lon, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, typecode, changwat, address, tambon, district_name, lat, lon, is_active]
    );

    const newFacility = await query(
      'SELECT * FROM health_facilities WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json(newFacility[0], { status: 201 });
  } catch (error) {
    console.error('Create facility error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
