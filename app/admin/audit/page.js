import Link from 'next/link';
import { ChevronLeft, ChevronRight, Filter, RotateCcw, ScrollText, Search, ShieldCheck, UserCircle2 } from 'lucide-react';

import { query } from '@/app/lib/db';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function parseMetadata(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const ACTION_LABEL = {
  create: 'เพิ่มข้อมูล',
  update: 'แก้ไขข้อมูล',
  delete: 'ลบข้อมูล',
  update_status: 'อัปเดตสถานะ',
  update_permissions: 'แก้สิทธิ์',
};

const ENTITY_LABEL = {
  aed: 'AED',
  health_facility: 'หน่วยบริการ',
  dental_unit: 'ทันตกรรม',
  health_station: 'Health Station',
  aed_report: 'รายงาน AED',
  user: 'ผู้ใช้',
};

function buildAuditHref(params, overrides = {}) {
  const nextParams = new URLSearchParams();
  Object.entries({ ...params, ...overrides }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      nextParams.set(key, String(value));
    }
  });
  const queryString = nextParams.toString();
  return queryString ? `/admin/audit?${queryString}` : '/admin/audit';
}

export default async function AdminAuditPage({ searchParams }) {
  const params = await searchParams;
  const limit = Math.min(Math.max(Number(params?.limit || 50) || 50, 1), 200);
  const page = Math.max(Number(params?.page || 1) || 1, 1);
  const offset = (page - 1) * limit;
  const action = params?.action || '';
  const entityType = params?.entityType || '';
  const actor = params?.actor || '';
  const dateFrom = params?.dateFrom || '';
  const dateTo = params?.dateTo || '';

  let logs = [];
  let total = 0;
  let error = '';

  try {
    const where = [];
    const queryParams = [];

    if (action) {
      where.push('action = ?');
      queryParams.push(action);
    }

    if (entityType) {
      where.push('entity_type = ?');
      queryParams.push(entityType);
    }

    if (actor) {
      where.push('(actor_username LIKE ? OR actor_user_id = ?)');
      queryParams.push(`%${actor}%`, Number(actor) || 0);
    }

    if (dateFrom) {
      where.push('created_at >= ?');
      queryParams.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
      where.push('created_at <= ?');
      queryParams.push(`${dateTo} 23:59:59`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [{ total: totalRows = 0 } = {}] = await query(
      `SELECT COUNT(*) AS total FROM admin_audit_logs ${whereSql}`,
      queryParams,
    );
    total = Number(totalRows);

    logs = await query(
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
      [...queryParams, limit, offset],
    );
  } catch (err) {
    console.error('Admin audit page error:', err);
    error = 'ยังไม่พบตาราง audit logs กรุณารัน database/migrations/001_runtime_tables.sql';
  }

  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const filterParams = { action, entityType, actor, dateFrom, dateTo, limit };

  return (
    <div className="min-h-screen px-6 py-7">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Security Trail</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Audit Logs</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              ตรวจสอบประวัติการเพิ่ม แก้ไข ลบข้อมูล และการเปลี่ยนสิทธิ์ในระบบ
            </p>
          </div>
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-800">
            <p className="text-xs font-semibold">รายการที่พบ</p>
            <p className="text-3xl font-black">{total.toLocaleString('th-TH')}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid grid-cols-1 gap-3 lg:grid-cols-12" action="/admin/audit">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-500">Action</label>
            <select name="action" defaultValue={action} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400">
              <option value="">ทั้งหมด</option>
              {Object.entries(ACTION_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-500">Entity</label>
            <select name="entityType" defaultValue={entityType} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400">
              <option value="">ทั้งหมด</option>
              {Object.entries(ENTITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-500">ผู้ดำเนินการ</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="actor" defaultValue={actor} placeholder="username หรือ id" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-700 outline-none focus:border-cyan-400" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-500">ตั้งแต่วันที่</label>
            <input type="date" name="dateFrom" defaultValue={dateFrom} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400" />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-500">ถึงวันที่</label>
            <input type="date" name="dateTo" defaultValue={dateTo} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400" />
          </div>
          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-bold text-slate-500">ต่อหน้า</label>
            <select name="limit" defaultValue={String(limit)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400">
              {[25, 50, 100, 200].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 lg:col-span-1">
            <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800">
              <Filter className="h-4 w-4" />
              กรอง
            </button>
            <Link href="/admin/audit" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" title="ล้างตัวกรอง">
              <RotateCcw className="h-4 w-4" />
            </Link>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">ประวัติการดำเนินการ</p>
              <p className="text-xs text-slate-500">
                หน้า {page.toLocaleString('th-TH')} จาก {totalPages.toLocaleString('th-TH')} · เรียงจากล่าสุดไปเก่าสุด
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-amber-500" />
            <p className="mt-3 font-semibold text-amber-700">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500">
                  <th className="px-5 py-3">เวลา</th>
                  <th className="px-5 py-3">ผู้ดำเนินการ</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const metadata = parseMetadata(log.metadata);
                  return (
                    <tr key={log.id} className="group hover:bg-cyan-50/40">
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">{formatDate(log.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <UserCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{log.actor_username || '-'}</p>
                            <p className="text-xs text-slate-400">{log.actor_role || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                          {ACTION_LABEL[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-800">{ENTITY_LABEL[log.entity_type] || log.entity_type}</p>
                        <p className="text-xs text-slate-400">ID: {log.entity_id || '-'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">{log.summary || '-'}</p>
                        {metadata && (
                          <p className="mt-1 max-w-xl truncate font-mono text-[11px] text-slate-400">
                            {JSON.stringify(metadata)}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="p-10 text-center text-slate-500">ยังไม่มี audit logs</div>
            )}
          </div>
        )}

        {!error && totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              แสดง {(offset + 1).toLocaleString('th-TH')} - {Math.min(offset + logs.length, total).toLocaleString('th-TH')} จาก {total.toLocaleString('th-TH')} รายการ
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={buildAuditHref(filterParams, { page: Math.max(page - 1, 1) })}
                aria-disabled={page <= 1}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                  page <= 1
                    ? 'pointer-events-none border-slate-100 text-slate-300'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                ก่อนหน้า
              </Link>
              <Link
                href={buildAuditHref(filterParams, { page: Math.min(page + 1, totalPages) })}
                aria-disabled={page >= totalPages}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                  page >= totalPages
                    ? 'pointer-events-none border-slate-100 text-slate-300'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                ถัดไป
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
