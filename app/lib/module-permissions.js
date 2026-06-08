import 'server-only';

import { query } from '@/app/lib/db';
import { ALL_MODULE_PERMISSION_KEYS } from '@/app/lib/modules';

let tableEnsured = false;

export async function ensureModulePermissionTable() {
  if (tableEnsured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS user_module_permissions (
      user_id BIGINT UNSIGNED NOT NULL,
      module_key VARCHAR(64) NOT NULL,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      updated_by BIGINT UNSIGNED NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, module_key),
      KEY idx_module_key (module_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  tableEnsured = true;
}

function defaultPermissionMap() {
  return Object.fromEntries(ALL_MODULE_PERMISSION_KEYS.map((key) => [key, false]));
}

export async function getUserModulePermissions(userId, role = 'user') {
  if (!userId) return defaultPermissionMap();
  if (role === 'admin') {
    return Object.fromEntries(ALL_MODULE_PERMISSION_KEYS.map((key) => [key, true]));
  }

  await ensureModulePermissionTable();

  const rows = await query(
    `SELECT module_key, is_enabled
     FROM user_module_permissions
     WHERE user_id = ?`,
    [userId],
  );

  const permissions = defaultPermissionMap();
  for (const row of rows) {
    if (Object.hasOwn(permissions, row.module_key)) {
      permissions[row.module_key] = Boolean(row.is_enabled);
    }
  }

  return permissions;
}

export async function isModuleEnabledForUser(userId, role, moduleKey) {
  const permissions = await getUserModulePermissions(userId, role);
  return Boolean(permissions[moduleKey]);
}

export async function setUserModulePermissions(userId, modules, updatedBy = null) {
  await ensureModulePermissionTable();

  const entries = Object.entries(modules || {}).filter(([key]) => ALL_MODULE_PERMISSION_KEYS.includes(key));
  if (entries.length === 0) return;

  await Promise.all(
    entries.map(([moduleKey, enabled]) =>
      query(
        `INSERT INTO user_module_permissions (user_id, module_key, is_enabled, updated_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           is_enabled = VALUES(is_enabled),
           updated_by = VALUES(updated_by)`,
        [userId, moduleKey, enabled ? 1 : 0, updatedBy],
      ),
    ),
  );
}
