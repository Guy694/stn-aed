import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET() {
  try {
    const rows = await query(
      `SELECT id, dis_name, pro_name, dis_code, pro_code,
              ST_AsGeoJSON(geometry) AS geojson
       FROM satun_district_polygon`
    );
    const features = rows.map((row) => ({
      type: 'Feature',
      properties: {
        id: row.id,
        dis_name: row.dis_name,
        pro_name: row.pro_name,
        dis_code: row.dis_code,
        pro_code: row.pro_code,
      },
      geometry: typeof row.geojson === 'string' ? JSON.parse(row.geojson) : row.geojson,
    }));
    return NextResponse.json({ type: 'FeatureCollection', features });
  } catch (error) {
    console.error('Districts geo error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ', detail: error?.message, code: error?.code, sqlMessage: error?.sqlMessage }, { status: 500 });
  }
}
