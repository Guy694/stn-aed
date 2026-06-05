import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  LayoutPanelTop,
  MapPin,
  RadioTower,
  Shield,
  Stethoscope,
  Zap,
} from 'lucide-react';

import StaffModuleSidebar from '@/app/components/StaffModuleSidebar';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/session';
import { getUserModulePermissions } from '@/app/lib/module-permissions';
import { getStaffModuleByKey } from '@/app/lib/modules';

function themeFor(moduleKey) {
  switch (moduleKey) {
    case 'dashboard':
      return {
        gradient: 'from-emerald-500 via-teal-500 to-cyan-700',
        glow: 'shadow-emerald-500/25',
        text: 'text-emerald-200',
        icon: 'text-emerald-300',
      };
    case 'my_reports':
      return {
        gradient: 'from-amber-500 via-orange-500 to-rose-600',
        glow: 'shadow-amber-500/25',
        text: 'text-amber-200',
        icon: 'text-amber-300',
      };
    default:
      return {
        gradient: 'from-sky-500 via-cyan-500 to-blue-700',
        glow: 'shadow-sky-500/25',
        text: 'text-cyan-200',
        icon: 'text-cyan-300',
      };
  }
}

function toNumber(value) {
  return Number(value || 0);
}

function formatNumber(value) {
  return toNumber(value).toLocaleString('th-TH');
}

function getPercent(part, total) {
  const totalNumber = toNumber(total);
  if (!totalNumber) return 0;
  return Math.round((toNumber(part) / totalNumber) * 100);
}

async function safeQuery(sql, fallback, label) {
  try {
    return await query(sql);
  } catch (error) {
    console.error(`Staff dashboard ${label} error:`, error);
    return fallback;
  }
}

async function getStaffDashboardSummary() {
  const [totalsRows, reportRows, districtRows] = await Promise.all([
    safeQuery(
      `SELECT
         (SELECT COUNT(*) FROM aed) AS aed_total,
         (SELECT COALESCE(SUM(status),0) FROM aed) AS aed_active,
         (SELECT COUNT(*) FROM aed WHERE lat IS NULL OR lon IS NULL) AS aed_missing_coords,
         (SELECT COALESCE(SUM(quantity),0) FROM aed) AS aed_quantity_total,
         (SELECT COUNT(*) FROM dental_units) AS dental_total,
         (SELECT COUNT(*) FROM dental_units WHERE status = 1) AS dental_active,
         (SELECT COALESCE(SUM(dental_unit_count),0) FROM dental_units) AS dental_units_total,
         (SELECT COALESCE(SUM(ready_unit_count),0) FROM dental_units) AS dental_units_ready,
         (SELECT COUNT(*) FROM health_stations) AS hs_total,
         (SELECT COUNT(*) FROM health_stations WHERE is_open = 1) AS hs_open,
         (SELECT COUNT(*) FROM health_stations WHERE has_aom_assigned = 1) AS hs_aom`,
      [{}],
      'totals'
    ),
    safeQuery(
      `SELECT status, COUNT(*) AS total
       FROM aed_reports
       GROUP BY status`,
      [],
      'reports'
    ),
    safeQuery(
      `SELECT district_name AS name, COUNT(*) AS total, COALESCE(SUM(status),0) AS active
       FROM aed
       GROUP BY district_name
       ORDER BY total DESC
       LIMIT 6`,
      [],
      'districts'
    ),
  ]);

  const reports = reportRows.reduce((acc, row) => {
    acc[row.status] = toNumber(row.total);
    return acc;
  }, {});

  return {
    totals: totalsRows[0] || {},
    reports,
    districts: districtRows,
  };
}

function DashboardStatCard({ icon: Icon, label, value, sub, gradient, warn = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold leading-none text-slate-900">{value}</p>
          {sub && <p className="mt-2 text-xs leading-5 text-slate-600">{sub}</p>}
        </div>
        {warn && <AlertTriangle className="mt-1 h-5 w-5 text-amber-500" />}
      </div>
    </div>
  );
}

function ProgressRow({ label, value, total, color = 'bg-cyan-400' }) {
  const percent = getPercent(value, total);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StaffDashboardOverview({ summary, permissions }) {
  const totals = summary.totals;
  const pendingReports = toNumber(summary.reports.pending);
  const inProgressReports = toNumber(summary.reports.in_progress);
  const openReports = pendingReports + inProgressReports;

  const quickLinks = [
    permissions.dashboard && {
      href: '/dashboard',
      icon: Activity,
      label: 'เปิด Dashboard เต็ม',
      description: 'ดูกราฟและตัวกรองข้อมูลเชิงลึก',
      color: 'text-emerald-300',
    },
    permissions.map && {
      href: '/map',
      icon: MapPin,
      label: 'เปิดแผนที่บริการ',
      description: 'ดูจุด AED, ทันตกรรม และ Health Station',
      color: 'text-cyan-300',
    },
    permissions.my_reports && {
      href: '/my-reports',
      icon: AlertTriangle,
      label: 'แจ้งและติดตามรายงาน',
      description: 'ส่งรายงานปัญหา AED และติดตามสถานะ',
      color: 'text-amber-300',
    },
  ].filter(Boolean);

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardStatCard
          icon={Zap}
          label="AED ทั้งหมด"
          value={formatNumber(totals.aed_total)}
          sub={`${formatNumber(totals.aed_active)} จุดเปิดใช้งาน, เครื่องรวม ${formatNumber(totals.aed_quantity_total)}`}
          gradient="from-sky-500 via-cyan-500 to-blue-700"
        />
        <DashboardStatCard
          icon={Stethoscope}
          label="ทันตกรรม"
          value={formatNumber(totals.dental_total)}
          sub={`${formatNumber(totals.dental_active)} หน่วยเปิดบริการ, ยูนิตพร้อมใช้ ${formatNumber(totals.dental_units_ready)}`}
          gradient="from-indigo-500 via-blue-500 to-sky-600"
        />
        <DashboardStatCard
          icon={RadioTower}
          label="Health Station"
          value={formatNumber(totals.hs_total)}
          sub={`${formatNumber(totals.hs_open)} จุดเปิดบริการ, มี อสม. ${formatNumber(totals.hs_aom)}`}
          gradient="from-emerald-500 via-teal-500 to-cyan-700"
        />
        <DashboardStatCard
          icon={AlertTriangle}
          label="รายงานรอดำเนินการ"
          value={formatNumber(openReports)}
          sub={`รอรับเรื่อง ${formatNumber(pendingReports)}, กำลังดำเนินการ ${formatNumber(inProgressReports)}`}
          gradient="from-amber-500 via-orange-500 to-rose-600"
          warn={openReports > 0}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">สถานะภาพรวม</p>
              <p className="mt-1 text-xs text-slate-500">สรุปความพร้อมใช้งานของข้อมูลหลัก</p>
            </div>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-5 space-y-4">
            <ProgressRow label="AED เปิดใช้งาน" value={totals.aed_active} total={totals.aed_total} color="bg-cyan-500" />
            <ProgressRow label="ยูนิตทันตกรรมพร้อมใช้" value={totals.dental_units_ready} total={totals.dental_units_total} color="bg-violet-500" />
            <ProgressRow label="Health Station เปิดบริการ" value={totals.hs_open} total={totals.hs_total} color="bg-emerald-500" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
          <p className="text-sm font-bold">Quick Links</p>
          <p className="mt-1 text-xs text-slate-500">แสดงเฉพาะเมนูที่บัญชีนี้มีสิทธิ์</p>
          <div className="mt-4 space-y-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3 transition-colors hover:bg-slate-50"
                >
                  <Icon className={`mt-0.5 h-4 w-4 ${item.color}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {summary.districts.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-900">AED ตามอำเภอสูงสุด</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {summary.districts.map((district) => (
              <div key={district.name || 'unknown'} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">{district.name || 'ไม่ระบุอำเภอ'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  AED {formatNumber(district.total)} จุด, เปิดใช้งาน {formatNumber(district.active)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default async function StaffModuleWorkspacePage({ params }) {
  const { moduleKey } = await params;

  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'admin') redirect('/admin');

  const moduleConfig = getStaffModuleByKey(moduleKey);
  if (!moduleConfig) notFound();

  const permissions = await getUserModulePermissions(session.userId, session.role);
  if (!permissions[moduleConfig.key]) {
    redirect('/staff');
  }

  const theme = themeFor(moduleConfig.key);
  const dashboardSummary = moduleConfig.key === 'dashboard' ? await getStaffDashboardSummary() : null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f8ff_0%,#edf3fb_100%)]">
      <div className="mx-auto max-w-6xl p-4 md:p-6 lg:mx-0 lg:max-w-none lg:p-0">
        <StaffModuleSidebar moduleConfig={moduleConfig} theme={theme} />

        <main className="space-y-5 lg:ml-72 lg:p-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Module Workspace</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">{moduleConfig.label}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{moduleConfig.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={moduleConfig.route}
                className="group relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${theme.gradient}`} />
                <div>
                  <p className="text-sm text-slate-500">เข้าสู่หน้าทำงานจริง</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">เปิด {moduleConfig.label}</p>
                  <p className="mt-2 text-xs text-slate-400 inline-flex items-center gap-1.5">
                    ไปยัง {moduleConfig.route} <ExternalLink className="w-3.5 h-3.5" />
                  </p>
                </div>
              </Link>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">ข้อมูลผู้ใช้งาน</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{session.fullName}</p>
                <p className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" /> Role: {session.role}
                </p>
              </div>
            </div>

            {dashboardSummary && (
              <StaffDashboardOverview summary={dashboardSummary} permissions={permissions} />
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500 inline-flex items-center gap-1.5">
                <LayoutPanelTop className={`w-4 h-4 ${theme.icon}`} />หมายเหตุ
              </p>
              <p className="mt-2 text-sm text-slate-600">
                หน้า Workspace นี้ใช้สำหรับแยก Sidebar ตามโมดูล เมื่อเข้าแต่ละโมดูลจะเห็นรายการเมนูเฉพาะของโมดูลนั้น
              </p>
            </div>
        </main>
      </div>
    </div>
  );
}
