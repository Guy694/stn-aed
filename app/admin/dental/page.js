'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import DentalModal from '@/app/components/DentalModal';
import {
  Plus, Pencil, Trash2, Search, X, RefreshCw,
  AlertCircle, CheckCircle, Stethoscope, AlertTriangle,
} from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

function isDentalActive(status) {
  return status === true || status === 1 || status === '1' || status === 'active';
}

export default function AdminDentalPage() {
  const [user, setUser] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, dental: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/dental`);
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
      const idx = prev.findIndex((d) => d.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setModal({ open: false, dental: null });
    showToast(modal.dental?.id ? 'แก้ไขข้อมูลทันตกรรมสำเร็จ' : 'เพิ่มหน่วยทันตกรรมสำเร็จ');
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${BASE}/api/dental/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setList((prev) => prev.filter((d) => d.id !== id));
      showToast('ลบข้อมูลทันตกรรมสำเร็จ', 'success');
    } else {
      showToast('เกิดข้อผิดพลาดในการลบ', 'error');
    }
    setDeleteConfirm(null);
  };

  const filtered = list.filter((d) =>
    !search ||
    d.facility_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.district_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.tambon_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar user={user} />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-violet-500" />
              จัดการทันตกรรม
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">เพิ่ม แก้ไข และลบข้อมูลหน่วยทันตกรรม</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-100">
              <Stethoscope className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-600">{list.length}</span>
              <span className="text-xs text-slate-600">หน่วยทันตกรรม</span>
            </div>
            <button
              onClick={loadList}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shadow-sm"
              title="รีเฟรช"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setModal({ open: true, dental: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-400 hover:to-purple-500 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              เพิ่มหน่วยทันตกรรม
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
              placeholder="ค้นหาชื่อ, อำเภอ, ตำบล..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm shadow-sm"
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
              <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
              <Stethoscope className="w-10 h-10" />
              <p>{search ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีข้อมูลทันตกรรม'}</p>
              {!search && (
                <button onClick={() => setModal({ open: true, dental: null })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-all">
                  <Plus className="w-4 h-4" />เพิ่มหน่วยทันตกรรม
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {['#', 'ชื่อหน่วยบริการ', 'อำเภอ', 'ตำบล', 'เก้าอี้', 'พร้อมใช้', 'วันให้บริการ', 'พิกัด', 'สถานะ'].map((label) => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{d.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="font-semibold text-slate-900 text-sm leading-tight">{d.facility_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm">{d.district_name || '-'}</td>
                      <td className="px-4 py-3 text-slate-600 text-sm">{d.tambon_name || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 text-xs font-bold">
                          {d.dental_unit_count ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
                          {d.ready_unit_count ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-[120px] truncate" title={d.service_days}>{d.service_days || '-'}</td>
                      <td className="px-4 py-3">
                        {d.lat != null ? (
                          <span className="font-mono text-xs text-slate-500">{parseFloat(d.lat).toFixed(4)}, {parseFloat(d.lon).toFixed(4)}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                            <AlertTriangle className="w-3 h-3" />ไม่มีพิกัด
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${isDentalActive(d.status) ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isDentalActive(d.status) ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {isDentalActive(d.status) ? 'ใช้งาน' : 'ปิด'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModal({ open: true, dental: d })}
                            className="w-7 h-7 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center text-violet-600 border border-violet-100"
                            title="แก้ไข"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(d)}
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 border border-red-100"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <DentalModal dental={modal.dental} onClose={() => setModal({ open: false, dental: null })} onSave={handleSave} />
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
              คุณต้องการลบ &quot;<strong className="text-slate-900">{deleteConfirm.facility_name}</strong>&quot; ใช่ไหม?
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
