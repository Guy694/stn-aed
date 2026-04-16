import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';

const SHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS6qfFcpjpSM9rJjt7YrakWbTL57nkgtCiD3oTMyAfW9gWpsFfRLcO2l3idOEAbmF5vxs5Kq1ix4apQ';

const SHEETS = [
  { gid: '0', name: 'หน่วยบริการที่มีตำแหน่ง', kind: 'position' },
  { gid: '261841055', name: 'หน่วยบริการ', kind: 'facility_inventory' },
  { gid: '1329526143', name: 'งบสภากาชาดไทย', kind: 'community_site' },
  { gid: '1561294795', name: 'งบโครงการ', kind: 'community_site' },
  { gid: '234384841', name: 'งบอบจ.', kind: 'community_site' },
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function normalizeName(value = '') {
  return value
    .replace(/\s+/g, '')
    .replace(/[().,]/g, '')
    .replace(/-/g, '')
    .replace(/หมู่ที่\s*\d+/g, '')
    .replace(/^\d+\s*-\s*/g, '')
    .replace(/โรงพยาบาลส่งเสริมสุขภาพตำบล/g, 'รพ.สต.')
    .replace(/โรงพยาบาล/g, 'รพ.')
    .replace(/ตำบล/g, '')
    .replace(/อำเภอ/g, '')
    .replace(/จังหวัด/g, '')
    .replace(/รีสอร์ทภูผาล้อม/g, '')
    .replace(/อุได/g, 'อุใด')
    .replace(/กระทูน/g, 'กะทูน')
    .replace(/บ้านห้วยไทร/g, 'ห้วยไทร')
    .replace(/เฉลิมพระเกียรติ60พรรษานวมินทราชินี/g, 'เฉลิมพระเกียรติ')
    .replace(/เฉลิมพระเกียรติ๖๐พรรษานวมินทราชินี/g, 'เฉลิมพระเกียรติ')
    .trim();
}

function canonicalizeDistrictName(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  if (trimmed === 'เมือง') return 'เมืองสตูล';
  return trimmed;
}

function canonicalizeTambonName(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  return trimmed.replace(/อุได/g, 'อุใด');
}

function toNumber(value) {
  if (value == null) {
    return null;
  }

  const text = String(value).trim().replace(/,/g, '');
  if (!text) {
    return null;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function sqlString(value) {
  if (value == null) {
    return 'NULL';
  }

  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  return value == null ? 'NULL' : String(value);
}

function formatDecimal(value, scale = 8) {
  return value == null ? 'NULL' : Number(value).toFixed(scale);
}

function inferManagerType(name = '') {
  if (!name) return null;
  if (name.includes('รพ.สต.')) return 'รพ.สต.';
  if (name.includes('รพ.')) return 'รพ.';
  if (name.includes('สสจ.')) return 'สสจ.';
  if (name.includes('สสอ.')) return 'สสอ.';
  if (name.includes('อบจ.')) return 'อบจ.';
  if (name.includes('อบต.')) return 'อบต.';
  if (name.includes('เทศบาล')) return 'เทศบาล';
  return null;
}

async function fetchSheetRows(gid) {
  const response = await fetch(`${SHEET_BASE}/pub?gid=${gid}&single=true&output=csv`);
  if (!response.ok) {
    throw new Error(`Failed to fetch gid ${gid}: ${response.status}`);
  }

  return parseCsv(await response.text());
}

function parsePositionRows(rows) {
  return rows.slice(1)
    .filter((row) => row[0])
    .map((row) => {
      const [lat, lon] = (row[3] || '').split(',').map((value) => toNumber(value));
      return {
        source_sheet: 'หน่วยบริการที่มีตำแหน่ง',
        source_seq: toNumber(row[0]),
        aed_code: row[1] || null,
        location_name: row[2] || null,
        location_type: 'facility_inventory',
        changwat: 'สตูล',
        district_name: null,
        tambon_name: null,
        village_no: null,
        quantity_total: 1,
        quantity_damaged: 0,
        population_count: null,
        personnel_count: null,
        volunteer_count: null,
        service_area_villages: null,
        serial_number: null,
        brand: null,
        manager_name: row[2] || null,
        last_calibration_date: null,
        battery_expiry_date: null,
        lat,
        lon,
        coordinate_source: 'sheet_exact',
        notes: 'มีพิกัดและรหัสเครื่องจากแท็บหน่วยบริการที่มีตำแหน่ง',
      };
    });
}

function parseFacilityInventoryRows(rows) {
  let sourceSeq = 1;

  return rows
    .filter((row) => row[0] === 'สตูล')
    .map((row) => ({
      source_sheet: 'หน่วยบริการ',
      source_seq: sourceSeq++,
      aed_code: null,
      location_name: (row[4] || '').trim() || null,
      location_type: 'facility_inventory',
      changwat: row[0] || 'สตูล',
      district_name: canonicalizeDistrictName(row[1]),
      tambon_name: canonicalizeTambonName(row[2]),
      village_no: (row[3] || '').trim() || null,
      quantity_total: toNumber(row[9]) ?? 0,
      quantity_damaged: toNumber(row[10]) ?? 0,
      population_count: toNumber(row[5]),
      personnel_count: toNumber(row[6]),
      volunteer_count: toNumber(row[7]),
      service_area_villages: (row[8] || '').trim() || null,
      serial_number: null,
      brand: null,
      manager_name: (row[4] || '').trim() || null,
      last_calibration_date: (row[11] || '').trim() || null,
      battery_expiry_date: (row[12] || '').trim() || null,
      lat: toNumber(row[13]),
      lon: toNumber(row[14]),
      coordinate_source: toNumber(row[13]) != null && toNumber(row[14]) != null ? 'sheet_exact' : 'unknown',
      notes: 'ข้อมูลสำรวจหน่วยบริการ',
    }));
}

function parseCommunityRows(sheetName, rows) {
  return rows
    .filter((row) => /^\d+$/.test((row[0] || '').trim()))
    .map((row) => ({
      source_sheet: sheetName,
      source_seq: toNumber(row[0]),
      aed_code: null,
      location_name: (row[5] || '').trim() || null,
      location_type: 'community_site',
      changwat: (row[1] || '').trim() || 'สตูล',
      district_name: canonicalizeDistrictName(row[2]),
      tambon_name: canonicalizeTambonName(row[3]),
      village_no: (row[4] || '').trim() || null,
      quantity_total: toNumber(row[6]) ?? 0,
      quantity_damaged: toNumber(row[7]) ?? 0,
      population_count: null,
      personnel_count: null,
      volunteer_count: null,
      service_area_villages: null,
      serial_number: (row[8] || '').trim() || null,
      brand: (row[10] || '').trim() || null,
      manager_name: (row[9] || '').trim() || null,
      last_calibration_date: null,
      battery_expiry_date: null,
      lat: null,
      lon: null,
      coordinate_source: 'unknown',
      notes: `ข้อมูลจากแท็บ${sheetName}`,
    }));
}

function pickFacilityMatch(candidates, districtName, tambonName, targetName) {
  const target = normalizeName(targetName || '');
  if (!target) return null;

  let best = null;
  for (const facility of candidates) {
    const normalizedFacility = normalizeName(facility.name);
    let score = 0;
    if (target === normalizedFacility) score += 1000;
    if (target.includes(normalizedFacility) || normalizedFacility.includes(target)) score += 240;
    if (districtName && facility.district_name && facility.district_name.includes(districtName)) score += 50;
    if (tambonName && facility.tambon && facility.tambon.includes(tambonName)) score += 50;
    score -= Math.abs(target.length - normalizedFacility.length);

    if (!best || score > best.score) {
      best = { facility, score };
    }
  }

  return best && best.score >= 200 ? best.facility : null;
}

function buildCommunityCoordKey(record) {
  return `${record.district_name || ''}|${record.tambon_name || ''}`;
}

async function main() {
  const outputPath = process.argv[2] || 'aed.sql';
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '199.21.175.91',
    user: process.env.DB_USER || 'skyline694',
    password: process.env.DB_PASSWORD || '29012540',
    database: process.env.DB_NAME || 'stn_aed',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  });

  const [facilities] = await pool.query(
    'SELECT id, name, typecode, district_name, tambon, CAST(lat AS DOUBLE) lat, CAST(lon AS DOUBLE) lon FROM health_facilities ORDER BY id'
  );

  const [tambonCentroids] = await pool.query(
    `SELECT tam_name, dis_name,
            ST_Y(ST_Centroid(geometry)) AS lat,
            ST_X(ST_Centroid(geometry)) AS lon
     FROM satun_tambon_polygon`
  );

  const centroidMap = new Map(
    tambonCentroids.map((row) => [`${row.dis_name || ''}|${row.tam_name || ''}`, row])
  );

  const rowsBySheet = new Map();
  for (const sheet of SHEETS) {
    rowsBySheet.set(sheet.name, await fetchSheetRows(sheet.gid));
  }

  const positionRows = parsePositionRows(rowsBySheet.get('หน่วยบริการที่มีตำแหน่ง'));
  const facilityRows = parseFacilityInventoryRows(rowsBySheet.get('หน่วยบริการ'));
  const communityRows = [
    ...parseCommunityRows('งบสภากาชาดไทย', rowsBySheet.get('งบสภากาชาดไทย')),
    ...parseCommunityRows('งบโครงการ', rowsBySheet.get('งบโครงการ')),
    ...parseCommunityRows('งบอบจ.', rowsBySheet.get('งบอบจ.')),
  ];

  const positionByFacilityId = new Map();
  const supplementalPositionRows = [];

  for (const positionRow of positionRows) {
    const matchedFacility = pickFacilityMatch(facilities, null, null, positionRow.location_name);
    if (matchedFacility) {
      positionByFacilityId.set(matchedFacility.id, { ...positionRow, matchedFacility });
    } else {
      supplementalPositionRows.push(positionRow);
    }
  }

  const mergedFacilityRows = facilityRows.map((row) => {
    const matchedFacility = pickFacilityMatch(facilities, row.district_name, row.tambon_name, row.location_name);
    const exactPosition = matchedFacility ? positionByFacilityId.get(matchedFacility.id) : null;
    const centroid = centroidMap.get(buildCommunityCoordKey(row));

    const merged = { ...row };
    if (matchedFacility) {
      merged.manager_facility_id = matchedFacility.id;
      merged.manager_name = matchedFacility.name;
      merged.manager_typecode = matchedFacility.typecode;

      if (exactPosition) {
        merged.aed_code = exactPosition.aed_code;
        merged.lat = exactPosition.lat;
        merged.lon = exactPosition.lon;
        merged.coordinate_source = 'sheet_exact';
        merged.notes = `${merged.notes}; ผูกกับแท็บหน่วยบริการที่มีตำแหน่ง`; 
      } else if (matchedFacility.lat != null && matchedFacility.lon != null) {
        merged.lat = matchedFacility.lat;
        merged.lon = matchedFacility.lon;
        merged.coordinate_source = 'facility_match';
        merged.notes = `${merged.notes}; ใช้พิกัดจาก health_facilities.id=${matchedFacility.id}`;
      } else if (centroid) {
        merged.lat = Number(centroid.lat);
        merged.lon = Number(centroid.lon);
        merged.coordinate_source = 'tambon_centroid';
        merged.notes = `${merged.notes}; ใช้ centroid ของตำบล${merged.tambon_name}`;
      }
    } else {
      merged.manager_facility_id = null;
      merged.manager_typecode = inferManagerType(merged.manager_name);
      if (centroid) {
        merged.lat = Number(centroid.lat);
        merged.lon = Number(centroid.lon);
        merged.coordinate_source = 'tambon_centroid';
        merged.notes = `${merged.notes}; ใช้ centroid ของตำบล${merged.tambon_name}`;
      }
    }

    return merged;
  });

  const normalizedFacilityKeys = new Set(
    mergedFacilityRows
      .filter((row) => row.manager_facility_id)
      .map((row) => row.manager_facility_id)
  );

  const standalonePositionRows = supplementalPositionRows.map((row) => {
    const matchedFacility = pickFacilityMatch(facilities, row.district_name, row.tambon_name, row.location_name);
    return {
      ...row,
      manager_facility_id: matchedFacility?.id ?? null,
      manager_name: matchedFacility?.name ?? row.manager_name,
      manager_typecode: matchedFacility?.typecode ?? inferManagerType(row.manager_name),
      district_name: row.district_name || matchedFacility?.district_name || null,
      tambon_name: row.tambon_name || matchedFacility?.tambon || null,
      notes: `${row.notes}; ไม่มีแถวคู่ในแท็บหน่วยบริการ`,
    };
  }).filter((row) => !row.manager_facility_id || !normalizedFacilityKeys.has(row.manager_facility_id));

  const enrichedCommunityRows = communityRows.map((row) => {
    const locationFacility = pickFacilityMatch(facilities, row.district_name, row.tambon_name, row.location_name);
    const centroid = centroidMap.get(buildCommunityCoordKey(row));
    const enriched = { ...row };

    enriched.manager_facility_id = locationFacility?.id ?? null;
    enriched.manager_name = row.manager_name || locationFacility?.name || row.location_name;
    enriched.manager_typecode = locationFacility?.typecode ?? inferManagerType(enriched.manager_name);

    if (locationFacility && normalizeName(row.location_name).includes(normalizeName(locationFacility.name))) {
      enriched.lat = locationFacility.lat;
      enriched.lon = locationFacility.lon;
      enriched.coordinate_source = 'facility_match';
      enriched.notes = `${row.notes}; ใช้พิกัดจาก health_facilities.id=${locationFacility.id}`;
    } else if (centroid) {
      enriched.lat = Number(centroid.lat);
      enriched.lon = Number(centroid.lon);
      enriched.coordinate_source = 'tambon_centroid';
      enriched.notes = `${row.notes}; ใช้ centroid ของตำบล${row.tambon_name}`;
    }

    return enriched;
  });

  const records = [...mergedFacilityRows, ...standalonePositionRows, ...enrichedCommunityRows]
    .map((row, index) => ({
      ...row,
      manager_facility_id: row.manager_facility_id ?? null,
      manager_typecode: row.manager_typecode ?? inferManagerType(row.manager_name),
      quantity_total: row.quantity_total ?? 0,
      quantity_damaged: row.quantity_damaged ?? 0,
      is_active: 1,
      __sort: index,
    }))
    .sort((left, right) => {
      if (left.source_sheet !== right.source_sheet) {
        return left.source_sheet.localeCompare(right.source_sheet, 'th');
      }
      return (left.source_seq || 0) - (right.source_seq || 0);
    });

  const insertValues = records.map((row) => `(
    ${sqlString(row.source_sheet)}, ${sqlNumber(row.source_seq)}, ${sqlString(row.location_type)}, ${sqlString(row.aed_code)},
    ${sqlString(row.location_name)}, ${sqlNumber(row.manager_facility_id)}, ${sqlString(row.manager_name)}, ${sqlString(row.manager_typecode)},
    ${sqlString(row.changwat || 'สตูล')}, ${sqlString(row.district_name)}, ${sqlString(row.tambon_name)}, ${sqlString(row.village_no)},
    ${sqlNumber(row.quantity_total)}, ${sqlNumber(row.quantity_damaged)}, ${sqlNumber(row.population_count)}, ${sqlNumber(row.personnel_count)},
    ${sqlNumber(row.volunteer_count)}, ${sqlString(row.service_area_villages)}, ${sqlString(row.serial_number)}, ${sqlString(row.brand)},
    ${sqlString(row.last_calibration_date)}, ${sqlString(row.battery_expiry_date)}, ${formatDecimal(row.lat)}, ${formatDecimal(row.lon)},
    ${sqlString(row.coordinate_source)}, ${sqlString(row.notes)}, ${sqlNumber(row.is_active)}
  )`).join(',\n');

  const sql = `-- AED seed data prepared from all published Google Sheet tabs on 2026-04-16
-- Tabs merged: หน่วยบริการที่มีตำแหน่ง, หน่วยบริการ, งบสภากาชาดไทย, งบโครงการ, งบอบจ.
-- Coordinate priority: exact sheet coordinate > health_facilities match > tambon centroid

SET NAMES utf8mb4;
START TRANSACTION;

DROP TABLE IF EXISTS \`aed\`;

CREATE TABLE \`aed\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`source_sheet\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อแท็บต้นทาง',
  \`source_seq\` int DEFAULT NULL COMMENT 'ลำดับในแท็บต้นทาง',
  \`location_type\` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภทระเบียน เช่น facility_inventory หรือ community_site',
  \`aed_code\` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'รหัสเครื่อง AED ถ้ามี',
  \`location_name\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อจุดติดตั้งหรือหน่วยบริการ',
  \`manager_facility_id\` int DEFAULT NULL COMMENT 'อ้างอิง health_facilities เมื่อจับคู่ได้',
  \`manager_name\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หน่วยงานหรือสถานบริการดูแลเครื่อง',
  \`manager_typecode\` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ประเภทหน่วยดูแล',
  \`changwat\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'สตูล',
  \`district_name\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`tambon_name\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`village_no\` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หมู่หรือรหัสหมู่บ้านจากต้นทาง',
  \`quantity_total\` int NOT NULL DEFAULT '0' COMMENT 'จำนวนเครื่องที่มี',
  \`quantity_damaged\` int NOT NULL DEFAULT '0' COMMENT 'จำนวนเครื่องชำรุด',
  \`population_count\` int DEFAULT NULL COMMENT 'จำนวนประชากร',
  \`personnel_count\` int DEFAULT NULL COMMENT 'จำนวนบุคลากร',
  \`volunteer_count\` int DEFAULT NULL COMMENT 'จำนวน อสม.',
  \`service_area_villages\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'พื้นที่รับผิดชอบ',
  \`serial_number\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หมายเลขเครื่อง',
  \`brand\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ยี่ห้อเครื่อง',
  \`last_calibration_date\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'วันที่สอบเทียบล่าสุด',
  \`battery_expiry_date\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'วันที่หมดอายุแบตเตอรี่',
  \`lat\` decimal(11,8) DEFAULT NULL COMMENT 'ละติจูด',
  \`lon\` decimal(11,8) DEFAULT NULL COMMENT 'ลองจิจูด',
  \`coordinate_source\` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unknown' COMMENT 'ที่มาของพิกัด',
  \`notes\` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'หมายเหตุการรวมข้อมูล',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uq_aed_source\` (\`source_sheet\`, \`source_seq\`),
  UNIQUE KEY \`uq_aed_code\` (\`aed_code\`),
  KEY \`idx_aed_manager_facility\` (\`manager_facility_id\`),
  KEY \`idx_aed_district\` (\`district_name\`),
  KEY \`idx_aed_tambon\` (\`tambon_name\`),
  KEY \`idx_aed_location\` (\`lat\`, \`lon\`),
  KEY \`idx_aed_coordinate_source\` (\`coordinate_source\`),
  CONSTRAINT \`fk_aed_manager_facility\`
    FOREIGN KEY (\`manager_facility_id\`) REFERENCES \`health_facilities\` (\`id\`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ข้อมูล AED ที่รวมจากทุกแท็บของเอกสารต้นทาง';

INSERT INTO \`aed\` (
  \`source_sheet\`, \`source_seq\`, \`location_type\`, \`aed_code\`,
  \`location_name\`, \`manager_facility_id\`, \`manager_name\`, \`manager_typecode\`,
  \`changwat\`, \`district_name\`, \`tambon_name\`, \`village_no\`,
  \`quantity_total\`, \`quantity_damaged\`, \`population_count\`, \`personnel_count\`,
  \`volunteer_count\`, \`service_area_villages\`, \`serial_number\`, \`brand\`,
  \`last_calibration_date\`, \`battery_expiry_date\`, \`lat\`, \`lon\`,
  \`coordinate_source\`, \`notes\`, \`is_active\`
) VALUES
${insertValues}
ON DUPLICATE KEY UPDATE
  \`location_type\` = VALUES(\`location_type\`),
  \`aed_code\` = VALUES(\`aed_code\`),
  \`location_name\` = VALUES(\`location_name\`),
  \`manager_facility_id\` = VALUES(\`manager_facility_id\`),
  \`manager_name\` = VALUES(\`manager_name\`),
  \`manager_typecode\` = VALUES(\`manager_typecode\`),
  \`changwat\` = VALUES(\`changwat\`),
  \`district_name\` = VALUES(\`district_name\`),
  \`tambon_name\` = VALUES(\`tambon_name\`),
  \`village_no\` = VALUES(\`village_no\`),
  \`quantity_total\` = VALUES(\`quantity_total\`),
  \`quantity_damaged\` = VALUES(\`quantity_damaged\`),
  \`population_count\` = VALUES(\`population_count\`),
  \`personnel_count\` = VALUES(\`personnel_count\`),
  \`volunteer_count\` = VALUES(\`volunteer_count\`),
  \`service_area_villages\` = VALUES(\`service_area_villages\`),
  \`serial_number\` = VALUES(\`serial_number\`),
  \`brand\` = VALUES(\`brand\`),
  \`last_calibration_date\` = VALUES(\`last_calibration_date\`),
  \`battery_expiry_date\` = VALUES(\`battery_expiry_date\`),
  \`lat\` = VALUES(\`lat\`),
  \`lon\` = VALUES(\`lon\`),
  \`coordinate_source\` = VALUES(\`coordinate_source\`),
  \`notes\` = VALUES(\`notes\`),
  \`is_active\` = VALUES(\`is_active\`),
  \`updated_at\` = CURRENT_TIMESTAMP;

COMMIT;
`;

  await fs.writeFile(outputPath, sql, 'utf8');

  const summary = records.reduce((accumulator, record) => {
    accumulator.total += 1;
    accumulator.bySheet[record.source_sheet] = (accumulator.bySheet[record.source_sheet] || 0) + 1;
    accumulator.byCoordinateSource[record.coordinate_source] = (accumulator.byCoordinateSource[record.coordinate_source] || 0) + 1;
    return accumulator;
  }, { total: 0, bySheet: {}, byCoordinateSource: {} });

  console.log(JSON.stringify(summary, null, 2));
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});