'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import HealthStationModal from '@/app/components/HealthStationModal';
import {
  Plus, Pencil, Trash2, Search, X, RefreshCw,
  AlertCircle, CheckCircle, RadioTower, AlertTriangle,
} from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function AdminHealthStationsPage() {
  const [user, setUser] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, station: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/health-stations`);
      const data = await res.json();
      if (Array.isArray(data)) setList(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    fetch(`${BASE}/api/auth/me`)
      .then((r) => r.ok ? r.json() : null)
      .then(setUser)
      .catch(() => {});
    queueMicrotask(loadList);
  }, []);

  const handleSave = (saved) => {
    setList((prev) => {
      const idx = prev.findIndex((h) => h.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setModal({ open: false, station: null });
    showToast(modal.station?.id ? 'แก้ไข Health Station สำเร็จ' : 'เพิ่ม Health Station สำเร็จ');
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${BASE}/api/health-stations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setList((prev) => prev.filter((h) => h.id !== id));
      showToast('ลบ Health Station สำเร็จ', 'success');
    } else {
      showToast('เกิดข้อผิดพลาดในการลบ', 'error');
    }
    setDeleteConfirm(null);
  };

  const filtered = list.filter((h) =>
    !search ||
    h.station_name?.toLowerCase().includes(search.toLowerCase()) ||
    h.district_name?.toLowerCase().includes(search.toLowerCase()) ||
    h.tambon_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar user={user} />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <RadioTower className="w-5 h-5 text-teal-500" />
              จัดการ Health Station
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">เพิ่ม แก้ไข และลบข้อมูลสถานี Health Station</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50 border border-teal-100">
              <RadioTower className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-teal-600">{list.length}</span>
              <span className="text-xs text-slate-600">สถานี</span>
            </div>
            <button
              onClick={loadList}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shadow-sm"
              title="รีเฟรช"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setModal({ open: true, station: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-400 hover:to-cyan-500 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม Health Station
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อสถานี, อำเภอ, ตำบล..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {search && <span className="text-xs text-slate-500">แสดง {filtered.length} / {list.length} รายการ</span>}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
              <RadioTower className="w-10 h-10" />
              <p>{search ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีข้อมูล Health Station'}</p>
              {!search && (
                <button onClick={() => setModal({ open: true, station: null })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 transition-all">
                  <Plus className="w-4 h-4" />เพิ่ม Health Station
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {['#', 'ชื่อสถานี', 'อำเภอ', 'ตำบล', 'ประเภท', 'เครื่องมือ', 'AOM', 'เปิดบริการ', 'พิกัด'].map((label) => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((h) => {
                    const equipCount = [h.has_scale, h.has_bp_monitor, h.has_dtx, h.has_waist_tape, h.has_educational_materials].filter(Boolean).length;
                    return (
                      <tr key={h.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{h.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                              <RadioTower className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-semibold text-slate-900 text-sm leading-tight">{h.station_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{h.district_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{h.tambon_name || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-lg border text-xs font-medium ${h.station_type === 'rphst' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {h.station_type === 'rphst' ? 'รพ.สต.' : 'ชุมชน'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold ${equipCount >= 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : equipCount >= 2 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {equipCount}/5
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 text-xs font-medium ${h.has_aom_assigned ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${h.has_aom_assigned ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {h.has_aom_assigned ? 'มี' : 'ไม่มี'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${h.is_open ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${h.is_open ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {h.is_open ? 'เปิด' : 'ปิด'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {h.lat != null ? (
                            <span className="font-mono text-xs text-slate-500">{parseFloat(h.lat).toFixed(4)}, {parseFloat(h.lon).toFixed(4)}</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                              <AlertTriangle className="w-3 h-3" />ไม่มีพิกัด
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setModal({ open: true, station: h })}
                              className="w-7 h-7 rounded-lg bg-teal-50 hover:bg-teal-100 flex items-center justify-center text-teal-600 border border-teal-100"
                              title="แก้ไข"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(h)}
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 border border-red-100"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <HealthStationModal station={modal.station} onClose={() => setModal({ open: false, station: null })} onSave={handleSave} />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">ยืนยันการลบ</h3>
                <p className="text-sm text-slate-500 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200">
              คุณต้องการลบ &quot;<strong className="text-slate-900">{deleteConfirm.station_name}</strong>&quot; ใช่ไหม?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200">ยกเลิก</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white">ลบข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[4000] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/30 text-white backdrop-blur-xl' : 'bg-red-500/90 border-red-400/30 text-white backdrop-blur-xl'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
