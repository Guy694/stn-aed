import 'server-only';

import { query } from '@/app/lib/db';

const DEFAULT_STAFF_POSITIONS = [
  'แพทย์',
  'ทันตแพทย์',
  'เภสัชกร',
  'พยาบาลวิชาชีพ',
  'นักวิชาการสาธารณสุข',
  'เจ้าพนักงานสาธารณสุข',
  'เจ้าพนักงานทันตสาธารณสุข',
  'นักกายภาพบำบัด',
  'นักเทคนิคการแพทย์',
  'นักรังสีการแพทย์',
  'แพทย์แผนไทย',
  'นักโภชนาการ',
  'นักจิตวิทยาคลินิก',
  'เจ้าพนักงานเภสัชกรรม',
  'เจ้าพนักงานเวชสถิติ',
  'พนักงานช่วยเหลือคนไข้',
  'อาสาสมัครสาธารณสุขประจำหมู่บ้าน',
  'ผู้ช่วยเจ้าหน้าที่สาธารณสุข',
  'เจ้าหน้าที่บันทึกข้อมูล',
  'เจ้าหน้าที่งานสุขศึกษา',
];

let staffPositionsEnsured = false;

export async function ensureStaffPositionsTable() {
  if (staffPositionsEnsured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS staff_positions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_staff_positions_name (name),
      KEY idx_staff_positions_active_sort (is_active, sort_order, name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(
    `INSERT IGNORE INTO staff_positions (name, sort_order)
     VALUES ${DEFAULT_STAFF_POSITIONS.map(() => '(?, ?)').join(', ')}`,
    DEFAULT_STAFF_POSITIONS.flatMap((name, index) => [name, index + 1]),
  );

  staffPositionsEnsured = true;
}

export async function listActiveStaffPositions() {
  await ensureStaffPositionsTable();

  return query(
    `SELECT id, name
     FROM staff_positions
     WHERE is_active = 1
     ORDER BY sort_order ASC, name ASC`,
  );
}

export async function isActiveStaffPositionName(name) {
  await ensureStaffPositionsTable();

  const normalizedName = String(name || '').trim();
  if (!normalizedName) return false;

  const rows = await query(
    `SELECT id
     FROM staff_positions
     WHERE name = ? AND is_active = 1
     LIMIT 1`,
    [normalizedName],
  );

  return rows.length > 0;
}
