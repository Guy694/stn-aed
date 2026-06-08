'use client';
import { useEffect, useState } from 'react';

import { apiFetch } from '@/app/lib/client-api';
import dynamic from 'next/dynamic';
import { X, Save, Crosshair, MapPin, Plus } from 'lucide-react';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

const DEFAULT_FORM = {
  location_name: '',
  district_name: '',
  aed_affiliation: '',
  quantity: 1,
  manager_name: '',
  manager_phone: '',
  lat: '',
  lon: '',
  is_active: 1,
};

export default function AEDPointModal({ aed, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [picking, setPicking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!aed?.id;

  useEffect(() => {
    if (aed) {
      setForm({
        location_name: aed.location_name || '',
        district_name: aed.district_name || '',
        aed_affiliation: aed.manager_typecode || '',
        quantity: aed.quantity_total ?? 1,
        manager_name: aed.manager_name || '',
        manager_phone: aed.manager_phone || '',
        lat: aed.lat != null ? String(aed.lat) : '',
        lon: aed.lon != null ? String(aed.lon) : '',
        is_active: aed.is_active ?? 1,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError('');
  }, [aed]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
    }));
  };

  const handleMapPick = (lat, lng) => {
    setForm((prev) => ({ ...prev, lat: lat.toFixed(6), lon: lng.toFixed(6) }));
    setPicking(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.location_name.trim()) {
      setError('กรุณาระบุชื่อจุดบริการ');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        location_name: form.location_name.trim(),
        district_name: form.district_name || null,
        aed_affiliation: form.aed_affiliation || null,
        quantity: form.quantity ? parseInt(form.quantity) : 1,
        manager_name: form.manager_name || null,
        manager_phone: form.manager_phone || null,
        lat: form.lat !== '' ? parseFloat(form.lat) : null,
        lon: form.lon !== '' ? parseFloat(form.lon) : null,
        is_active: Number(form.is_active),
      };
      const res = await apiFetch(
        isEdit ? `/api/aed/${aed.id}` : '/api/aed',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด');
        return;
      }
      onSave(data);
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const previewAed =
    form.lat && form.lon
      ? [{ id: 0, location_name: form.location_name || 'ตำแหน่งที่เลือก', manager_typecode: '', lat: parseFloat(form.lat), lon: parseFloat(form.lon), is_active: 1 }]
      : [];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
              isEdit ? 'bg-gradient-to-br from-sky-500 to-sky-600' : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}>
              {isEdit ? <Save className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? 'แก้ไขจุดบริการ AED' : 'เพิ่มจุดบริการ AED'}
              </h2>
              {isEdit && (
                <p className="text-sm text-slate-500 mt-0.5 truncate max-w-xs">{aed?.location_name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ชื่อจุดบริการ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location_name"
                value={form.location_name}
                onChange={handleChange}
                placeholder="ชื่อสถานที่ติดตั้งเครื่อง AED"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">อำเภอ</label>
              <input
                type="text"
                name="district_name"
                value={form.district_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">สังกัด AED</label>
              <input
                type="text"
                name="aed_affiliation"
                value={form.aed_affiliation}
                onChange={handleChange}
                placeholder="หน่วยงานที่ดูแล"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ผู้ดูแลเครื่อง</label>
              <input
                type="text"
                name="manager_name"
                value={form.manager_name}
                onChange={handleChange}
                placeholder="ชื่อ-นามสกุล"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">เบอร์ติดต่อ</label>
              <input
                type="text"
                name="manager_phone"
                value={form.manager_phone}
                onChange={handleChange}
                placeholder="0xx-xxxxxxx"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">จำนวนเครื่อง</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
          </div>

          {/* Status toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={Number(form.is_active) === 1}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </label>
            <span className="text-sm text-slate-700">เปิดใช้งาน</span>
          </div>

          {/* Coordinates + map picker */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">พิกัด (Lat, Lon)</label>
              <button
                type="button"
                onClick={() => setPicking(!picking)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  picking
                    ? 'bg-sky-50 text-sky-600 border-sky-200'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                {picking ? 'กำลังเลือก...' : 'คลิกจากแผนที่'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                type="number"
                name="lat"
                value={form.lat}
                onChange={handleChange}
                placeholder="ละติจูด (Lat)"
                step="0.000001"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono text-sm"
              />
              <input
                type="number"
                name="lon"
                value={form.lon}
                onChange={handleChange}
                placeholder="ลองจิจูด (Lon)"
                step="0.000001"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono text-sm"
              />
            </div>
            <div className="h-56 rounded-xl overflow-hidden border border-slate-200">
              <MapView
                aedPoints={previewAed}
                pickCoords={picking}
                onPickCoords={handleMapPick}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 transition-all disabled:opacity-50"
            >
              {isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {loading ? 'กำลังบันทึก...' : (isEdit ? 'บันทึก' : 'เพิ่มจุดบริการ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
