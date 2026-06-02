'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { X, RadioTower, AlertCircle } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
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

function createFormState(station) {
  if (!station) return { ...EMPTY_FORM };

  return {
    station_name: station.station_name || '',
    district_name: station.district_name || '',
    tambon_name: station.tambon_name || '',
    target_area: station.target_area || '',
    station_type: station.station_type || 'community',
    portable_equipment: !!station.portable_equipment,
    has_scale: !!station.has_scale,
    has_bp_monitor: !!station.has_bp_monitor,
    has_dtx: !!station.has_dtx,
    has_waist_tape: !!station.has_waist_tape,
    has_educational_materials: !!station.has_educational_materials,
    has_aom_assigned: !!station.has_aom_assigned,
    aom_schedule: station.aom_schedule || '',
    is_open: !!station.is_open,
    open_hours: station.open_hours || '',
    lat: station.lat ?? '',
    lon: station.lon ?? '',
    notes: station.notes || '',
  };
}

const EMPTY_FORM = {
  station_name: '',
  district_name: '',
  tambon_name: '',
  target_area: '',
  station_type: 'community',
  portable_equipment: true,
  has_scale: false,
  has_bp_monitor: false,
  has_dtx: false,
  has_waist_tape: false,
  has_educational_materials: false,
  has_aom_assigned: false,
  aom_schedule: '',
  is_open: true,
  open_hours: '',
  lat: '',
  lon: '',
  notes: '',
};

export default function HealthStationModal({ station, onClose, onSave }) {
  const isEdit = !!station?.id;
  const [form, setForm] = useState(() => createFormState(station));
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

  const previewHealthStations =
    form.lat !== '' && form.lon !== ''
      ? [{
          id: 0,
          station_name: form.station_name || 'ตำแหน่งที่เลือก',
          station_type: form.station_type,
          district_name: form.district_name || '',
          is_open: form.is_open,
          has_scale: form.has_scale,
          has_bp_monitor: form.has_bp_monitor,
          has_dtx: form.has_dtx,
          has_waist_tape: form.has_waist_tape,
          has_educational_materials: form.has_educational_materials,
          has_aom_assigned: form.has_aom_assigned,
          portable_equipment: form.portable_equipment,
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

    if (!form.station_name.trim()) {
      setError('กรุณาระบุชื่อ Health Station');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        portable_equipment: form.portable_equipment ? 1 : 0,
        has_scale: form.has_scale ? 1 : 0,
        has_bp_monitor: form.has_bp_monitor ? 1 : 0,
        has_dtx: form.has_dtx ? 1 : 0,
        has_waist_tape: form.has_waist_tape ? 1 : 0,
        has_educational_materials: form.has_educational_materials ? 1 : 0,
        has_aom_assigned: form.has_aom_assigned ? 1 : 0,
        is_open: form.is_open ? 1 : 0,
        lat: parsedLat,
        lon: parsedLon,
      };

      const url = isEdit ? `${BASE}/api/health-stations/${station.id}` : `${BASE}/api/health-stations`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
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

  const equipmentItems = [
    { field: 'has_scale', label: 'เครื่องชั่งน้ำหนัก' },
    { field: 'has_bp_monitor', label: 'เครื่องวัดความดัน' },
    { field: 'has_dtx', label: 'เครื่องตรวจน้ำตาล (DTX)' },
    { field: 'has_waist_tape', label: 'สายวัดรอบเอว' },
    { field: 'has_educational_materials', label: 'สื่อสุขศึกษา' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <RadioTower className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{isEdit ? 'แก้ไข Health Station' : 'เพิ่ม Health Station'}</h2>
              <p className="text-xs text-slate-500">{isEdit ? `แก้ไข #${station.id}` : 'เพิ่มสถานีใหม่'}</p>
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

          {/* ข้อมูลพื้นฐาน */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">ข้อมูลสถานี</legend>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อสถานี <span className="text-red-500">*</span></label>
                <input type="text" value={form.station_name} onChange={(e) => set('station_name', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="เช่น Health Station บ้านโต๊ะสลา" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">อำเภอ</label>
                  <input type="text" value={form.district_name} onChange={(e) => set('district_name', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="เช่น เมืองสตูล" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ตำบล</label>
                  <input type="text" value={form.tambon_name} onChange={(e) => set('tambon_name', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="เช่น พิมาน" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">พื้นที่เป้าหมาย</label>
                  <input type="text" value={form.target_area} onChange={(e) => set('target_area', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="เช่น หมู่ 1-3" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทสถานี</label>
                  <select value={form.station_type} onChange={(e) => set('station_type', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white">
                    <option value="community">สถานีชุมชน</option>
                    <option value="rphst">รพ.สต.</option>
                  </select>
                </div>
              </div>
            </div>
          </fieldset>

          {/* เครื่องมือและอุปกรณ์ */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">เครื่องมือและอุปกรณ์</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.portable_equipment} onChange={(e) => set('portable_equipment', e.target.checked)} className="w-4 h-4 rounded accent-teal-600" />
                <span className="text-sm text-slate-700 font-medium">มีอุปกรณ์แบบพกพา</span>
              </label>
              <div className="ml-1 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {equipmentItems.map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form[field]} onChange={(e) => set(field, e.target.checked)} className="w-4 h-4 rounded accent-teal-600" />
                    <span className="text-sm text-slate-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          {/* การให้บริการ */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">การให้บริการ</legend>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.is_open} onChange={(e) => set('is_open', e.target.checked)} className="w-4 h-4 rounded accent-teal-600" />
                  <span className="text-sm text-slate-700 font-medium">เปิดให้บริการ</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เวลาทำการ</label>
                <input type="text" value={form.open_hours} onChange={(e) => set('open_hours', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="เช่น 08:00-16:00 จ-ศ" />
              </div>
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer mb-2">
                  <input type="checkbox" checked={form.has_aom_assigned} onChange={(e) => set('has_aom_assigned', e.target.checked)} className="w-4 h-4 rounded accent-teal-600" />
                  <span className="text-sm text-slate-700 font-medium">มี AOM (อาสาสมัครสาธารณสุข) รับผิดชอบ</span>
                </label>
                {form.has_aom_assigned && (
                  <input type="text" value={form.aom_schedule} onChange={(e) => set('aom_schedule', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ml-6" placeholder="ตารางปฏิบัติงาน AOM" />
                )}
              </div>
            </div>
          </fieldset>

          {/* พิกัดและหมายเหตุ */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">พิกัดและหมายเหตุ</legend>
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700">ปักหมุดจากแผนที่</span>
                <button
                  type="button"
                  onClick={() => setPicking((prev) => !prev)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    picking
                      ? 'bg-teal-50 text-teal-600 border-teal-200'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  {picking ? 'กำลังเลือก...' : 'คลิกจากแผนที่'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                  <input type="number" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono" placeholder="6.xxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                  <input type="number" step="any" value={form.lon} onChange={(e) => set('lon', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono" placeholder="100.xxxxxx" />
                </div>
              </div>
              <div className="h-56 rounded-xl overflow-hidden border border-slate-200">
                <MapView
                  healthStations={previewHealthStations}
                  pickCoords={picking}
                  onPickCoords={handleMapPick}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ</label>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none" placeholder="ข้อมูลเพิ่มเติม..." />
              </div>
            </div>
          </fieldset>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all">
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-400 hover:to-cyan-500 disabled:opacity-60 transition-all shadow-md">
            {saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสถานี'}
          </button>
        </div>
      </div>
    </div>
  );
}
