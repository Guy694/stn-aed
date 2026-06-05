'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, UserPlus2 } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

function formatFacilityLabel(facility) {
  if (!facility) return '';

  return [
    facility.name,
    facility.district_name ? `อ.${facility.district_name}` : '',
    facility.tambon ? `ต.${facility.tambon}` : '',
  ].filter(Boolean).join(' • ');
}

export default function RegisterPage() {
  const [draft, setDraft] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [facilityQuery, setFacilityQuery] = useState('');
  const [showFacilityOptions, setShowFacilityOptions] = useState(false);
  const [facilityError, setFacilityError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    password: '',
    phone: '',
    position_name: '',
    facility_id: '',
    facility_name: '',
    note: '',
    source: 'form',
    line_user_id: '',
  });

  const params = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const source = params.get('source') === 'line' ? 'line' : 'form';
  const pendingFlag = params.get('status') === 'pending';

  const facilityOptions = useMemo(() => {
    return [...facilities].sort((a, b) => {
      const districtCompare = String(a.district_name || '').localeCompare(String(b.district_name || ''), 'th');
      if (districtCompare !== 0) return districtCompare;
      return String(a.name || '').localeCompare(String(b.name || ''), 'th');
    });
  }, [facilities]);

  const filteredFacilityOptions = useMemo(() => {
    const query = facilityQuery.trim().toLowerCase();
    if (!query) return facilityOptions.slice(0, 80);

    return facilityOptions
      .filter((facility) => {
        const searchText = [
          facility.name,
          facility.typecode,
          facility.district_name,
          facility.tambon,
        ].filter(Boolean).join(' ').toLowerCase();

        return searchText.includes(query);
      })
      .slice(0, 80);
  }, [facilityOptions, facilityQuery]);

  useEffect(() => {
    let ignore = false;

    const loadFacilities = async () => {
      setLoadingFacilities(true);
      setFacilityError('');

      try {
        const res = await fetch(`${BASE}/api/facilities`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'โหลดรายชื่อหน่วยบริการไม่สำเร็จ');
        if (ignore) return;

        setFacilities(
          Array.isArray(data)
            ? data.filter((facility) => facility?.name && Number(facility?.is_active ?? 1) === 1)
            : [],
        );
      } catch (e) {
        if (!ignore) setFacilityError(e.message || 'ไม่สามารถโหลดรายชื่อหน่วยบริการได้');
      } finally {
        if (!ignore) setLoadingFacilities(false);
      }
    };

    loadFacilities();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadDraft = async () => {
      setLoadingDraft(true);
      if (source !== 'line') {
        setForm((prev) => ({ ...prev, source: 'form' }));
        setLoadingDraft(false);
        return;
      }

      try {
        const res = await fetch(`${BASE}/api/auth/line/register-draft`);
        const data = await res.json();
        if (!res.ok || ignore) return;

        const lineDraft = data?.draft || null;
        setDraft(lineDraft);
        setForm((prev) => ({
          ...prev,
          source: 'line',
          full_name: lineDraft?.full_name || prev.full_name,
          line_user_id: lineDraft?.line_user_id || '',
        }));
      } catch {
        if (!ignore) setError('ไม่สามารถโหลดข้อมูล LINE ได้ กรุณาลองใหม่');
      } finally {
        if (!ignore) setLoadingDraft(false);
      }
    };

    loadDraft();
    return () => {
      ignore = true;
    };
  }, [source]);

  const onChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setNotice('');
  };

  const selectFacility = (facility) => {
    setForm((prev) => ({
      ...prev,
      facility_id: String(facility.id),
      facility_name: facility.name,
    }));
    setFacilityQuery(formatFacilityLabel(facility));
    setShowFacilityOptions(false);
    setError('');
    setNotice('');
  };

  const onFacilityQueryChange = (event) => {
    const { value } = event.target;
    setFacilityQuery(value);
    setShowFacilityOptions(true);
    setForm((prev) => ({
      ...prev,
      facility_id: '',
      facility_name: '',
    }));
    setError('');
    setNotice('');
  };

  const onFacilityKeyDown = (event) => {
    if (event.key !== 'Enter' || form.facility_id || filteredFacilityOptions.length === 0) return;

    event.preventDefault();
    selectFacility(filteredFacilityOptions[0]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    if (!form.facility_id) {
      setError('กรุณาเลือกหน่วยบริการที่สังกัด');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ส่งคำขอไม่สำเร็จ');

      setNotice(data.message || 'ส่งคำขอลงทะเบียนเรียบร้อยแล้ว');
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาดในระบบ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-5">
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าเข้าสู่ระบบ
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <UserPlus2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900">ลงทะเบียนเจ้าหน้าที่</h1>
              <p className="text-sm text-slate-500">ส่งคำขอเพื่อให้แอดมินตรวจสอบและอนุมัติการใช้งาน</p>
            </div>
          </div>

          {source === 'line' && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              เข้าสู่ระบบด้วย LINE ครั้งแรก กรุณากรอกข้อมูลลงทะเบียนก่อนใช้งานระบบ
            </div>
          )}

          {pendingFlag && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              บัญชี LINE นี้มีคำขอรออนุมัติอยู่แล้ว หากต้องการแก้ไขข้อมูลสามารถส่งฟอร์มใหม่ได้
            </div>
          )}

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {notice && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {notice}
            </div>
          )}

          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              required
              placeholder="ชื่อผู้ใช้"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            />
            <input
              name="full_name"
              value={form.full_name}
              onChange={onChange}
              required
              placeholder="ชื่อ-นามสกุล"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
              minLength={6}
              placeholder="รหัสผ่านอย่างน้อย 6 ตัว"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            />
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="เบอร์โทรศัพท์"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            />
            <input
              name="position_name"
              value={form.position_name}
              onChange={onChange}
              placeholder="ตำแหน่ง"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            />
            <div className="relative">
              <input
                value={facilityQuery}
                onChange={onFacilityQueryChange}
                onFocus={() => setShowFacilityOptions(true)}
                onBlur={() => setTimeout(() => setShowFacilityOptions(false), 120)}
                onKeyDown={onFacilityKeyDown}
                required
                disabled={loadingFacilities || facilityOptions.length === 0}
                placeholder={
                  loadingFacilities
                    ? 'กำลังโหลดหน่วยบริการ...'
                    : facilityOptions.length === 0
                      ? 'ไม่พบรายชื่อหน่วยบริการ'
                      : 'พิมพ์ค้นหาหน่วยบริการที่สังกัด'
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
              {showFacilityOptions && !loadingFacilities && facilityOptions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {filteredFacilityOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">ไม่พบหน่วยบริการที่ตรงกับคำค้น</div>
                  ) : (
                    filteredFacilityOptions.map((facility) => (
                      <button
                        key={facility.id}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectFacility(facility);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-sky-50"
                      >
                        <span className="block font-semibold text-slate-800">{facility.name}</span>
                        <span className="block text-xs text-slate-500">
                          {[facility.typecode, facility.district_name ? `อ.${facility.district_name}` : '', facility.tambon ? `ต.${facility.tambon}` : '']
                            .filter(Boolean)
                            .join(' • ')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {facilityError && (
              <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {facilityError}
              </div>
            )}
            <textarea
              name="note"
              value={form.note}
              onChange={onChange}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 min-h-24"
            />

            <input type="hidden" name="source" value={form.source} />
            <input type="hidden" name="line_user_id" value={form.line_user_id} />
            <input type="hidden" name="facility_name" value={form.facility_name} />

            <button
              type="submit"
              disabled={
                submitting
                || loadingFacilities
                || facilityOptions.length === 0
                || Boolean(facilityError)
                || (source === 'line' && !draft?.line_user_id)
              }
              className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-white text-sm font-semibold hover:bg-sky-500 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus2 className="w-4 h-4" />}
              {submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอลงทะเบียน'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
