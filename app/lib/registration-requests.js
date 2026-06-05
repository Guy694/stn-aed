import 'server-only';

import { query } from '@/app/lib/db';

let registrationTableEnsured = false;

export async function ensureRegistrationRequestTable() {
  if (registrationTableEnsured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS staff_registration_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      source VARCHAR(20) NOT NULL DEFAULT 'form',
      line_user_id VARCHAR(191) NULL,
      username VARCHAR(120) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NULL,
      position_name VARCHAR(255) NULL,
      facility_name VARCHAR(255) NULL,
      note TEXT NULL,
      password_hash VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      reviewed_by BIGINT UNSIGNED NULL,
      reviewed_at DATETIME NULL,
      user_id BIGINT UNSIGNED NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_status_created (status, created_at),
      KEY idx_line_user_id (line_user_id),
      KEY idx_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  registrationTableEnsured = true;
}

export async function upsertPendingRegistration(payload) {
  await ensureRegistrationRequestTable();

  const {
    source = 'form',
    lineUserId = null,
    username,
    fullName,
    phone = null,
    positionName = null,
    facilityName = null,
    note = null,
    passwordHash,
  } = payload;

  if (lineUserId) {
    const existing = await query(
      `SELECT id
       FROM staff_registration_requests
       WHERE line_user_id = ? AND status = 'pending'
       ORDER BY id DESC
       LIMIT 1`,
      [lineUserId],
    );

    if (existing.length > 0) {
      const id = existing[0].id;
      await query(
        `UPDATE staff_registration_requests
         SET source = ?, username = ?, full_name = ?, phone = ?, position_name = ?, facility_name = ?,
             note = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [source, username, fullName, phone, positionName, facilityName, note, passwordHash, id],
      );
      return id;
    }
  }

  const result = await query(
    `INSERT INTO staff_registration_requests (
      source, line_user_id, username, full_name, phone, position_name, facility_name, note, password_hash, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [source, lineUserId, username, fullName, phone, positionName, facilityName, note, passwordHash],
  );

  return result.insertId;
}
