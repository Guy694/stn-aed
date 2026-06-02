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

function DashboardStatCard({ icon: Icon, label, value, sub, gradient, glow, warn = false }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-xl ${glow}`}>
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">{label}</p>
          <p className="mt-1 text-3xl font-black leading-none">{value}</p>
          {sub && <p className="mt-2 text-xs leading-5 text-white/70">{sub}</p>}
        </div>
        {warn && <AlertTriangle className="mt-1 h-5 w-5 text-white/80" />}
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
          glow="shadow-sky-500/25"
        />
        <DashboardStatCard
          icon={Stethoscope}
          label="ทันตกรรม"
          value={formatNumber(totals.dental_total)}
          sub={`${formatNumber(totals.dental_active)} หน่วยเปิดบริการ, ยูนิตพร้อมใช้ ${formatNumber(totals.dental_units_ready)}`}
          gradient="from-violet-500 via-fuchsia-500 to-purple-700"
          glow="shadow-violet-500/25"
        />
        <DashboardStatCard
          icon={RadioTower}
          label="Health Station"
          value={formatNumber(totals.hs_total)}
          sub={`${formatNumber(totals.hs_open)} จุดเปิดบริการ, มี อสม. ${formatNumber(totals.hs_aom)}`}
          gradient="from-emerald-500 via-teal-500 to-cyan-700"
          glow="shadow-emerald-500/25"
        />
        <DashboardStatCard
          icon={AlertTriangle}
          label="รายงานรอดำเนินการ"
          value={formatNumber(openReports)}
          sub={`รอรับเรื่อง ${formatNumber(pendingReports)}, กำลังดำเนินการ ${formatNumber(inProgressReports)}`}
          gradient="from-amber-500 via-orange-500 to-rose-600"
          glow="shadow-amber-500/25"
          warn={openReports > 0}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur">
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

        <div className="rounded-3xl border border-white/70 bg-slate-950 p-5 text-white shadow-2xl">
          <p className="text-sm font-bold text-white">Quick Links</p>
          <p className="mt-1 text-xs text-slate-400">แสดงเฉพาะเมนูที่บัญชีนี้มีสิทธิ์</p>
          <div className="mt-4 space-y-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition-all hover:bg-white/10"
                >
                  <Icon className={`mt-0.5 h-4 w-4 ${item.color}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-400">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {summary.districts.length > 0 && (
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur">
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.20),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <StaffModuleSidebar moduleConfig={moduleConfig} theme={theme} />

          <main className="lg:col-span-9 space-y-5">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-2xl">
              <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
              <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative">
                <p className={`text-xs uppercase tracking-[0.2em] font-bold ${theme.text}`}>Module Workspace</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">{moduleConfig.label}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{moduleConfig.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={moduleConfig.route}
                className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white p-5 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl ${theme.glow}`}
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${theme.gradient}`} />
                <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-slate-100 blur-2xl transition-all group-hover:bg-cyan-100" />
                <div className="relative">
                  <p className="text-sm text-slate-500">เข้าสู่หน้าทำงานจริง</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">เปิด {moduleConfig.label}</p>
                  <p className="mt-2 text-xs text-slate-400 inline-flex items-center gap-1.5">
                    ไปยัง {moduleConfig.route} <ExternalLink className="w-3.5 h-3.5" />
                  </p>
                </div>
              </Link>

              <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur">
                <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-100 blur-2xl" />
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

            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur">
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
    </div>
  );
}
