'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart, X, MapPin, Activity, LogIn, LayoutDashboard,
  LogOut, Shield, ChevronLeft, ChevronRight, AlertCircle,
  Zap, BarChart2, ChevronDown,
} from 'lucide-react';

const MapView = dynamic(() => import('@/app/components/MapView'), { ssr: false });

// ─── Colour palette for AED types ───
const TYPE_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];
const DIST_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#14b8a6', '#ec4899', '#eab308'];

// ─── Dashboard Modal ───
function DashboardModal({ facilities, onClose }) {
  const [tab, setTab] = useState('district');

  const total = facilities.length;
  const active = facilities.filter((f) => f.is_active).length;
  const inactive = total - active;
  const typeCount = useMemo(
    () => [...new Set(facilities.map((f) => f.manager_typecode).filter(Boolean))].length,
    [facilities],
  );

  const byDistrict = useMemo(() => {
    const m = {};
    facilities.forEach((f) => {
      const k = f.district_name || 'ไม่ระบุ';
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [facilities]);

  const byType = useMemo(() => {
    const m = {};
    facilities.forEach((f) => {
      const k = f.manager_typecode || 'ไม่ระบุ';
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [facilities]);

  const maxDist = byDistrict[0]?.[1] || 1;
  const maxType = byType[0]?.[1] || 1;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Dashboard</p>
              <p className="text-white/70 text-xs">สรุปข้อมูล AED จังหวัดสตูล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-2.5 p-4 flex-shrink-0 bg-slate-50 border-b border-slate-100">
          {[
            { label: 'AED รวม', value: total, bg: 'bg-emerald-500', shadow: 'shadow-emerald-200' },
            { label: 'ใช้งานได้', value: active, bg: 'bg-sky-500', shadow: 'shadow-sky-200' },
            { label: 'ปิดใช้งาน', value: inactive, bg: 'bg-orange-500', shadow: 'shadow-orange-200' },
            { label: 'ประเภท', value: typeCount, bg: 'bg-violet-500', shadow: 'shadow-violet-200' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2.5 text-white text-center shadow-lg ${s.shadow}`}>
              <p className="text-xl font-black leading-none">{s.value}</p>
              <p className="text-[10px] mt-0.5 opacity-90 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4 flex-shrink-0 bg-white">
          {[
            { key: 'district', label: 'แยกตามอำเภอ' },
            { key: 'type', label: 'แยกตามประเภท' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'district' &&
            byDistrict.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                  style={{ background: DIST_COLORS[i % DIST_COLORS.length] }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700 truncate">{name}</span>
                    <span className="text-xs font-bold text-slate-900 ml-2 flex-shrink-0">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${((count / maxDist) * 100).toFixed(1)}%`,
                        background: DIST_COLORS[i % DIST_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          {tab === 'type' &&
            byType.map(([typecode, count], i) => (
              <div key={typecode} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: TYPE_PALETTE[i % TYPE_PALETTE.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700 truncate">{typecode}</span>
                    <span className="text-xs font-bold text-slate-900 ml-2 flex-shrink-0">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${((count / maxType) * 100).toFixed(1)}%`,
                        background: TYPE_PALETTE[i % TYPE_PALETTE.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  const router = useRouter();
  const [healthFacilities, setHealthFacilities] = useState([]);
  const [aedList, setAedList] = useState([]);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState(null);

  // Map layer controls
  const [tileKey, setTileKey] = useState('street');
  const [showDistricts, setShowDistricts] = useState(true);
  const [showTambons, setShowTambons] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showAED, setShowAED] = useState(true);

  // Filters
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterTambon, setFilterTambon] = useState('');

  // Dashboard
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    fetch('/stn-aed/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => {});

    Promise.all([
      fetch('/stn-aed/api/facilities').then((r) => r.json()),
      fetch('/stn-aed/api/aed').then((r) => r.json()),
    ])
      .then(([fac, aed]) => {
        if (Array.isArray(fac)) setHealthFacilities(fac);
        if (Array.isArray(aed)) setAedList(aed);
        if (!Array.isArray(fac) && !Array.isArray(aed)) setError('ไม่สามารถโหลดข้อมูลได้');
      })
      .catch(() => setError('ไม่สามารถเชื่อมต่อฐานข้อมูล'));
  }, []);

  const handleLogout = async () => {
    await fetch('/stn-aed/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // Derived data — types/districts/tambons from AED (primary layer)
  const allTypes = useMemo(
    () => [...new Set(aedList.map((f) => f.manager_typecode).filter(Boolean))].sort(),
    [aedList],
  );
  const allDistricts = useMemo(() => {
    const fromFac = healthFacilities.map((f) => f.district_name);
    const fromAed = aedList.map((f) => f.district_name);
    return [...new Set([...fromFac, ...fromAed].filter(Boolean))].sort();
  }, [healthFacilities, aedList]);
  const allTambons = useMemo(() => {
    const fromFac = healthFacilities
      .filter((f) => !filterDistrict || f.district_name === filterDistrict)
      .map((f) => f.tambon);
    const fromAed = aedList
      .filter((f) => !filterDistrict || f.district_name === filterDistrict)
      .map((f) => f.tambon_name);
    return [...new Set([...fromFac, ...fromAed].filter(Boolean))].sort();
  }, [healthFacilities, aedList, filterDistrict]);

  const typeStats = useMemo(() => {
    const m = {};
    aedList.forEach((f) => { if (f.manager_typecode) m[f.manager_typecode] = (m[f.manager_typecode] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [aedList]);

  const activeCount = useMemo(() => aedList.filter((f) => f.is_active).length, [aedList]);

  // Filtered layers passed to MapView
  const filteredFacilities = useMemo(
    () =>
      showFacilities
        ? healthFacilities.filter((f) => {
            if (filterDistrict && f.district_name !== filterDistrict) return false;
            if (filterTambon && f.tambon !== filterTambon) return false;
            return f.lat != null && f.lon != null;
          })
        : [],
    [showFacilities, healthFacilities, filterDistrict, filterTambon],
  );

  const filteredAed = useMemo(
    () =>
      showAED
        ? aedList.filter((f) => {
            if (selectedTypes.size > 0 && !selectedTypes.has(f.manager_typecode)) return false;
            if (filterDistrict && f.district_name !== filterDistrict) return false;
            if (filterTambon && f.tambon_name !== filterTambon) return false;
            return f.lat != null && f.lon != null;
          })
        : [],
    [showAED, aedList, selectedTypes, filterDistrict, filterTambon],
  );

  // Count of AED with known coords (for display)
  const aedWithCoords = useMemo(() => aedList.filter((f) => f.lat != null && f.lon != null).length, [aedList]);

  const toggleType = (t) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-200">
      {/* Dashboard Modal */}
      {showDashboard && (
        <DashboardModal facilities={aedList} onClose={() => setShowDashboard(false)} />
      )}

      {/* Fullscreen map */}
      <div className="absolute inset-0 z-0">
        <MapView
          facilities={filteredFacilities}
          aedPoints={filteredAed}
          tileKey={tileKey}
          showDistricts={showDistricts}
          showTambons={showTambons}
        />
      </div>

      {/* ─── Floating glass navbar ─── */}
      <div className="absolute top-0 left-0 right-0 z-[500] p-3">
        <nav className="bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-2xl px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/map" className="flex items-center gap-2.5 group flex-shrink-0">
           <img src="/stn-aed/img/logo.png" alt="AED Icon" className="w-10 h-10" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-tight">ระบบติดตามจุดบริการเครื่องกู้ชีพ AED สตูล</p>
              <p className="text-xs text-slate-500 leading-none">สำนักงานสาธารณสุขจังหวัดสตูล</p>
            </div>
          </Link>

          {/* Center stats */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">{activeCount}</span>
              <span className="text-xs text-slate-500 hidden sm:inline">AED ใช้งานได้</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs font-bold text-sky-700">{aedList.length}</span>
              <span className="text-xs text-slate-500 hidden sm:inline">จุด AED</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 shadow-sm hidden md:flex">
              <span className="text-[10px] font-bold text-teal-700 w-3 h-3 flex items-center justify-center">✚</span>
              <span className="text-xs font-bold text-teal-700">{healthFacilities.length}</span>
              <span className="text-xs text-slate-500 hidden sm:inline">หน่วยบริการ</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-700">{user.fullName}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">จัดการข้อมูล</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 transition-all border border-red-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 transition-all shadow-lg shadow-sky-500/25"
              >
                <LogIn className="w-3.5 h-3.5" />
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* ─── Left sidebar ─── */}
      <div
        className={`absolute z-[400] top-[76px] bottom-4 left-3 transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-2.5 h-full overflow-y-auto pr-0.5 pb-1">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/90 backdrop-blur-xl border border-red-200 text-red-600 text-xs shadow-lg flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── Stats overview ── */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-4 flex-shrink-0">
            <p className="text-white/80 text-[11px] font-semibold uppercase tracking-wider mb-3">สถิติภาพรวม</p>
            <div className="grid grid-cols-4 gap-1">
              <div className="text-center">
                <p className="text-white text-2xl font-black leading-none">{aedList.length}</p>
                <p className="text-white/70 text-[11px] mt-1">AED รวม</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-white text-2xl font-black leading-none">{activeCount}</p>
                <p className="text-white/70 text-[11px] mt-1">ใช้งานได้</p>
              </div>
              <div className="text-center border-r border-white/20">
                <p className="text-white text-2xl font-black leading-none">{healthFacilities.length}</p>
                <p className="text-white/70 text-[11px] mt-1">หน่วยบริการ</p>
              </div>
              <div className="text-center">
                <p className="text-white text-2xl font-black leading-none">{allTypes.length}</p>
                <p className="text-white/70 text-[11px] mt-1">ประเภท</p>
              </div>
            </div>
          </div>

          {/* ── Type breakdown ── */}
          {typeStats.length > 0 && (
            <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-xs font-bold text-slate-800">สัดส่วนประเภท AED</p>
              </div>
              <div className="space-y-1.5">
                {typeStats.slice(0, 6).map(([typecode, count], i) => (
                  <div key={typecode} className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: TYPE_PALETTE[i % TYPE_PALETTE.length] }}
                    />
                    <span className="text-xs text-slate-700 flex-1 truncate">{typecode}</span>
                    <span className="text-xs font-bold text-slate-900">{count}</span>
                  </div>
                ))}
                {typeStats.length > 6 && (
                  <p className="text-[11px] text-slate-400 pl-5">และอีก {typeStats.length - 6} ประเภท</p>
                )}
              </div>
            </div>
          )}

          {/* ── Layer toggles: data types ── */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
            <p className="text-xs font-bold text-slate-800 mb-2">ชั้นข้อมูล</p>
            <div className="space-y-2">
              {[
                { label: '♥ จุดบริการ AED', color: '#ef4444', checked: showAED, toggle: () => setShowAED((p) => !p), count: aedWithCoords },
                { label: '✚ หน่วยบริการสาธารณสุข', color: '#22c55e', checked: showFacilities, toggle: () => setShowFacilities((p) => !p), count: healthFacilities.length },
              ].map((layer) => (
                <label key={layer.label} className="flex items-center gap-2.5 cursor-pointer group" onClick={layer.toggle}>
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={layer.checked ? { background: layer.color, borderColor: layer.color } : { borderColor: '#cbd5e1', background: '#fff' }}
                  >
                    {layer.checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-slate-700 flex-1 group-hover:text-slate-900">{layer.label}</span>
                  <span className="text-[11px] text-slate-400">{layer.count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Filter by type ── */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-800">กรองประเภท AED</p>
              {selectedTypes.size > 0 && (
                <button
                  onClick={() => setSelectedTypes(new Set())}
                  className="text-[11px] text-sky-600 hover:text-sky-700 font-medium"
                >
                  ล้างทั้งหมด
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {allTypes.map((t, i) => {
                const count = typeStats.find(([k]) => k === t)?.[1] || 0;
                const checked = selectedTypes.size === 0 || selectedTypes.has(t);
                const color = TYPE_PALETTE[i % TYPE_PALETTE.length];
                return (
                  <label key={t} className="flex items-center gap-2 cursor-pointer group" onClick={() => toggleType(t)}>
                    <div
                      className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={checked ? { background: color, borderColor: color } : { borderColor: '#cbd5e1', background: '#fff' }}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs text-slate-700 flex-1 truncate group-hover:text-slate-900 leading-none">{t}</span>
                    <span className="text-[11px] text-slate-400">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Filter by location ── */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
            <p className="text-xs font-bold text-slate-800 mb-2">กรองตามตำแหน่ง</p>
            <div className="space-y-2">
              <div className="relative">
                <select
                  value={filterDistrict}
                  onChange={(e) => { setFilterDistrict(e.target.value); setFilterTambon(''); }}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 pr-7 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                >
                  <option value="">ทุกอำเภอ</option>
                  {allDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={filterTambon}
                  onChange={(e) => setFilterTambon(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 pr-7 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                >
                  <option value="">ทุกตำบล</option>
                  {allTambons.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ── Map layers ── */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
            <p className="text-xs font-bold text-slate-800 mb-2.5">ชั้นข้อมูลแผนที่</p>

            <p className="text-[11px] text-slate-500 font-semibold mb-1.5">แผนที่พื้นฐาน</p>
            <div className="space-y-1 mb-3">
              {[
                { key: 'street', label: 'OpenStreetMap', emoji: '🗺️' },
                { key: 'satellite', label: 'ภาพดาวเทียม', emoji: '🛰️' },
              ].map((opt) => (
                <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer" onClick={() => setTileKey(opt.key)}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${tileKey === opt.key ? 'border-sky-500' : 'border-slate-300'}`}>
                    {tileKey === opt.key && <div className="w-2 h-2 rounded-full bg-sky-500" />}
                  </div>
                  <span className="text-xs text-slate-700">{opt.emoji} {opt.label}</span>
                </label>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 font-semibold mb-1.5">ขอบเขตข้อมูล</p>
            <div className="space-y-1.5">
              {[
                { label: 'ขอบเขตอำเภอ', color: '#0ea5e9', checked: showDistricts, toggle: () => setShowDistricts((p) => !p) },
                { label: 'ขอบเขตตำบล', color: '#10b981', checked: showTambons, toggle: () => setShowTambons((p) => !p) },
              ].map((layer) => (
                <label key={layer.label} className="flex items-center gap-2.5 cursor-pointer group" onClick={layer.toggle}>
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={layer.checked ? { background: layer.color, borderColor: layer.color } : { borderColor: '#cbd5e1', background: '#fff' }}
                  >
                    {layer.checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="w-3.5 h-3 rounded flex-shrink-0 opacity-60" style={{ background: layer.color }} />
                  <span className="text-xs text-slate-700 group-hover:text-slate-900">{layer.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Count badge ── */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 px-3 py-2 shadow-lg flex-shrink-0 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="text-xs text-slate-600">
              AED <span className="font-bold text-slate-900">{filteredAed.length}</span>/<span className="text-slate-400">{aedWithCoords}</span>
              {showFacilities && (
                <>
                  {' · '}หน่วยบริการ <span className="font-bold text-slate-900">{filteredFacilities.length}</span>/<span className="text-slate-400">{healthFacilities.length}</span>
                </>
              )}
            </span>
          </div>

          {/* ── Bottom actions ── */}
          <div className="space-y-2 flex-shrink-0 pb-1">
            <button
              onClick={() => setShowDashboard(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-300/40 hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center justify-center gap-2"
            >
              <BarChart2 className="w-4 h-4" />
              Dashboard
            </button>
            {user ? (
              <Link
                href="/admin"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-xs font-bold shadow-lg shadow-sky-300/40 hover:from-sky-400 hover:to-sky-500 transition-all flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                จัดการข้อมูล
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 bg-white/90"
              >
                <LogIn className="w-4 h-4" />
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ─── Sidebar toggle ─── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`absolute z-[450] top-1/2 -translate-y-1/2 w-7 h-12 bg-white/90 backdrop-blur-xl border border-white/70 shadow-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition-all rounded-r-xl ${
          sidebarOpen ? 'left-[17.5rem]' : 'left-3'
        }`}
        title={sidebarOpen ? 'ซ่อนรายการ' : 'แสดงรายการ'}
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}
