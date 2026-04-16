import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET() {
  try {
    const [
      aedByDistrict,
      aedByTambon,
      aedBySheet,
      aedByCoordSource,
      aedByTypecode,
      aedActiveInactive,
      aedQuantityByDistrict,
      facByTypecode,
      facByDistrict,
      aedMissingCoords,
      totalStats,
    ] = await Promise.all([
      // AED count by district
      query(`SELECT district_name AS name, COUNT(*) AS total, SUM(is_active) AS active
             FROM aed GROUP BY district_name ORDER BY total DESC`),
      // AED count by tambon (with district info)
      query(`SELECT tambon_name AS name, district_name, COUNT(*) AS total, SUM(is_active) AS active
             FROM aed GROUP BY district_name, tambon_name ORDER BY district_name, total DESC`),
      // AED by source_sheet
      query(`SELECT source_sheet AS name, COUNT(*) AS total FROM aed GROUP BY source_sheet ORDER BY total DESC`),
      // AED by coordinate_source
      query(`SELECT coordinate_source AS name, COUNT(*) AS total FROM aed GROUP BY coordinate_source ORDER BY total DESC`),
      // AED by manager_typecode
      query(`SELECT COALESCE(manager_typecode, 'ไม่ระบุ') AS name, COUNT(*) AS total
             FROM aed GROUP BY manager_typecode ORDER BY total DESC`),
      // AED active vs inactive
      query(`SELECT is_active, COUNT(*) AS total FROM aed GROUP BY is_active`),
      // AED quantity_total by district
      query(`SELECT district_name AS name, SUM(quantity_total) AS quantity, SUM(quantity_damaged) AS damaged
             FROM aed GROUP BY district_name ORDER BY quantity DESC`),
      // Health facilities by typecode
      query(`SELECT typecode AS name, COUNT(*) AS total FROM health_facilities GROUP BY typecode ORDER BY total DESC`),
      // Health facilities by district
      query(`SELECT district_name AS name, COUNT(*) AS total FROM health_facilities GROUP BY district_name ORDER BY total DESC`),
      // AED missing / approximate coords
      query(`SELECT
               SUM(lat IS NULL) AS no_coords,
               SUM(coordinate_source = 'tambon_centroid') AS approx_coords,
               SUM(coordinate_source = 'facility_match') AS matched_coords,
               SUM(coordinate_source = 'sheet_exact') AS exact_coords,
               COUNT(*) AS total
             FROM aed`),
      // Totals summary
      query(`SELECT
               (SELECT COUNT(*) FROM aed) AS aed_total,
               (SELECT SUM(is_active) FROM aed) AS aed_active,
               (SELECT COUNT(*) FROM aed WHERE lat IS NULL) AS aed_no_coords,
               (SELECT COUNT(*) FROM health_facilities) AS fac_total,
               (SELECT SUM(is_active) FROM health_facilities) AS fac_active`),
    ]);

    return NextResponse.json({
      aedByDistrict,
      aedByTambon,
      aedBySheet,
      aedByCoordSource,
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
