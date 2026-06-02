'use client';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

import {
  Heart, MapPin, Activity, LogIn, LayoutDashboard,
  LogOut, Shield, ChevronLeft, ChevronRight, AlertCircle,
  Zap, BarChart2, ChevronDown, Stethoscope, RadioTower,
} from 'lucide-react';

const MapView = dynamic(() => import('@/app/components/MapView'), { ssr: false });
import AEDReportModal from '@/app/components/AEDReportModal';

const TYPE_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

const CATEGORIES = [
  { key: 'all',    label: 'ทั้งหมด',      color: '#64748b' },
  { key: 'aed',    label: 'AED',            color: '#ef4444' },
  { key: 'dental', label: 'ทันตกรรม',      color: '#7c3aed' },
  { key: 'health', label: 'Health Station', color: '#0ea5e9' },
];

const normalizeLocationName = (value = '', type = 'district') => {
  if (!value) return '';
  const text = String(value).trim().replace(/\s+/g, '');
  if (type === 'district') return text.replace(/^อำเภอ/, '');
  if (type === 'tambon') return text.replace(/^ตำบล/, '');
  return text;
};

const matchesLocation = (item, filterDistrict, filterTambon, districtKey = 'district_name', tambonKey = 'tambon_name') => {
  if (filterDistrict) {
    const districtMatch =
      normalizeLocationName(item[districtKey], 'district') === normalizeLocationName(filterDistrict, 'district');
    if (!districtMatch) return false;
  }
  if (filterTambon) {
    const tambonMatch =
      normalizeLocationName(item[tambonKey], 'tambon') === normalizeLocationName(filterTambon, 'tambon');
    if (!tambonMatch) return false;
  }
  return true;
};

export default function MapPage() {
  const router = useRouter();
  const [healthFacilities, setHealthFacilities] = useState([]);
  const [aedList, setAedList] = useState([]);
  const [dentalList, setDentalList] = useState([]);
  const [healthStationList, setHealthStationList] = useState([]);
  const [geoTambons, setGeoTambons] = useState([]);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState(null);
  const [reportAed, setReportAed] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');

  const [tileKey, setTileKey] = useState('street');
  const [showDistricts, setShowDistricts] = useState(true);
  const [showTambons, setShowTambons] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showAED, setShowAED] = useState(true);
  const [showDental, setShowDental] = useState(true);
  const [showHealthStations, setShowHealthStations] = useState(true);

  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterTambon, setFilterTambon] = useState('');

  useEffect(() => {
    fetch(`${BASE}/api/auth/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((sessionUser) => {
        setUser(sessionUser);
        if (
          sessionUser &&
          sessionUser.role !== 'admin' &&
          sessionUser.modulePermissions &&
          sessionUser.modulePermissions.map === false
        ) {
          router.replace('/staff');
        }
      })
      .catch(() => {});

    Promise.all([
      fetch(`${BASE}/api/facilities`).then((r) => r.json()),
      fetch(`${BASE}/api/aed`).then((r) => r.json()),
      fetch(`${BASE}/api/dental`).then((r) => r.json()),
      fetch(`${BASE}/api/health-stations`).then((r) => r.json()),
      fetch(`${BASE}/api/geo/tambons/list`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([fac, aed, dental, hs, tambons]) => {
        if (Array.isArray(fac)) setHealthFacilities(fac);
        if (Array.isArray(aed)) setAedList(aed);
        if (Array.isArray(dental)) setDentalList(dental);
        if (Array.isArray(hs)) setHealthStationList(hs);
        if (Array.isArray(tambons)) setGeoTambons(tambons);
        if (!Array.isArray(fac) && !Array.isArray(aed)) setError('ไม่สามารถโหลดข้อมูลได้');
      })
      .catch(() => setError('ไม่สามารถเชื่อมต่อฐานข้อมูล'));
  }, [router]);

  const handleLogout = async () => {
    await fetch(`${BASE}/api/auth/logout`, { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const allTypes = useMemo(
    () => [...new Set(aedList.map((f) => f.manager_typecode).filter(Boolean))].sort(),
    [aedList],
  );

  const allDistricts = useMemo(() => {
    const all = [
      ...healthFacilities.map((f) => f.district_name),
      ...aedList.map((f) => f.district_name),
      ...dentalList.map((f) => f.district_name),
      ...healthStationList.map((f) => f.district_name),
    ];
    return [...new Set(all.filter(Boolean))].sort();
  }, [healthFacilities, aedList, dentalList, healthStationList]);

  const allTambons = useMemo(() => {
    if (geoTambons.length > 0) {
      const districtKey = normalizeLocationName(filterDistrict, 'district');
      const names = geoTambons
        .filter((row) => !districtKey || normalizeLocationName(row.dis_name, 'district') === districtKey)
        .map((row) => row.tam_name)
        .filter(Boolean);
      return [...new Set(names)].sort();
    }

    const all = [
      ...healthFacilities.filter((f) => !filterDistrict || f.district_name === filterDistrict).map((f) => f.tambon),
      ...aedList.filter((f) => !filterDistrict || f.district_name === filterDistrict).map((f) => f.tambon_name),
      ...dentalList.filter((f) => !filterDistrict || f.district_name === filterDistrict).map((f) => f.tambon_name),
      ...healthStationList.filter((f) => !filterDistrict || f.district_name === filterDistrict).map((f) => f.tambon_name),
    ];
    return [...new Set(all.filter(Boolean))].sort();
  }, [geoTambons, healthFacilities, aedList, dentalList, healthStationList, filterDistrict]);

  const typeStats = useMemo(() => {
    const m = {};
    aedList.forEach((f) => { if (f.manager_typecode) m[f.manager_typecode] = (m[f.manager_typecode] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [aedList]);

  const activeCount = useMemo(() => aedList.filter((f) => f.is_active).length, [aedList]);
  const dentalActiveCount = useMemo(() => dentalList.filter((f) => f.status).length, [dentalList]);
  const hsOpenCount = useMemo(() => healthStationList.filter((f) => f.is_open).length, [healthStationList]);
  const aedWithCoords = useMemo(() => aedList.filter((f) => f.lat != null && f.lon != null).length, [aedList]);
  const dentalWithCoords = useMemo(() => dentalList.filter((f) => f.lat != null && f.lon != null).length, [dentalList]);
  const hsWithCoords = useMemo(() => healthStationList.filter((f) => f.lat != null && f.lon != null).length, [healthStationList]);

  const catShow = {
    aed:    activeCategory === 'all' || activeCategory === 'aed',
    dental: activeCategory === 'all' || activeCategory === 'dental',
    health: activeCategory === 'all' || activeCategory === 'health',
    fac:    activeCategory === 'all' || activeCategory === 'aed',
  };

  const filteredFacilities = useMemo(
    () => showFacilities && catShow.fac
      ? healthFacilities.filter((f) =>
          matchesLocation(f, filterDistrict, filterTambon, 'district_name', 'tambon') &&
          f.lat != null &&
          f.lon != null
        )
      : [],
    [showFacilities, catShow.fac, healthFacilities, filterDistrict, filterTambon],
  );

  const filteredAed = useMemo(
    () => showAED && catShow.aed
      ? aedList.filter((f) => {
          if (selectedTypes.size > 0 && !selectedTypes.has(f.manager_typecode)) return false;
          return matchesLocation(f, filterDistrict, filterTambon, 'district_name', 'tambon_name') &&
            f.lat != null &&
            f.lon != null;
        })
      : [],
    [showAED, catShow.aed, aedList, selectedTypes, filterDistrict, filterTambon],
  );

  const filteredDental = useMemo(
    () => showDental && catShow.dental
      ? dentalList.filter((f) =>
          matchesLocation(f, filterDistrict, filterTambon, 'district_name', 'tambon_name') &&
          f.lat != null &&
          f.lon != null
        )
      : [],
    [showDental, catShow.dental, dentalList, filterDistrict, filterTambon],
  );

  const filteredHealthStations = useMemo(
    () => showHealthStations && catShow.health
      ? healthStationList.filter((f) =>
          matchesLocation(f, filterDistrict, filterTambon, 'district_name', 'tambon_name') &&
          f.lat != null &&
          f.lon != null
        )
      : [],
    [showHealthStations, catShow.health, healthStationList, filterDistrict, filterTambon],
  );

  const toggleType = (t) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const currentStats = useMemo(() => {
    if (activeCategory === 'aed') return [
      { label: 'AED รวม',    value: aedList.length },
      { label: 'ใช้งานได้',  value: activeCount },
      { label: 'มีพิกัด',    value: aedWithCoords },
      { label: 'หน่วยบริการ', value: healthFacilities.length },
    ];
    if (activeCategory === 'dental') return [
      { label: 'หน่วยบริการ', value: dentalList.length },
      { label: 'เปิดบริการ',  value: dentalActiveCount },
      { label: 'มีพิกัด',     value: dentalWithCoords },
      { label: 'รวมยูนิต',    value: dentalList.reduce((s, f) => s + (f.dental_unit_count || 0), 0) },
    ];
    if (activeCategory === 'health') return [
      { label: 'Health Stn', value: healthStationList.length },
      { label: 'เปิดบริการ',  value: hsOpenCount },
      { label: 'ใน รพ.สต.',  value: healthStationList.filter((f) => f.station_type === 'rphst').length },
      { label: 'มีพิกัด',     value: hsWithCoords },
    ];
    return [
      { label: 'AED',          value: aedList.length },
      { label: 'ทันตกรรม',    value: dentalList.length },
      { label: 'Health Stn',  value: healthStationList.length },
      { label: 'หน่วยบริการ', value: healthFacilities.length },
    ];
  }, [activeCategory, aedList, activeCount, aedWithCoords, healthFacilities,
      dentalList, dentalActiveCount, dentalWithCoords,
      healthStationList, hsOpenCount, hsWithCoords]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-200">
      <div className="absolute inset-0 z-0">
        <MapView
          facilities={filteredFacilities}
          aedPoints={filteredAed}
          dentalPoints={filteredDental}
          healthStations={filteredHealthStations}
          tileKey={tileKey}
          showDistricts={showDistricts}
          showTambons={showTambons}
          onReportAED={(aed) => setReportAed(aed)}
        />
      </div>

      {/* Navbar */}
      <div className="absolute top-0 left-0 right-0 z-[500] p-3">
        <nav className="bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-2xl px-4 py-2.5 flex items-center justify-between gap-3">
          <Link href="/map" className="flex items-center gap-2.5 group flex-shrink-0">
            <Image src={`${BASE}/img/logo.png`} alt="Logo" width={40} height={40} className="w-10 h-10" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-tight">ระบบข้อมูลสุขภาพ สตูล</p>
              <p className="text-xs text-slate-500 leading-none">สำนักงานสาธารณสุขจังหวัดสตูล</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 flex-1 justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 shadow-sm">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-bold text-red-700">{aedList.length}</span>
              <span className="text-xs text-slate-500 hidden sm:inline">AED</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 shadow-sm">
              <Stethoscope className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-xs font-bold text-violet-700">{dentalList.length}</span>
              <span className="text-xs text-slate-500 hidden sm:inline">ทันตกรรม</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 shadow-sm">
              <RadioTower className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs font-bold text-sky-700">{healthStationList.length}</span>
              <span className="text-xs text-slate-500 hidden sm:inline">Health Station</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-700">{user.fullName}</span>
                </div>
                <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm">
                  <BarChart2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Dashboard</span>
                </Link>
                {user.role === 'admin' ? (
                  <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm">
                    <LayoutDashboard className="w-3.5 h-3.5" /><span className="hidden sm:inline">จัดการข้อมูล</span>
                  </Link>
                ) : (
                  <Link href="/staff/module/map" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm">
                    <LayoutDashboard className="w-3.5 h-3.5" /><span className="hidden sm:inline">Workspace</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 transition-all border border-red-100">
                  <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">ออกจากระบบ</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 transition-all shadow-lg shadow-sky-500/25">
                <LogIn className="w-3.5 h-3.5" />เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* Left sidebar */}
      <div className={`absolute z-[400] top-[76px] bottom-4 left-3 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0 opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col gap-2.5 h-full overflow-y-auto pr-0.5 pb-1">

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/90 backdrop-blur-xl border border-red-200 text-red-600 text-xs shadow-lg flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </div>
          )}

          {/* Category tabs */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-2 flex-shrink-0">
            <div className="grid grid-cols-4 gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`py-1.5 rounded-xl text-[11px] font-bold transition-all ${activeCategory === cat.key ? 'text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                  style={activeCategory === cat.key ? { background: cat.color } : {}}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div
            className="rounded-2xl shadow-xl p-4 flex-shrink-0"
            style={{
              background: activeCategory === 'dental'
                ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                : activeCategory === 'health'
                ? 'linear-gradient(135deg,#0ea5e9,#0284c7)'
                : 'linear-gradient(135deg,#10b981,#0d9488)',
            }}
          >
            <p className="text-white/80 text-[11px] font-semibold uppercase tracking-wider mb-3">สถิติภาพรวม</p>
            <div className="grid grid-cols-4 gap-1">
              {currentStats.map((s, i) => (
                <div key={i} className={`text-center ${i > 0 ? 'border-l border-white/20' : ''}`}>
                  <p className="text-white text-xl font-black leading-none">{s.value}</p>
                  <p className="text-white/70 text-[10px] mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Layer toggles */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
            <p className="text-xs font-bold text-slate-800 mb-2">ชั้นข้อมูล</p>
            <div className="space-y-2">
              {[
                { label: '♥ จุดบริการ AED',           color: '#ef4444', checked: showAED,            toggle: () => setShowAED((p) => !p),            count: aedWithCoords,           show: catShow.aed },
                { label: '✚ หน่วยบริการสาธารณสุข',    color: '#22c55e', checked: showFacilities,      toggle: () => setShowFacilities((p) => !p),     count: healthFacilities.length, show: catShow.fac },
                { label: '🦷 ยูนิตทันตกรรม',           color: '#7c3aed', checked: showDental,          toggle: () => setShowDental((p) => !p),         count: dentalWithCoords,        show: catShow.dental },
                { label: '📡 Health Station',           color: '#0ea5e9', checked: showHealthStations,  toggle: () => setShowHealthStations((p) => !p), count: hsWithCoords,            show: catShow.health },
              ].filter((l) => l.show).map((layer) => (
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

          {/* AED type breakdown */}
          {catShow.aed && typeStats.length > 0 && (
            <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-xs font-bold text-slate-800">สัดส่วนประเภท AED</p>
              </div>
              <div className="space-y-1.5">
                {typeStats.slice(0, 6).map(([typecode, count], i) => (
                  <div key={typecode} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: TYPE_PALETTE[i % TYPE_PALETTE.length] }} />
                    <span className="text-xs text-slate-700 flex-1 truncate">{typecode}</span>
                    <span className="text-xs font-bold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dental summary */}
          {activeCategory === 'dental' && (
            <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2.5">
                <Stethoscope className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                <p className="text-xs font-bold text-slate-800">สรุปสถานะยูนิต</p>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'พร้อมใช้งาน', value: dentalList.reduce((s, f) => s + (f.ready_unit_count || 0), 0),  color: 'text-emerald-600' },
                  { label: 'รอซ่อม',       value: dentalList.reduce((s, f) => s + (f.repair_unit_count || 0), 0), color: 'text-amber-600' },
                  { label: 'ชำรุด',        value: dentalList.reduce((s, f) => s + (f.broken_unit_count || 0), 0), color: 'text-red-600' },
                  { label: 'รวมทั้งหมด',  value: dentalList.reduce((s, f) => s + (f.dental_unit_count || 0), 0),  color: 'text-slate-700' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health Station summary */}
          {activeCategory === 'health' && (
            <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2.5">
                <RadioTower className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <p className="text-xs font-bold text-slate-800">สรุปอุปกรณ์</p>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'เครื่องชั่ง/วัดส่วนสูง', value: healthStationList.filter((f) => f.has_scale).length },
                  { label: 'เครื่องวัดความดัน',        value: healthStationList.filter((f) => f.has_bp_monitor).length },
                  { label: 'เครื่องเจาะ DTX',           value: healthStationList.filter((f) => f.has_dtx).length },
                  { label: 'สายวัดรอบเอว',              value: healthStationList.filter((f) => f.has_waist_tape).length },
                  { label: 'มี อสม. ประจำ',             value: healthStationList.filter((f) => f.has_aom_assigned).length },
                  { label: 'มีสื่อ/โปสเตอร์',           value: healthStationList.filter((f) => f.has_educational_materials).length },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-slate-500">{row.label}</span>
                    <span className="font-bold text-sky-700">{row.value}/{healthStationList.length}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AED type filter */}
          {catShow.aed && allTypes.length > 0 && (
            <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-800">กรองประเภท AED</p>
                {selectedTypes.size > 0 && (
                  <button onClick={() => setSelectedTypes(new Set())} className="text-[11px] text-sky-600 hover:text-sky-700 font-medium">ล้างทั้งหมด</button>
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
                        {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-xs text-slate-700 flex-1 truncate group-hover:text-slate-900 leading-none">{t}</span>
                      <span className="text-[11px] text-slate-400">{count}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location filter */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
            <p className="text-xs font-bold text-slate-800 mb-2">กรองตามตำแหน่ง</p>
            <div className="space-y-2">
              <div className="relative">
                <select value={filterDistrict} onChange={(e) => { setFilterDistrict(e.target.value); setFilterTambon(''); }}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 pr-7 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all">
                  <option value="">ทุกอำเภอ</option>
                  {allDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterTambon} onChange={(e) => setFilterTambon(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 pr-7 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all">
                  <option value="">ทุกตำบล</option>
                  {allTambons.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Map base layers */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-xl p-3 flex-shrink-0">
            <p className="text-xs font-bold text-slate-800 mb-2.5">ชั้นข้อมูลแผนที่</p>
            <p className="text-[11px] text-slate-500 font-semibold mb-1.5">แผนที่พื้นฐาน</p>
            <div className="space-y-1 mb-3">
              {[{ key: 'street', label: 'OpenStreetMap', emoji: '🗺️' }, { key: 'satellite', label: 'ภาพดาวเทียม', emoji: '🛰️' }].map((opt) => (
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
                { label: 'ขอบเขตตำบล',  color: '#10b981', checked: showTambons,   toggle: () => setShowTambons((p) => !p) },
              ].map((layer) => (
                <label key={layer.label} className="flex items-center gap-2.5 cursor-pointer group" onClick={layer.toggle}>
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={layer.checked ? { background: layer.color, borderColor: layer.color } : { borderColor: '#cbd5e1', background: '#fff' }}
                  >
                    {layer.checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="w-3.5 h-3 rounded flex-shrink-0 opacity-60" style={{ background: layer.color }} />
                  <span className="text-xs text-slate-700 group-hover:text-slate-900">{layer.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Count badge */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 px-3 py-2 shadow-lg flex-shrink-0">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
              {catShow.aed && <span><Heart className="inline w-3 h-3 text-red-500 mr-0.5" />AED <b className="text-slate-900">{filteredAed.length}</b></span>}
              {catShow.fac && <span>หน่วยบริการ <b className="text-slate-900">{filteredFacilities.length}</b></span>}
              {catShow.dental && <span>ทันตกรรม <b className="text-slate-900">{filteredDental.length}</b></span>}
              {catShow.health && <span>H.Stn <b className="text-slate-900">{filteredHealthStations.length}</b></span>}
            </div>
          </div>

          {/* Bottom actions */}
          <div className="space-y-2 flex-shrink-0 pb-1">
            <Link href="/dashboard" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-300/40 hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center justify-center gap-2">
              <BarChart2 className="w-4 h-4" />Dashboard
            </Link>
            {user ? (
              <Link href={user.role === 'admin' ? '/admin' : '/staff/module/map'} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-xs font-bold shadow-lg shadow-sky-300/40 hover:from-sky-400 hover:to-sky-500 transition-all flex items-center justify-center gap-2">
                <LayoutDashboard className="w-4 h-4" />{user.role === 'admin' ? 'จัดการข้อมูล' : 'กลับ Workspace'}
              </Link>
            ) : (
              <Link href="/login" className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 bg-white/90">
                <LogIn className="w-4 h-4" />เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`absolute z-[450] top-1/2 -translate-y-1/2 w-7 h-12 bg-white/90 backdrop-blur-xl border border-white/70 shadow-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition-all rounded-r-xl ${sidebarOpen ? 'left-[17.5rem]' : 'left-3'}`}
        title={sidebarOpen ? 'ซ่อนรายการ' : 'แสดงรายการ'}
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {reportAed && <AEDReportModal aed={reportAed} onClose={() => setReportAed(null)} />}
    </div>
  );
}
