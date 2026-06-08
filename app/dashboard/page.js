'use client';
import { useCallback, useEffect, useState, useMemo } from 'react';

import { apiFetch } from '@/app/lib/client-api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AdminSidebar from '@/app/components/AdminSidebar';
import AdminNavbar from '@/app/components/AdminNavbar';
import StaffModuleSidebar from '@/app/components/StaffModuleSidebar';
import { getModuleTheme, getStaffModuleByKey } from '@/app/lib/modules';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import {
  Heart, Building2, MapPin, Activity, AlertTriangle, CheckCircle,
  BarChart2, ChevronDown, RefreshCw, Home, Zap, Filter, X,
  ArrowLeft, Stethoscope, RadioTower, LayoutGrid,
} from 'lucide-react';

// ─── Colour palette ───────────────────────────────────────────
const PALETTE = [
  '#3b82f6','#ef4444','#22c55e','#f97316','#8b5cf6',
  '#14b8a6','#ec4899','#eab308','#06b6d4','#84cc16',
  '#f43f5e','#a855f7','#10b981','#fb923c','#60a5fa',
];

const COORD_COLORS = {
  sheet_exact:     '#22c55e',
  facility_match:  '#3b82f6',
  tambon_centroid: '#f97316',
  manual:          '#8b5cf6',
  unknown:         '#ef4444',
};

const COORD_LABEL = {
  sheet_exact:     'พิกัดจากเอกสาร',
  facility_match:  'จับคู่หน่วยบริการ',
  tambon_centroid: 'จุดศูนย์กลางตำบล',
  manual:          'กรอกเอง',
  unknown:         'ไม่ทราบ',
};

// ─── Helpers ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'sky', warn = false }) {
  const tone = {
    sky:     'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red:     'bg-red-50 text-red-700 border-red-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    violet:  'bg-violet-50 text-violet-700 border-violet-200',
    cyan:    'bg-cyan-50 text-cyan-700 border-cyan-200',
    fuchsia: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    teal:    'bg-teal-50 text-teal-700 border-teal-200',
  }[color];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 truncate">{label}</p>
        <p className="text-3xl font-black leading-none mt-1 text-slate-950">{value?.toLocaleString()}</p>
        {sub && <p className="text-xs leading-5 text-slate-500 mt-1">{sub}</p>}
      </div>
      {warn && (
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
      )}
    </div>
  );
}

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 ${className}`}>
      <p className="text-sm font-bold text-slate-800 mb-4">{title}</p>
      {children}
    </div>
  );
}

function SectionHeader({ id, icon: Icon, kicker, title, description, tone }) {
  return (
    <div id={id} className="scroll-mt-24 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${tone} flex items-center justify-center shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500">{kicker}</p>
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function TopicNavCard({ href, icon: Icon, title, description, tone, bar }) {
  return (
    <a
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 ${bar}`} />
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl ${tone} flex items-center justify-center text-white shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
    </a>
  );
}

// Custom tooltip shared styles
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-bold text-slate-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-semibold text-slate-900">{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.payload.fill }} />
        <span className="font-bold text-slate-800">{p.name}</span>
      </div>
      <p className="text-slate-600 mt-1">จำนวน: <span className="font-bold text-slate-900">{Number(p.value).toLocaleString()}</span></p>
      <p className="text-slate-400">{p.payload.percent?.toFixed(1)}%</p>
    </div>
  );
}

// ─── Axis tick truncated ───────────────────────────────────────
function ShortTick({ x, y, payload, maxLen = 8 }) {
  const t = String(payload.value ?? '');
  const label = t.length > maxLen ? t.slice(0, maxLen) + '…' : t;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="#64748b" fontSize={11}>
      {label}
    </text>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState(undefined);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestedModule = searchParams.get('module');
  const dashboardModule = ['aed', 'dental', 'health-stations'].includes(requestedModule)
    ? requestedModule
    : null;

  // Filters
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const stats = useMemo(() => data?.totalStats || {}, [data]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/dashboard${dashboardModule ? `?module=${dashboardModule}` : ''}`);
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dashboardModule]);

  useEffect(() => {
    queueMicrotask(() => {
      apiFetch(`/api/auth/me`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setUser)
        .catch(() => setUser(null));
      load();
    });
  }, [load]);

  // ── Derived: districts list ──
  const allDistricts = useMemo(() => {
    if (!data) return [];
    const sourceRows = dashboardModule === 'dental'
      ? data.dentalByDistrict
      : dashboardModule === 'health-stations'
        ? data.hsByDistrict
        : data.aedByDistrict;
    return [...new Set((sourceRows || []).map((d) => d.name).filter(Boolean))].sort();
  }, [data, dashboardModule]);

  const allSources = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.aedBySheet.map((d) => d.name).filter(Boolean))];
  }, [data]);

  // ── Filtered tambon data ──
  const tambonData = useMemo(() => {
    if (!data) return [];
    let rows = data.aedByTambon;
    if (filterDistrict) rows = rows.filter((r) => r.district_name === filterDistrict);
    if (filterSource) {
      // no source on tambon level — skip
    }
    return rows.slice(0, 20);
  }, [data, filterDistrict, filterSource]);

  // ── Coordinate source enriched with labels/colors ──
  const coordData = useMemo(() => {
    if (!data) return [];
    const total = data.aedByCoordSource.reduce((s, r) => s + Number(r.total), 0);
    return data.aedByCoordSource.map((r) => ({
      ...r,
      fill: COORD_COLORS[r.name] || '#94a3b8',
      label: COORD_LABEL[r.name] || r.name,
      percent: total ? (Number(r.total) / total) * 100 : 0,
    }));
  }, [data]);

  // ── Active/inactive pie ──
  const activeData = useMemo(() => {
    if (!data) return [];
    const map = Object.fromEntries(data.aedActiveInactive.map((r) => [r.is_active, Number(r.total)]));
    return [
      { name: 'ใช้งานได้', value: map[1] || 0, fill: '#22c55e' },
      { name: 'ปิดใช้งาน', value: map[0] || 0, fill: '#ef4444' },
    ];
  }, [data]);

  // ── Sheet pie ──
  const sheetData = useMemo(() => {
    if (!data) return [];
    const total = data.aedBySheet.reduce((s, r) => s + Number(r.total), 0);
    return data.aedBySheet.map((r, i) => ({
      ...r,
      total: Number(r.total),
      fill: PALETTE[i % PALETTE.length],
      percent: total ? (Number(r.total) / total) * 100 : 0,
    }));
  }, [data]);

  const typecodeData = useMemo(() => {
    if (!data) return [];
    return data.aedByTypecode.map((r, i) => ({ ...r, total: Number(r.total), fill: PALETTE[i % PALETTE.length] }));
  }, [data]);

  const dentalDistrictData = useMemo(() => {
    if (!data) return [];
    const rows = data.dentalByDistrict || [];
    if (!filterDistrict) return rows;
    return rows.filter((r) => r.name === filterDistrict);
  }, [data, filterDistrict]);

  const hsDistrictData = useMemo(() => {
    if (!data) return [];
    const rows = data.hsByDistrict || [];
    if (!filterDistrict) return rows;
    return rows.filter((r) => r.name === filterDistrict);
  }, [data, filterDistrict]);

  const dentalReadyData = useMemo(() => {
    const ready = Number(stats?.dental_units_ready || 0);
    const total = Number(stats?.dental_units_total || 0);
    return [
      { name: 'พร้อมใช้', value: ready, fill: '#22c55e', percent: total ? (ready / total) * 100 : 0 },
      { name: 'ยังไม่พร้อม', value: Math.max(total - ready, 0), fill: '#ef4444', percent: total ? ((total - ready) / total) * 100 : 0 },
    ];
  }, [stats]);

  const hsOpenData = useMemo(() => {
    const open = Number(stats?.hs_open || 0);
    const total = Number(stats?.hs_total || 0);
    return [
      { name: 'เปิดบริการ', value: open, fill: '#0ea5e9', percent: total ? (open / total) * 100 : 0 },
      { name: 'ปิดบริการ', value: Math.max(total - open, 0), fill: '#94a3b8', percent: total ? ((total - open) / total) * 100 : 0 },
    ];
  }, [stats]);

  if (loading || user === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 text-sm">กำลังโหลดข้อมูล Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-red-500">
          <AlertTriangle className="w-10 h-10" />
          <p className="font-medium">{error}</p>
          <button onClick={load} className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-sm font-medium hover:bg-red-100 transition-all">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const s = stats;
  const isAdmin = user?.role === 'admin';
  const isStaff = Boolean(user?.role && user.role !== 'admin');
  const modulePermissionByDashboard = {
    aed: 'manage_aed',
    dental: 'manage_dental',
    'health-stations': 'manage_health_stations',
  };
  const canOpenFullDashboard = isAdmin || Boolean(user?.modulePermissions?.dashboard);
  const canOpenModuleDashboard = isAdmin || (
    dashboardModule &&
    Boolean(user?.modulePermissions?.[modulePermissionByDashboard[dashboardModule]])
  );
  const canViewDashboard = dashboardModule ? canOpenModuleDashboard || canOpenFullDashboard : canOpenFullDashboard;
  const showAed = !dashboardModule || dashboardModule === 'aed';
  const showDental = !dashboardModule || dashboardModule === 'dental';
  const showHealthStations = !dashboardModule || dashboardModule === 'health-stations';
  const dashboardTitle = dashboardModule === 'aed'
    ? 'Dashboard AED'
    : dashboardModule === 'dental'
      ? 'Dashboard ทันตกรรม'
      : dashboardModule === 'health-stations'
        ? 'Dashboard Health Station'
        : 'Dashboard ข้อมูลสุขภาพ สตูล';
  const dashboardDescription = dashboardModule
    ? 'แสดงข้อมูลเฉพาะโมดูลที่เลือก'
    : 'แยกข้อมูลตามหัวข้อ AED, ทันตกรรม และ Health Station';
  const staffModuleKey = dashboardModule === 'aed' && user?.modulePermissions?.manage_aed
    ? 'manage_aed'
    : dashboardModule === 'dental' && user?.modulePermissions?.manage_dental
      ? 'manage_dental'
      : dashboardModule === 'health-stations' && user?.modulePermissions?.manage_health_stations
        ? 'manage_health_stations'
        : 'dashboard';
  const staffModuleConfig = isStaff ? getStaffModuleByKey(staffModuleKey) : null;
  const returnHref = isAdmin ? '/admin' : isStaff ? '/staff' : '/map';
  const returnTitle = isAdmin
    ? 'กลับหน้า Admin'
    : isStaff
      ? 'กลับหน้า Workspace เจ้าหน้าที่'
      : 'กลับหน้าแผนที่';

  if (isStaff && !canViewDashboard) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4">
          <div className="rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
            <h1 className="mt-3 text-xl font-bold text-slate-900">ยังไม่มีสิทธิ์เข้า Dashboard นี้</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              กรุณากลับไปเลือกโมดูลที่ได้รับสิทธิ์ หรือขอให้แอดมินเปิดสิทธิ์เพิ่มเติม
            </p>
            <Link
              href="/staff"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              กลับหน้าโมดูลของฉัน
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {isAdmin && <AdminSidebar />}
      {isStaff && staffModuleConfig && (
        <div className="p-4 md:p-6 lg:p-0">
          <StaffModuleSidebar
            moduleConfig={staffModuleConfig}
            theme={getModuleTheme(staffModuleKey)}
            permissions={user.modulePermissions || {}}
          />
        </div>
      )}
      <div className={isAdmin ? 'ml-64 min-h-screen' : isStaff ? 'lg:ml-72 min-h-screen' : 'min-h-screen'}>
      {isAdmin && <AdminNavbar user={user} />}
      {/* ── Navbar ── */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={returnHref}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              title={returnTitle}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 shadow-sm">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight text-slate-900">{dashboardTitle}</p>
                <p className="truncate text-xs text-slate-500">{dashboardDescription}</p>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto] xl:max-w-xl xl:flex-1">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-9 py-2 text-xs text-slate-700 shadow-sm transition-all focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              >
                <option value="">ทุกอำเภอ</option>
                {allDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {showAed && <div className="relative">
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-7 text-xs text-slate-700 shadow-sm transition-all focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              >
                <option value="">ทุกแหล่งข้อมูล</option>
                {allSources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>}
            {(filterDistrict || (showAed && filterSource)) && (
              <button
                onClick={() => { setFilterDistrict(''); setFilterSource(''); }}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-all hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <X className="w-3.5 h-3.5" />ล้างฟิลเตอร์
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={load}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 transition-all hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              รีเฟรช
            </button>
            {isStaff && (
              <Link
                href="/staff"
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
                <LayoutGrid className="w-3.5 h-3.5" />
                โมดูลของฉัน
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {!dashboardModule && <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <TopicNavCard href="#aed" icon={Heart} title="AED" description="จุดบริการ AED, สถานะใช้งาน, พิกัด และจำนวนเครื่อง" tone="bg-sky-600" bar="bg-sky-600" />
          <TopicNavCard href="#facilities" icon={Building2} title="หน่วยบริการ" description="หน่วยบริการสาธารณสุข แยกตามประเภทและอำเภอ" tone="bg-blue-700" bar="bg-blue-700" />
          <TopicNavCard href="#dental" icon={Stethoscope} title="ทันตกรรม" description="หน่วยทันตกรรมและความพร้อมของยูนิต" tone="bg-violet-600" bar="bg-violet-600" />
          <TopicNavCard href="#health-stations" icon={RadioTower} title="Health Station" description="สถานีสุขภาพชุมชนและสถานะเปิดบริการ" tone="bg-teal-600" bar="bg-teal-600" />
        </section>}

        {showAed && <section className="space-y-5">
          <SectionHeader
            id="aed"
            icon={Heart}
            kicker="AED"
            title="ข้อมูล AED"
            description="แสดงเฉพาะข้อมูลจุดบริการ AED และสถานะเครื่อง"
            tone="bg-sky-600"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Heart} color="sky" label="AED รวมทั้งหมด" value={s?.aed_total} sub={`ใช้งานได้ ${s?.aed_active} เครื่อง`} />
            <StatCard icon={CheckCircle} color="emerald" label="AED พร้อมใช้งาน" value={s?.aed_active} sub={`${s?.aed_total ? ((s.aed_active/s.aed_total)*100).toFixed(0) : 0}% ของทั้งหมด`} />
            <StatCard icon={AlertTriangle} color="amber" label="รอใส่พิกัด" value={s?.aed_no_coords} warn={Number(s?.aed_no_coords) > 0} sub="จุดที่ยังไม่มีพิกัด" />
            <StatCard icon={Zap} color="cyan" label="จำนวนเครื่องรวม" value={data.aedQuantityByDistrict.reduce((sum, row) => sum + Number(row.quantity || 0), 0)} sub="รวมจาก field quantity" />
          </div>

        {/* ── Row 2: AED by district + active/inactive pie ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <ChartCard title="จำนวน AED แยกตามอำเภอ" className="xl:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={filterDistrict
                  ? data.aedByDistrict.filter((r) => r.name === filterDistrict)
                  : data.aedByDistrict}
                layout="vertical"
                margin={{ left: 80, right: 30, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" tick={<ShortTick maxLen={10} />} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="active" name="ใช้งานได้" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="total" name="รวม" fill="#3b82f6" radius={[0, 4, 4, 0]}
                  label={{ position: 'right', fontSize: 11, fill: '#475569' }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="สัดส่วน AED ที่ใช้งานได้">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={activeData}
                  cx="50%"
                  cy="45%"
                  innerRadius={68}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {activeData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center justify-center gap-6">
              {activeData.map((d) => (
                <div key={d.name} className="text-center">
                  <p className="text-2xl font-black" style={{ color: d.fill }}>{d.value}</p>
                  <p className="text-xs text-slate-500">{d.name}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* ── Row 3: AED by tambon + coordinate source pie ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <ChartCard
            title={`AED แยกตามตำบล${filterDistrict ? ` (อ.${filterDistrict})` : ' (แสดง 20 อันดับแรก)'}`}
            className="xl:col-span-2"
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={tambonData}
                layout="vertical"
                margin={{ left: 110, right: 30, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={<ShortTick maxLen={13} />} width={110} />
                <Tooltip
                  content={(props) => {
                    const { active, payload, label } = props;
                    if (!active || !payload?.length) return null;
                    const row = tambonData.find((r) => r.name === label);
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-xs">
                        <p className="font-bold text-slate-800">{label}</p>
                        <p className="text-slate-400 text-[11px] mb-1">{row?.district_name}</p>
                        {payload.map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                            <span className="text-slate-600">{p.name}:</span>
                            <span className="font-semibold">{p.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="total" name="AED" radius={[0, 4, 4, 0]}>
                  {tambonData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="ที่มาของพิกัด AED">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={coordData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="total"
                  nameKey="label"
                >
                  {coordData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {coordData.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                  <span className="text-xs text-slate-700 flex-1 truncate">{d.label}</span>
                  <span className="text-xs font-bold text-slate-900">{Number(d.total)}</span>
                  <span className="text-[11px] text-slate-400 w-10 text-right">{d.percent.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* ── Row 4: AED by source sheet + by typecode + quantity ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <ChartCard title="AED แยกตามแหล่งงบประมาณ / แท็บต้นทาง">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sheetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="name"
                >
                  {sheetData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {sheetData.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                  <span className="text-xs text-slate-700 flex-1 truncate">{d.name}</span>
                  <span className="text-xs font-bold text-slate-900">{d.total}</span>
                  <span className="text-[11px] text-slate-400 w-10 text-right">{d.percent.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="AED แยกตามประเภทหน่วยดูแล">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={typecodeData.slice(0, 10)}
                layout="vertical"
                margin={{ left: 70, right: 30, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={<ShortTick maxLen={9} />} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="AED" radius={[0, 4, 4, 0]}>
                  {typecodeData.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="จำนวนเครื่อง AED (quantity) แยกตามอำเภอ">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={filterDistrict
                  ? data.aedQuantityByDistrict.filter((r) => r.name === filterDistrict)
                  : data.aedQuantityByDistrict}
                layout="vertical"
                margin={{ left: 80, right: 30, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={<ShortTick maxLen={10} />} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="quantity" name="เครื่องทั้งหมด" stackId="a" fill="#3b82f6" />
                <Bar dataKey="damaged"  name="ชำรุด"          stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Row 5: Health facilities ── */}
        {!dashboardModule && <>
        <SectionHeader
          id="facilities"
          icon={Building2}
          kicker="Facilities"
          title="ข้อมูลหน่วยบริการสาธารณสุข"
          description="แสดงเฉพาะจำนวนหน่วยบริการ แยกตามประเภทและอำเภอ"
          tone="bg-blue-700"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard icon={Building2} color="violet" label="หน่วยบริการทั้งหมด" value={s?.fac_total} sub={`ใช้งานได้ ${s?.fac_active} หน่วย`} />
          <StatCard icon={MapPin} color="cyan" label="พื้นที่ให้บริการ" value={data.facByDistrict.length} sub="จำนวนอำเภอที่มีข้อมูลหน่วยบริการ" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <ChartCard title="หน่วยบริการสาธารณสุข แยกตามประเภท">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={data.facByTypecode}
                layout="vertical"
                margin={{ left: 70, right: 30, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={<ShortTick maxLen={9} />} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="หน่วยบริการ" radius={[0, 4, 4, 0]}>
                  {data.facByTypecode.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="หน่วยบริการสาธารณสุข แยกตามอำเภอ">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={filterDistrict
                  ? data.facByDistrict.filter((r) => r.name === filterDistrict)
                  : data.facByDistrict}
                layout="vertical"
                margin={{ left: 80, right: 30, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={<ShortTick maxLen={10} />} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="หน่วยบริการ" radius={[0, 4, 4, 0]}>
                  {data.facByDistrict.map((_, i) => (
                    <Cell key={i} fill={PALETTE[(i + 5) % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        </>}

        {/* ── Row 6: Detail tables ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* AED by district table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-800">ตารางสรุป AED รายอำเภอ</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">อำเภอ</th>
                    <th className="px-4 py-3 text-right">AED รวม</th>
                    <th className="px-4 py-3 text-right">ใช้งานได้</th>
                    <th className="px-4 py-3 text-right">%ใช้งาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(filterDistrict
                    ? data.aedByDistrict.filter((r) => r.name === filterDistrict)
                    : data.aedByDistrict
                  ).map((row) => {
                    const pct = row.total ? ((Number(row.active) / Number(row.total)) * 100).toFixed(0) : 0;
                    return (
                      <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.name || '-'}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">{Number(row.total)}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600">{Number(row.active)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 w-7 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AED quantity table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-800">จำนวนเครื่อง AED (total vs ชำรุด) รายอำเภอ</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">อำเภอ</th>
                    <th className="px-4 py-3 text-right">เครื่องทั้งหมด</th>
                    <th className="px-4 py-3 text-right">ชำรุด</th>
                    <th className="px-4 py-3 text-right">%สภาพดี</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(filterDistrict
                    ? data.aedQuantityByDistrict.filter((r) => r.name === filterDistrict)
                    : data.aedQuantityByDistrict
                  ).map((row) => {
                    const ok = Number(row.quantity) - Number(row.damaged);
                    const pct = row.quantity ? ((ok / Number(row.quantity)) * 100).toFixed(0) : 0;
                    return (
                      <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.name || '-'}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">{Number(row.quantity)}</td>
                        <td className="px-4 py-3 text-right font-mono text-red-500">{Number(row.damaged)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 w-7 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          ระบบ AED จังหวัดสตูล · ข้อมูล ณ วันที่นำเข้าล่าสุด
        </p>
        </section>}

        {/* ── Row 7: Dental section ── */}
        {showDental && <section className="space-y-5">
          <SectionHeader
            id="dental"
            icon={Stethoscope}
            kicker="Dental"
            title="ข้อมูลทันตกรรม"
            description="แสดงเฉพาะข้อมูลหน่วยทันตกรรมและความพร้อมของยูนิต"
            tone="bg-violet-600"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={Stethoscope} color="fuchsia" label="หน่วยทันตกรรม" value={s?.dental_total} sub={`เปิดบริการ ${s?.dental_active} หน่วย`} />
            <StatCard icon={CheckCircle} color="emerald" label="ยูนิตพร้อมใช้" value={s?.dental_units_ready} sub={`จากทั้งหมด ${s?.dental_units_total} ตัว`} />
            <StatCard icon={Activity} color="violet" label="อัตราพร้อมใช้" value={s?.dental_units_total ? `${((s.dental_units_ready / s.dental_units_total) * 100).toFixed(0)}%` : '0%'} sub="พร้อมใช้เทียบกับยูนิตทั้งหมด" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <ChartCard title="หน่วยทันตกรรม รายอำเภอ" className="xl:col-span-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={dentalDistrictData}
                  layout="vertical"
                  margin={{ left: 80, right: 30, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={<ShortTick maxLen={10} />} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="หน่วยบริการ" stackId="a" fill="#a855f7" />
                  <Bar dataKey="ready_count" name="เก้าอี้พร้อมใช้" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="สัดส่วนเก้าอี้ทันตกรรมพร้อมใช้">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={dentalReadyData}
                    cx="50%"
                    cy="48%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dentalReadyData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center justify-center gap-6">
                {dentalReadyData.map((d) => (
                  <div key={d.name} className="text-center">
                    <p className="text-2xl font-black" style={{ color: d.fill }}>{d.value}</p>
                    <p className="text-xs text-slate-500">{d.name}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-800">ตารางหน่วยทันตกรรม รายอำเภอ</p>
            </div>
            {dentalDistrictData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">อำเภอ</th>
                      <th className="px-4 py-3 text-right">หน่วยบริการ</th>
                      <th className="px-4 py-3 text-right">เก้าอี้ทั้งหมด</th>
                      <th className="px-4 py-3 text-right">พร้อมใช้</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dentalDistrictData.map((row) => (
                      <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.name || '-'}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">{Number(row.total)}</td>
                        <td className="px-4 py-3 text-right font-mono text-violet-600">{Number(row.unit_count)}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600">{Number(row.ready_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 gap-2 text-slate-400">
                <Stethoscope className="w-8 h-8" />
                <p className="text-sm">ไม่พบข้อมูลทันตกรรมตามฟิลเตอร์ที่เลือก</p>
              </div>
            )}
          </div>
        </section>}

        {/* ── Row 8: Health Station section ── */}
        {showHealthStations && <section className="space-y-5">
          <SectionHeader
            id="health-stations"
            icon={RadioTower}
            kicker="Health Station"
            title="ข้อมูล Health Station"
            description="แสดงเฉพาะข้อมูลสถานี Health Station และสถานะเปิดบริการ"
            tone="bg-teal-600"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={RadioTower} color="teal" label="Health Station" value={s?.hs_total} sub={`เปิดให้บริการ ${s?.hs_open} สถานี`} />
            <StatCard icon={CheckCircle} color="emerald" label="เปิดบริการ" value={s?.hs_open} sub={`${s?.hs_total ? ((s.hs_open / s.hs_total) * 100).toFixed(0) : 0}% ของทั้งหมด`} />
            <StatCard icon={Activity} color="cyan" label="มี อสม. ประจำ" value={s?.hs_aom} sub="สถานีที่มี อสม. รับผิดชอบ" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <ChartCard title="Health Station รายอำเภอ" className="xl:col-span-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={hsDistrictData}
                  layout="vertical"
                  margin={{ left: 80, right: 30, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={<ShortTick maxLen={10} />} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="สถานีทั้งหมด" stackId="a" fill="#06b6d4" />
                  <Bar dataKey="open_count" name="เปิดให้บริการ" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="สัดส่วนสถานีที่เปิดให้บริการ">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={hsOpenData}
                    cx="50%"
                    cy="48%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {hsOpenData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center justify-center gap-6">
                {hsOpenData.map((d) => (
                  <div key={d.name} className="text-center">
                    <p className="text-2xl font-black" style={{ color: d.fill }}>{d.value}</p>
                    <p className="text-xs text-slate-500">{d.name}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-800">ตาราง Health Station รายอำเภอ</p>
            </div>
            {hsDistrictData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">อำเภอ</th>
                      <th className="px-4 py-3 text-right">สถานี</th>
                      <th className="px-4 py-3 text-right">เปิดให้บริการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hsDistrictData.map((row) => (
                      <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.name || '-'}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">{Number(row.total)}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600">{Number(row.open_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 gap-2 text-slate-400">
                <RadioTower className="w-8 h-8" />
                <p className="text-sm">ไม่พบข้อมูล Health Station ตามฟิลเตอร์ที่เลือก</p>
              </div>
            )}
          </div>
        </section>}

        <p className="text-center text-xs text-slate-400 pb-4">
          ระบบข้อมูลสุขภาพ สตูล · ข้อมูล ณ วันที่นำเข้าล่าสุด
        </p>
      </div>
      </div>
    </div>
  );
}
