import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET() {
  try {
    const rows = await query(
      `SELECT id, tam_name, dis_name, pro_name, tum_code, dis_code, pro_code,
              ST_AsGeoJSON(geometry) AS geojson
       FROM satun_tambon_polygon`
    );
    const features = rows.map((row) => ({
      type: 'Feature',
      properties: {
        id: row.id,
        tam_name: row.tam_name,
        dis_name: row.dis_name,
        pro_name: row.pro_name,
        tum_code: row.tum_code,
        dis_code: row.dis_code,
        pro_code: row.pro_code,
      },
      geometry: typeof row.geojson === 'string' ? JSON.parse(row.geojson) : row.geojson,
    }));
    return NextResponse.json({ type: 'FeatureCollection', features });
  } catch (error) {
    console.error('Tambons geo error:', error?.message || error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ', detail: error?.message }, { status: 500 });
  }
}
