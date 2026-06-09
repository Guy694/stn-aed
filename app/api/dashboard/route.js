import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { forbiddenResponse, unauthorizedResponse } from '@/app/lib/auth-guards';
import { fillMissingDistricts } from '@/app/lib/dashboard-districts';
import { getUserModulePermissions } from '@/app/lib/module-permissions';
import { getSession } from '@/app/lib/session';

const MODULE_ACCESS = {
  aed: 'manage_aed',
  dental: 'manage_dental',
  'health-stations': 'manage_health_stations',
};

async function requireDashboardAccess(moduleKey) {
  const session = await getSession();
  if (!session) return { response: unauthorizedResponse() };
  if (session.role === 'admin') return { session };

  const permissions = await getUserModulePermissions(session.userId, session.role);
  const modulePermissionKey = MODULE_ACCESS[moduleKey];
  const enabled = modulePermissionKey
    ? permissions.dashboard || permissions[modulePermissionKey]
    : permissions.dashboard;

  if (!enabled) return { response: forbiddenResponse() };
  return { session };
}

export async function GET(request) {
  const requestedModule = request.nextUrl.searchParams.get('module');
  const moduleKey = Object.hasOwn(MODULE_ACCESS, requestedModule) ? requestedModule : null;
  const { response } = await requireDashboardAccess(moduleKey);
  if (response) return response;

  try {
    const [
      districts,
      aedByDistrict,
      aedBySheet,
      aedByTypecode,
      aedActiveInactive,
      aedQuantityByDistrict,
      facByTypecode,
      facByDistrict,
      aedMissingCoords,
      totalStats,
      dentalByDistrict,
      hsByDistrict,
    ] = await Promise.all([
      // Canonical Satun district list, including districts without module data
      query(`SELECT dis_name AS name
             FROM satun_district_polygon
             WHERE dis_name IS NOT NULL AND dis_name <> ''
             ORDER BY dis_code`),
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
               (SELECT SUM(is_active) FROM health_facilities) AS fac_active,
               (SELECT COUNT(*) FROM dental_units) AS dental_total,
               (SELECT COUNT(*) FROM dental_units WHERE status = 1) AS dental_active,
               (SELECT COALESCE(SUM(dental_unit_count),0) FROM dental_units) AS dental_units_total,
               (SELECT COALESCE(SUM(ready_unit_count),0) FROM dental_units) AS dental_units_ready,
               (SELECT COUNT(*) FROM health_stations) AS hs_total,
               (SELECT COUNT(*) FROM health_stations WHERE is_open = 1) AS hs_open,
               (SELECT COUNT(*) FROM health_stations WHERE has_aom_assigned = 1) AS hs_aom`),
      // Dental count by district
      query(`SELECT district_name AS name, COUNT(*) AS total,
               COALESCE(SUM(dental_unit_count),0) AS unit_count,
               COALESCE(SUM(ready_unit_count),0) AS ready_count
             FROM dental_units GROUP BY district_name ORDER BY total DESC`),
      // Health station count by district
      query(`SELECT district_name AS name, COUNT(*) AS total,
               SUM(is_open) AS open_count
             FROM health_stations GROUP BY district_name ORDER BY total DESC`),
    ]);

    const completeAedByDistrict = fillMissingDistricts(districts, aedByDistrict, ['total', 'active']);
    const completeAedQuantityByDistrict = fillMissingDistricts(
      districts,
      aedQuantityByDistrict,
      ['quantity', 'damaged'],
    );
    const completeDentalByDistrict = fillMissingDistricts(
      districts,
      dentalByDistrict,
      ['total', 'unit_count', 'ready_count'],
    );
    const completeHsByDistrict = fillMissingDistricts(districts, hsByDistrict, ['total', 'open_count']);

    return NextResponse.json({
      module: moduleKey,
      aedByDistrict: completeAedByDistrict,
      aedByTambon: [],
      aedBySheet,
      aedByCoordSource: [],
      aedByTypecode,
      aedActiveInactive,
      aedQuantityByDistrict: completeAedQuantityByDistrict,
      facByTypecode,
      facByDistrict,
      aedMissingCoords: aedMissingCoords[0],
      totalStats: totalStats[0],
      dentalByDistrict: completeDentalByDistrict,
      hsByDistrict: completeHsByDistrict,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
