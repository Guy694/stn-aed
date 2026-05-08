'use client';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/app/components/Navbar';
import AEDReportModal from '@/app/components/AEDReportModal';
import {
  Search, X, Zap, AlertTriangle, Wrench, BatteryLow,
  PackageSearch, HelpCircle, Clock, CheckCircle2, RefreshCw,
  MapPin, Plus, ChevronDown,
} from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const REPORT_TYPE_CONFIG = {
  damaged:     { label: 'เครื่องชำรุด/เสียหาย',    icon: AlertTriangle, cls: 'bg-red-50 border-red-200 text-red-700' },
  maintenance: { label: 'ต้องการบำรุงรักษา',        icon: Wrench,        cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  battery:     { label: 'แบตเตอรี่หมด/ใกล้หมด',    icon: BatteryLow,    cls: 'bg-orange-50 border-orange-200 text-orange-700' },
  missing:     { label: 'เครื่องหาย/สูญหาย',        icon: PackageSearch, cls: 'bg-rose-50 border-rose-200 text-rose-700' },
  other:       { label: 'อื่นๆ',                     icon: HelpCircle,    cls: 'bg-slate-50 border-slate-200 text-slate-600' },
};

const STATUS_CONFIG = {
  pending:     { label: 'รอดำเนินการ',    cls: 'bg-red-50 border-red-200 text-red-700',         icon: Clock },
  in_progress: { label: 'กำลังดำเนินการ', cls: 'bg-amber-50 border-amber-200 text-amber-700',   icon: Wrench },
  resolved:    { label: 'แก้ไขแล้ว',      cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: CheckCircle2 },
};

export default function MyReportsPage() {
  const [user, setUser] = useState(null);
  const [aedList, setAedList] = useState([]);
  const [aedSearch, setAedSearch] = useState('');
  const [aedLoading, setAedLoading] = useState(true);

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  const [reportModal, setReportModal] = useState(null); // aed object

  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'history'

  useEffect(() => {
    fetch(`${BASE}/api/auth/me`).then((r) => r.ok ? r.json() : null).then(setUser);
    loadAed();
    loadReports();
  }, []);

  const loadAed = async () => {
    setAedLoading(true);
    try {
      const res = await fetch(`${BASE}/api/aed`);
      const data = await res.json();
      if (Array.isArray(data)) setAedList(data);
    } catch {}
    setAedLoading(false);
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/reports`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setReports(data);
      }
    } catch {}
    setReportsLoading(false);
  };

  const filteredAed = useMemo(() =>
    aedList.filter((a) =>
      !aedSearch ||
      a.location_name?.toLowerCase().includes(aedSearch.toLowerCase()) ||
      a.district_name?.toLowerCase().includes(aedSearch.toLowerCase()) ||
      a.tambon_name?.toLowerCase().includes(aedSearch.toLowerCase())
    ).slice(0, 50),
    [aedList, aedSearch]
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar user={user} />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-sky-500" />
            แจ้งรายงานเครื่อง AED
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">ค้นหาเครื่อง AED และแจ้งปัญหา เจ้าหน้าที่จะดำเนินการต่อ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-6">
        <div className="max-w-4xl mx-auto flex gap-1">
          {[
            { key: 'report', label: 'แจ้งปัญหาเครื่อง AED', icon: AlertTriangle },
            { key: 'history', label: 'ประวัติการแจ้ง', icon: Clock, badge: reports.filter(r => r.status === 'pending').length },
          ].map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === key
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* ─── Report Tab ─── */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={aedSearch}
                  onChange={(e) => setAedSearch(e.target.value)}
                  placeholder="ค้นหาชื่อสถานที่, อำเภอ, ตำบล..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm shadow-sm"
                />
                {aedSearch && (
                  <button onClick={() => setAedSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-500 flex-shrink-0">
                {filteredAed.length} จุด {aedSearch ? `(ค้นหา: "${aedSearch}")` : ''}
              </span>
            </div>

            {aedLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAed.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
                <Zap className="w-10 h-10" />
                <p>ไม่พบข้อมูล AED</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredAed.map((aed) => (
                  <div
                    key={aed.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-start gap-3 hover:border-sky-300 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">
                        {aed.location_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[aed.tambon_name, aed.district_name].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button
                      onClick={() => setReportModal(aed)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition-all flex-shrink-0"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      แจ้งปัญหา
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!aedLoading && filteredAed.length === 50 && (
              <p className="text-center text-xs text-slate-400">แสดงผล 50 รายการแรก กรุณาค้นหาเพื่อกรอง</p>
            )}
          </div>
        )}

        {/* ─── History Tab ─── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">รายการแจ้งปัญหาทั้งหมด ({reports.length})</p>
              <button
                onClick={loadReports}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reportsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {reportsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
                <Clock className="w-10 h-10" />
                <p>ยังไม่มีประวัติการแจ้ง</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => {
                  const sc = STATUS_CONFIG[r.status] || { label: r.status, cls: 'bg-slate-50 border-slate-200 text-slate-600', icon: Clock };
                  const tc = REPORT_TYPE_CONFIG[r.report_type];
                  const StatusIcon = sc.icon;
                  const TypeIcon = tc?.icon;
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${sc.cls}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {sc.label}
                        </span>
                        {tc && TypeIcon && (
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${tc.cls}`}>
                            <TypeIcon className="w-3.5 h-3.5" />
                            {tc.label}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto">
                          #{r.id} · {new Date(r.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 text-sm">{r.location_name}</p>
                      {r.district_name && <p className="text-xs text-slate-500">อำเภอ {r.district_name}</p>}
                      {r.description && (
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 mt-2">
                          {r.description}
                        </p>
                      )}
                      {r.admin_note && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100 mt-2">
                          หมายเหตุเจ้าหน้าที่: {r.admin_note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AEDReportModal */}
      {reportModal && (
        <AEDReportModal
          aed={reportModal}
          onClose={() => {
            setReportModal(null);
            loadReports();
          }}
        />
      )}
    </div>
  );
}
