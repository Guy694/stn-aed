import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/session';

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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, typecode, changwat, address, tambon, district_name, lat, lon, is_active } = body;

    await query(
      `UPDATE health_facilities
       SET name=?, typecode=?, changwat=?, address=?, tambon=?, district_name=?, lat=?, lon=?, is_active=?
       WHERE id=?`,
      [name, typecode, changwat, address, tambon, district_name, lat, lon, is_active, id]
    );

    const updated = await query(
      'SELECT * FROM health_facilities WHERE id = ?',
      [id]
    );
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Update facility error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// DELETE /api/facilities/[id]
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await query('DELETE FROM health_facilities WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete facility error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
