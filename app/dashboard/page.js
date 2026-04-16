'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import {
  Heart, Building2, MapPin, Activity, AlertTriangle, CheckCircle,
  BarChart2, ChevronDown, RefreshCw, Home, Zap, Filter, X,
  ArrowLeft,
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
  const bg = {
    sky:     'from-sky-500 to-sky-600',
    emerald: 'from-emerald-500 to-teal-600',
    red:     'from-red-500 to-rose-600',
    amber:   'from-amber-500 to-orange-500',
    violet:  'from-violet-500 to-purple-600',
  }[color];
  return (
    <div className={`bg-gradient-to-br ${bg} rounded-2xl p-5 text-white shadow-xl flex items-start gap-4`}>
      <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wide truncate">{label}</p>
        <p className="text-3xl font-black leading-none mt-1">{value?.toLocaleString()}</p>
        {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
      </div>
      {warn && (
        <AlertTriangle className="w-5 h-5 text-white/80 flex-shrink-0 mt-1" />
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterSource, setFilterSource] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/stn-aed/api/dashboard');
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // ── Derived: districts list ──
  const allDistricts = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.aedByDistrict.map((d) => d.name).filter(Boolean))].sort();
  }, [data]);

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

  if (loading) {
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

  const s = data.totalStats;
  const m = data.aedMissingCoords;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Navbar ── */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-200 shadow-sm px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">Dashboard AED สตูล</p>
                <p className="text-xs text-slate-500">ข้อมูลเชิงสถิติระบบ AED จังหวัดสตูล</p>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-1 justify-center max-w-xl">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="relative flex-1">
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 pr-7 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all shadow-sm"
              >
                <option value="">ทุกอำเภอ</option>
                {allDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative flex-1">
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 pr-7 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all shadow-sm"
              >
                <option value="">ทุกแหล่งข้อมูล</option>
                {allSources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {(filterDistrict || filterSource) && (
              <button
                onClick={() => { setFilterDistrict(''); setFilterSource(''); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-medium hover:bg-red-100 transition-all flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />ล้างฟิลเตอร์
              </button>
            )}
          </div>

          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-all flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Stat cards row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard icon={Heart}     color="sky"     label="AED รวมทั้งหมด"    value={s?.aed_total}       sub={`ใช้งานได้ ${s?.aed_active} เครื่อง`} />
          <StatCard icon={CheckCircle} color="emerald" label="AED พร้อมใช้งาน"  value={s?.aed_active}      sub={`${s?.aed_total ? ((s.aed_active/s.aed_total)*100).toFixed(0) : 0}% ของทั้งหมด`} />
          <StatCard icon={AlertTriangle} color="amber" label="รอใส่พิกัด"       value={s?.aed_no_coords}   warn={Number(s?.aed_no_coords) > 0} sub="จุดที่ยังไม่มีพิกัด" />
          <StatCard icon={Building2}  color="violet"   label="หน่วยบริการ"       value={s?.fac_total}       sub={`ใช้งานได้ ${s?.fac_active} หน่วย`} />
          <StatCard icon={MapPin}     color="sky"     label="ใช้พิกัดชั้นดี"   value={Number(m?.exact_coords) + Number(m?.matched_coords || 0)} sub="sheet + จับคู่หน่วยบริการ" />
          <StatCard icon={Zap}        color="red"     label="พิกัดโดยประมาณ"  value={m?.approx_coords}   sub="จุดศูนย์กลางตำบล" />
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
      </div>
    </div>
  );
}
