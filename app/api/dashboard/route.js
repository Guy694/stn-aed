import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET() {
  try {
    const [
      aedByDistrict,
      aedBySheet,
      aedByTypecode,
      aedActiveInactive,
      aedQuantityByDistrict,
      facByTypecode,
      facByDistrict,
      aedMissingCoords,
      totalStats,
    ] = await Promise.all([
      // AED count by district
      query(`SELECT district_name AS name, COUNT(*) AS total, SUM(status) AS active
             FROM aed GROUP BY district_name ORDER BY total DESC`),
      // AED by aed_affiliation (replaces source_sheet)
      query(`SELECT COALESCE(aed_affiliation, 'ไม่ระบุ') AS name, COUNT(*) AS total
             FROM aed GROUP BY aed_affiliation ORDER BY total DESC`),
      // AED by aed_affiliation as typecode
      query(`SELECT COALESCE(aed_affiliation, 'ไม่ระบุ') AS name, COUNT(*) AS total
             FROM aed GROUP BY aed_affiliation ORDER BY total DESC`),
      // AED active vs inactive
      query(`SELECT status AS is_active, COUNT(*) AS total FROM aed GROUP BY status`),
      // AED quantity by district + damaged count
      query(`SELECT district_name AS name,
               SUM(quantity) AS quantity,
               SUM(usage_status = 'ชำรุด') AS damaged
             FROM aed GROUP BY district_name ORDER BY quantity DESC`),
      // Health facilities by typecode
      query(`SELECT typecode AS name, COUNT(*) AS total FROM health_facilities GROUP BY typecode ORDER BY total DESC`),
      // Health facilities by district
      query(`SELECT district_name AS name, COUNT(*) AS total FROM health_facilities GROUP BY district_name ORDER BY total DESC`),
      // AED missing coords
      query(`SELECT
               SUM(lat IS NULL) AS no_coords,
               0 AS approx_coords,
               0 AS matched_coords,
               0 AS exact_coords,
               COUNT(*) AS total
             FROM aed`),
      // Totals summary
      query(`SELECT
               (SELECT COUNT(*) FROM aed) AS aed_total,
               (SELECT SUM(status) FROM aed) AS aed_active,
               (SELECT COUNT(*) FROM aed WHERE lat IS NULL) AS aed_no_coords,
               (SELECT COUNT(*) FROM health_facilities) AS fac_total,
               (SELECT SUM(is_active) FROM health_facilities) AS fac_active`),
    ]);

    return NextResponse.json({
      aedByDistrict,
      aedByTambon: [],
      aedBySheet,
      aedByCoordSource: [],
      aedByTypecode,
      aedActiveInactive,
      aedQuantityByDistrict,
      facByTypecode,
      facByDistrict,
      aedMissingCoords: aedMissingCoords[0],
      totalStats: totalStats[0],
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
