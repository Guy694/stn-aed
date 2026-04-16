'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, Save, MapPin, Crosshair } from 'lucide-react';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

const TYPECODES = [
  'รพ.ทั่วไป', 'รพ.ชุมชน', 'รพ.สต.', 'ศสช.', 'สสจ.', 'สสอ.', 'สอน.', 'หน่วยงานอื่น'
];

const DEFAULT_FORM = {
  name: '',
  typecode: 'รพ.สต.',
  changwat: 'สตูล',
  address: '',
  tambon: '',
  district_name: '',
  lat: '',
  lon: '',
  is_active: 1,
};

export default function AEDModal({ facility, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [picking, setPicking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!facility?.id;

  useEffect(() => {
    if (facility) {
      setForm({
        name: facility.name || '',
        typecode: facility.typecode || 'รพ.สต.',
        changwat: facility.changwat || 'สตูล',
        address: facility.address || '',
        tambon: facility.tambon || '',
        district_name: facility.district_name || '',
        lat: facility.lat != null ? String(facility.lat) : '',
        lon: facility.lon != null ? String(facility.lon) : '',
        is_active: facility.is_active ?? 1,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError('');
  }, [facility]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
    }));
  };

  const handleMapPick = (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lon: lng.toFixed(6),
    }));
    setPicking(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.typecode || !form.lat || !form.lon) {
      setError('กรุณากรอกข้อมูลที่จำเป็น: ชื่อ, ประเภท, และพิกัด');
      return;
    }

    setLoading(true);
    try {
      const url = isEdit
        ? `/stn-aed/api/facilities/${facility.id}`
        : '/stn-aed/api/facilities';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lat: parseFloat(form.lat),
          lon: parseFloat(form.lon),
          is_active: Number(form.is_active),
        }),
      });

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

  // Preview marker for mini map
  const previewFacilities =
    form.lat && form.lon
      ? [{ id: 0, name: form.name || 'ตำแหน่งที่เลือก', typecode: form.typecode, lat: parseFloat(form.lat), lon: parseFloat(form.lon), is_active: 1 }]
      : [];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEdit ? 'แก้ไขข้อมูล AED' : 'เพิ่มจุด AED ใหม่'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit ? `แก้ไขข้อมูล: ${facility.name}` : 'กรอกข้อมูลจุดติดตั้งเครื่อง AED'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ชื่อหน่วยบริการ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="เช่น รพ.สต.บ้านควน"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ประเภท <span className="text-red-500">*</span>
              </label>
              <select
                name="typecode"
                value={form.typecode}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              >
                {TYPECODES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">อำเภอ</label>
              <input
                type="text"
                name="district_name"
                value={form.district_name}
                onChange={handleChange}
                placeholder="เช่น เมืองสตูล"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>

            {/* Tambon */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ตำบล</label>
              <input
                type="text"
                name="tambon"
                value={form.tambon}
                onChange={handleChange}
                placeholder="เช่น พิมาน"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ที่อยู่</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="ที่อยู่"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 pt-6">
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
          </div>

          {/* Coordinates */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">
                พิกัด (Lat, Lon) <span className="text-red-500">*</span>
              </label>
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
              <div>
                <input
                  type="number"
                  name="lat"
                  value={form.lat}
                  onChange={handleChange}
                  placeholder="ละติจูด (Lat)"
                  step="0.000001"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono text-sm"
                />
              </div>
              <div>
                <input
                  type="number"
                  name="lon"
                  value={form.lon}
                  onChange={handleChange}
                  placeholder="ลองจิจูด (Lon)"
                  step="0.000001"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono text-sm"
                />
              </div>
            </div>

            {/* Mini map */}
            <div className="h-56 rounded-xl overflow-hidden border border-slate-200">
              <MapView
                facilities={previewFacilities}
                pickCoords={picking}
                onPickCoords={handleMapPick}
                showLayers={false}
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-sky-500/25"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มจุด AED'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
