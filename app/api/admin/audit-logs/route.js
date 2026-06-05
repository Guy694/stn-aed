import { NextResponse } from 'next/server';

import { ensureAuditLogTable } from '@/app/lib/audit-log';
import { requireAdmin } from '@/app/lib/auth-guards';
import { query } from '@/app/lib/db';

export async function GET(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    await ensureAuditLogTable();

    const limitParam = Number(request.nextUrl.searchParams.get('limit') || 100);
    const safeLimit = Math.min(Math.max(limitParam || 100, 1), 500);
    const pageParam = Number(request.nextUrl.searchParams.get('page') || 1);
    const safePage = Math.max(pageParam || 1, 1);
    const offset = (safePage - 1) * safeLimit;
    const entityType = request.nextUrl.searchParams.get('entityType');
    const action = request.nextUrl.searchParams.get('action');
    const actor = request.nextUrl.searchParams.get('actor');
    const dateFrom = request.nextUrl.searchParams.get('dateFrom');
    const dateTo = request.nextUrl.searchParams.get('dateTo');

    const where = [];
    const params = [];

    if (entityType) {
      where.push('entity_type = ?');
      params.push(entityType);
    }

    if (action) {
      where.push('action = ?');
      params.push(action);
    }

    if (actor) {
      where.push('(actor_username LIKE ? OR actor_user_id = ?)');
      params.push(`%${actor}%`, Number(actor) || 0);
    }

    if (dateFrom) {
      where.push('created_at >= ?');
      params.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
      where.push('created_at <= ?');
      params.push(`${dateTo} 23:59:59`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [{ total = 0 } = {}] = await query(
      `SELECT COUNT(*) AS total
       FROM admin_audit_logs
       ${whereSql}`,
      params,
    );

    const rows = await query(
      `SELECT
        id,
        created_at,
        actor_user_id,
        actor_username,
        actor_role,
        action,
        entity_type,
        entity_id,
        summary,
        metadata
       FROM admin_audit_logs
       ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset],
    );

    return NextResponse.json({
      logs: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: Number(total),
        totalPages: Math.max(Math.ceil(Number(total) / safeLimit), 1),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึง audit logs ได้' }, { status: 500 });
  }
}
