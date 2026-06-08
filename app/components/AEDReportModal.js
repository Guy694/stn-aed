'use client';
import { useState } from 'react';
import { X, AlertTriangle, Wrench, PackageSearch, BatteryLow, HelpCircle, CheckCircle2, Send } from 'lucide-react';

import { apiFetch } from '@/app/lib/client-api';

const REPORT_TYPES = [
  { value: 'damaged',     label: 'เครื่องชำรุด/เสียหาย',     icon: AlertTriangle, color: 'red'    },
  { value: 'maintenance', label: 'ต้องการบำรุงรักษา',          icon: Wrench,        color: 'amber'  },
  { value: 'battery',     label: 'แบตเตอรี่หมด/ใกล้หมด',      icon: BatteryLow,    color: 'orange' },
  { value: 'missing',     label: 'เครื่องหาย/สูญหาย',          icon: PackageSearch, color: 'rose'   },
  { value: 'other',       label: 'อื่นๆ',                       icon: HelpCircle,    color: 'slate'  },
];

const COLOR_MAP = {
  red:    'bg-red-50 border-red-200 text-red-700 ring-red-400',
  amber:  'bg-amber-50 border-amber-200 text-amber-700 ring-amber-400',
  orange: 'bg-orange-50 border-orange-200 text-orange-700 ring-orange-400',
  rose:   'bg-rose-50 border-rose-200 text-rose-700 ring-rose-400',
  slate:  'bg-slate-50 border-slate-200 text-slate-700 ring-slate-400',
};

export default function AEDReportModal({ aed, onClose }) {
  const [reportType, setReportType]   = useState('');
  const [description, setDescription] = useState('');
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [done, setDone]               = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportType) { setError('กรุณาเลือกประเภทปัญหา'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch(`/api/aed/${aed.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type:    reportType,
          description:    description.trim() || undefined,
          reporter_name:  name.trim()  || undefined,
          reporter_phone: phone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); return; }
      setDone(true);
    } catch {
      setError('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">แจ้งปัญหาเครื่อง AED</h2>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">{aed?.location_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success state */}
        {done ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">แจ้งปัญหาสำเร็จ</p>
              <p className="text-sm text-slate-500 mt-1">ระบบส่งการแจ้งเตือนไปยังผู้ดูแลแล้ว<br />ขอบคุณที่ช่วยรายงานปัญหา</p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-8 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all"
            >
              ปิด
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Report type selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ประเภทปัญหา <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_TYPES.map(({ value, label, icon: Icon, color }) => {
                  const selected = reportType === value;
                  const cls = COLOR_MAP[color];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReportType(value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                        selected
                          ? `${cls} ring-2 ring-offset-1 shadow-sm`
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="อธิบายปัญหาที่พบ เช่น เครื่องไม่ติด, ไฟกระพริบผิดปกติ..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all text-sm resize-none"
              />
            </div>

            {/* Reporter info (optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ชื่อผู้แจ้ง (ถ้ามี)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">เบอร์ติดต่อ (ถ้ามี)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={20}
                  placeholder="0xx-xxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || !reportType}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 shadow-md"
              >
                <Send className="w-4 h-4" />
                {loading ? 'กำลังส่ง...' : 'ส่งรายงาน'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
