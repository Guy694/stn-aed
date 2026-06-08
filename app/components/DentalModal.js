'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { X, Stethoscope, AlertCircle } from 'lucide-react';

import { apiFetch } from '@/app/lib/client-api';
const MapView = dynamic(() => import('./MapView'), { ssr: false });
const THAILAND_BOUNDS = {
  minLat: 5.5,
  maxLat: 20.6,
  minLon: 97.3,
  maxLon: 105.7,
};

function isWithinThailandBounds(lat, lon) {
  return (
    lat >= THAILAND_BOUNDS.minLat &&
    lat <= THAILAND_BOUNDS.maxLat &&
    lon >= THAILAND_BOUNDS.minLon &&
    lon <= THAILAND_BOUNDS.maxLon
  );
}

function createFormState(dental) {
  if (!dental) return { ...EMPTY_FORM };

  return {
    facility_name: dental.facility_name || '',
    district_name: dental.district_name || '',
    tambon_name: dental.tambon_name || '',
    dental_unit_count: dental.dental_unit_count ?? '',
    ready_unit_count: dental.ready_unit_count ?? '',
    repair_unit_count: dental.repair_unit_count ?? '',
    broken_unit_count: dental.broken_unit_count ?? '',
    service_days: dental.service_days || '',
    fixed_dental_staff: !!dental.fixed_dental_staff,
    fixed_dental_staff_count: dental.fixed_dental_staff_count ?? '',
    fixed_dental_staff_names: dental.fixed_dental_staff_names || '',
    rotating_dental_staff_schedule: dental.rotating_dental_staff_schedule || '',
    rotating_dental_staff_names: dental.rotating_dental_staff_names || '',
    dental_services: dental.dental_services || '',
    avg_patients_per_day: dental.avg_patients_per_day ?? '',
    avg_patients_per_month: dental.avg_patients_per_month ?? '',
    lat: dental.lat ?? '',
    lon: dental.lon ?? '',
    status: dental.status === true || dental.status === 1 || dental.status === '1' || dental.status === 'active',
  };
}

const EMPTY_FORM = {
  facility_name: '',
  district_name: '',
  tambon_name: '',
  dental_unit_count: '',
  ready_unit_count: '',
  repair_unit_count: '',
  broken_unit_count: '',
  service_days: '',
  fixed_dental_staff: false,
  fixed_dental_staff_count: '',
  fixed_dental_staff_names: '',
  rotating_dental_staff_schedule: '',
  rotating_dental_staff_names: '',
  dental_services: '',
  avg_patients_per_day: '',
  avg_patients_per_month: '',
  lat: '',
  lon: '',
  status: true,
};

export default function DentalModal({ dental, onClose, onSave }) {
  const isEdit = !!dental?.id;
  const [form, setForm] = useState(() => createFormState(dental));
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleMapPick = (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lon: lng.toFixed(6),
    }));
    setPicking(false);
  };

  const previewDentalPoints =
    form.lat !== '' && form.lon !== ''
      ? [{
          id: 0,
          facility_name: form.facility_name || 'ตำแหน่งที่เลือก',
          district_name: form.district_name || '',
          status: form.status,
          lat: parseFloat(form.lat),
          lon: parseFloat(form.lon),
        }]
      : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const hasLat = form.lat !== '';
    const hasLon = form.lon !== '';
    if (hasLat !== hasLon) {
      setError('กรุณาระบุพิกัดให้ครบทั้ง Latitude และ Longitude');
      return;
    }

    const parsedLat = hasLat ? parseFloat(form.lat) : null;
    const parsedLon = hasLon ? parseFloat(form.lon) : null;
    if (
      parsedLat != null &&
      parsedLon != null &&
      !isWithinThailandBounds(parsedLat, parsedLon)
    ) {
      setError('พิกัดต้องอยู่ในขอบเขตประเทศไทยเท่านั้น');
      return;
    }

    if (!form.facility_name.trim()) {
      setError('กรุณาระบุชื่อหน่วยบริการ');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        dental_unit_count: form.dental_unit_count !== '' ? Number(form.dental_unit_count) : 0,
        ready_unit_count: form.ready_unit_count !== '' ? Number(form.ready_unit_count) : null,
        repair_unit_count: form.repair_unit_count !== '' ? Number(form.repair_unit_count) : null,
        broken_unit_count: form.broken_unit_count !== '' ? Number(form.broken_unit_count) : null,
        fixed_dental_staff: form.fixed_dental_staff ? 1 : 0,
        fixed_dental_staff_count: form.fixed_dental_staff_count !== '' ? Number(form.fixed_dental_staff_count) : 0,
        avg_patients_per_day: form.avg_patients_per_day !== '' ? Number(form.avg_patients_per_day) : null,
        avg_patients_per_month: form.avg_patients_per_month !== '' ? Number(form.avg_patients_per_month) : null,
        lat: parsedLat,
        lon: parsedLon,
        status: form.status ? 1 : 0,
      };

      const url = isEdit ? `/api/dental/${dental.id}` : '/api/dental';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'เกิดข้อผิดพลาด');
        setSaving(false);
        return;
      }

      const saved = await res.json();
      onSave(saved);
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{isEdit ? 'แก้ไขข้อมูลทันตกรรม' : 'เพิ่มหน่วยทันตกรรม'}</h2>
              <p className="text-xs text-slate-500">{isEdit ? `แก้ไข #${dental.id}` : 'เพิ่มข้อมูลใหม่'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Section: ข้อมูลพื้นฐาน */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">ข้อมูลหน่วยบริการ</legend>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อหน่วยบริการ <span className="text-red-500">*</span></label>
                <input type="text" value={form.facility_name} onChange={(e) => set('facility_name', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="เช่น รพ.สต.บ้านควน" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">อำเภอ</label>
                  <input type="text" value={form.district_name} onChange={(e) => set('district_name', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="เช่น เมืองสตูล" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ตำบล</label>
                  <input type="text" value={form.tambon_name} onChange={(e) => set('tambon_name', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="เช่น พิมาน" />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section: เก้าอี้ทันตกรรม */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">เก้าอี้ทันตกรรม</legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { field: 'dental_unit_count', label: 'ทั้งหมด' },
                { field: 'ready_unit_count', label: 'พร้อมใช้' },
                { field: 'repair_unit_count', label: 'ซ่อม' },
                { field: 'broken_unit_count', label: 'เสีย' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
                  <input type="number" min="0" value={form[field]} onChange={(e) => set(field, e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="0" />
                </div>
              ))}
            </div>
          </fieldset>

          {/* Section: บุคลากร */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">บุคลากร</legend>
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.fixed_dental_staff} onChange={(e) => set('fixed_dental_staff', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
                <span className="text-sm text-slate-700 font-medium">มีทันตบุคลากรประจำ</span>
              </label>
              {form.fixed_dental_staff && (
                <div className="grid grid-cols-2 gap-3 ml-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนบุคลากรประจำ</label>
                    <input type="number" min="0" value={form.fixed_dental_staff_count} onChange={(e) => set('fixed_dental_staff_count', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อบุคลากรประจำ</label>
                    <input type="text" value={form.fixed_dental_staff_names} onChange={(e) => set('fixed_dental_staff_names', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="ชื่อ-นามสกุล" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ตารางบุคลากรหมุนเวียน</label>
                <input type="text" value={form.rotating_dental_staff_schedule} onChange={(e) => set('rotating_dental_staff_schedule', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="เช่น สัปดาห์ที่ 1,3 ของเดือน" />
              </div>
            </div>
          </fieldset>

          {/* Section: การให้บริการ */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">การให้บริการ</legend>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">วันให้บริการ</label>
                <input type="text" value={form.service_days} onChange={(e) => set('service_days', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="เช่น จ-ศ, อังคาร-พฤหัสบดี" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทบริการ</label>
                <input type="text" value={form.dental_services} onChange={(e) => set('dental_services', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="เช่น อุด, ถอน, ขูดหินปูน" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เฉลี่ยผู้ป่วย/วัน</label>
                  <input type="number" min="0" value={form.avg_patients_per_day} onChange={(e) => set('avg_patients_per_day', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เฉลี่ยผู้ป่วย/เดือน</label>
                  <input type="number" min="0" value={form.avg_patients_per_month} onChange={(e) => set('avg_patients_per_month', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="0" />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section: พิกัดและสถานะ */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">พิกัดและสถานะ</legend>
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700">ปักหมุดจากแผนที่</span>
                <button
                  type="button"
                  onClick={() => setPicking((prev) => !prev)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    picking
                      ? 'bg-violet-50 text-violet-600 border-violet-200'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  {picking ? 'กำลังเลือก...' : 'คลิกจากแผนที่'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                  <input type="number" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono" placeholder="6.xxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                  <input type="number" step="any" value={form.lon} onChange={(e) => set('lon', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono" placeholder="100.xxxxxx" />
                </div>
              </div>
              <div className="h-56 rounded-xl overflow-hidden border border-slate-200">
                <MapView
                  dentalPoints={previewDentalPoints}
                  pickCoords={picking}
                  onPickCoords={handleMapPick}
                />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.status} onChange={(e) => set('status', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
                <span className="text-sm text-slate-700 font-medium">เปิดใช้งาน</span>
              </label>
            </div>
          </fieldset>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all">
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 transition-all shadow-sm">
            {saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล'}
          </button>
        </div>
      </div>
    </div>
  );
}
