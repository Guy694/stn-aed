import 'server-only';

import { query } from '@/app/lib/db';

let auditTableReady = false;

export async function ensureAuditLogTable() {
  if (auditTableReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actor_user_id BIGINT UNSIGNED NULL,
      actor_username VARCHAR(120) NULL,
      actor_role VARCHAR(40) NULL,
      action VARCHAR(80) NOT NULL,
      entity_type VARCHAR(80) NOT NULL,
      entity_id VARCHAR(80) NULL,
      summary VARCHAR(500) NULL,
      metadata JSON NULL,
      PRIMARY KEY (id),
      INDEX idx_audit_created_at (created_at),
      INDEX idx_audit_actor (actor_user_id),
      INDEX idx_audit_entity (entity_type, entity_id),
      INDEX idx_audit_action (action)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  auditTableReady = true;
}

export async function writeAuditLog({ session, action, entityType, entityId = null, summary = null, metadata = null }) {
  try {
    await query(
      `INSERT INTO admin_audit_logs (
        actor_user_id,
        actor_username,
        actor_role,
        action,
        entity_type,
        entity_id,
        summary,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session?.userId || null,
        session?.username || null,
        session?.role || null,
        action,
        entityType,
        entityId !== null && entityId !== undefined ? String(entityId) : null,
        summary,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );
  } catch (error) {
    console.error('Admin audit log error:', error);
  }
}
