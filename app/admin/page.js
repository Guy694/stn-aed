'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import AEDModal from '@/app/components/AEDModal';
import {
  Plus, Pencil, Trash2, Search, X, Heart, Activity, MapPin,
  RefreshCw, AlertCircle, CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';

const MapView = dynamic(() => import('@/app/components/MapView'), { ssr: false });

export default function AdminPage() {
  const [facilities, setFacilities] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, facility: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'map'

  useEffect(() => {
    fetch('/stn-aed/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then(setUser)
      .catch(() => {});
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    setLoading(true);
    const res = await fetch('/stn-aed/api/facilities');
    const data = await res.json();
    if (Array.isArray(data)) setFacilities(data);
    setLoading(false);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (saved) => {
    setFacilities((prev) => {
      const idx = prev.findIndex((f) => f.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setModal({ open: false, facility: null });
    showToast(modal.facility?.id ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มจุด AED สำเร็จ');
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/stn-aed/api/facilities/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFacilities((prev) => prev.filter((f) => f.id !== id));
      showToast('ลบข้อมูลสำเร็จ', 'success');
    } else {
      showToast('เกิดข้อผิดพลาดในการลบ', 'error');
    }
    setDeleteConfirm(null);
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const filtered = facilities
    .filter((f) =>
      !search ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.district_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.tambon?.toLowerCase().includes(search.toLowerCase()) ||
      f.typecode?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortBy] ?? '';
      const bv = b[sortBy] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'th');
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-sky-400" />
      : <ChevronDown className="w-3 h-3 text-sky-400" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar user={user} />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-500" />
              จัดการข้อมูล AED
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              เพิ่ม แก้ไข และลบข้อมูลจุดบริการเครื่อง AED
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 border border-sky-100">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span className="text-sm font-semibold text-sky-600">{facilities.length}</span>
              <span className="text-xs text-slate-600">จุดทั้งหมด</span>
            </div>
            <button
              onClick={loadFacilities}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setModal({ open: true, facility: null })}
              id="add-aed-btn"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 transition-all shadow-lg hover:shadow-sky-500/25"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม AED
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, อำเภอ, ตำบล..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-sm shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tab toggle */}
          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'table' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              ตาราง
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'map' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              แผนที่
            </button>
          </div>

          {search && (
            <span className="text-xs text-slate-500">
              แสดง {filtered.length} / {facilities.length} รายการ
            </span>

          )}
        </div>

        {/* Table view */}
        {activeTab === 'table' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-500 text-sm">กำลังโหลด...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
                <Heart className="w-10 h-10" />
                <p>ยังไม่มีข้อมูล</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {[
                        { key: 'id', label: '#' },
                        { key: 'name', label: 'ชื่อหน่วยบริการ' },
                        { key: 'typecode', label: 'ประเภท' },
                        { key: 'district_name', label: 'อำเภอ' },
                        { key: 'tambon', label: 'ตำบล' },
                        { key: 'lat', label: 'พิกัด' },
                        { key: 'is_active', label: 'สถานะ' },
                      ].map(({ key, label }) => (
                        <th
                          key={key}
                          onClick={() => toggleSort(key)}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors select-none"
                        >
                          <div className="flex items-center gap-1">
                            {label}
                            <SortIcon col={key} />
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{f.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                              <Heart className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-semibold text-slate-900 text-sm">{f.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 text-xs font-medium">
                            {f.typecode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{f.district_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{f.tambon || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-slate-500">
                            {parseFloat(f.lat).toFixed(4)}, {parseFloat(f.lon).toFixed(4)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${f.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${f.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {f.is_active ? 'ใช้งาน' : 'ปิด'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setModal({ open: true, facility: f })}
                              className="w-7 h-7 rounded-lg bg-sky-50 hover:bg-sky-100 flex items-center justify-center text-sky-600 transition-all border border-sky-100"
                              title="แก้ไข"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(f)}
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-all border border-red-100"
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
        )}

        {/* Map view */}
        {activeTab === 'map' && (
          <div className="h-[calc(100vh-300px)] min-h-[500px]">
            <MapView
              facilities={filtered}
              showLayers={true}
            />
          </div>
        )}
      </div>

      {/* AED Modal */}
      {modal.open && (
        <AEDModal
          facility={modal.facility}
          onClose={() => setModal({ open: false, facility: null })}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm dialog */}
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
              คุณต้องการลบ &quot;<strong className="text-slate-900">{deleteConfirm.name}</strong>&quot; ใช่ไหม?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all border border-slate-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-all"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[4000] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium animate-slide-up transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-500/90 border-emerald-400/30 text-white backdrop-blur-xl'
            : 'bg-red-500/90 border-red-400/30 text-white backdrop-blur-xl'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4" />
          }
          {toast.message}
        </div>
      )}
    </div>
  );
}
