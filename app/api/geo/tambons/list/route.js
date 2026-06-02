import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET() {
  try {
    const rows = await query(
      `SELECT DISTINCT dis_name, tam_name
       FROM satun_tambon_polygon
       WHERE dis_name IS NOT NULL AND tam_name IS NOT NULL
       ORDER BY dis_name ASC, tam_name ASC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Tambon list error:', error?.message || error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ', detail: error?.message },
      { status: 500 }
    );
  }
}
