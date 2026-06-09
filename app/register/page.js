'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Info, Loader2, UserPlus2 } from 'lucide-react';

import { apiFetch, publicPath } from '@/app/lib/client-api';

function formatFacilityLabel(facility) {
  if (!facility) return '';

  return [
    facility.name,
    facility.district_name ? `อ.${facility.district_name}` : '',
    facility.tambon ? `ต.${facility.tambon}` : '',
  ].filter(Boolean).join(' • ');
}

async function readJsonResponse(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();

  const bodyText = await response.text().catch(() => '');
  throw new Error(bodyText ? fallbackMessage : 'ไม่ได้รับข้อมูลจากระบบ');
}

export default function RegisterPage() {
  const router = useRouter();
  const [draft, setDraft] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [facilityQuery, setFacilityQuery] = useState('');
  const [positionQuery, setPositionQuery] = useState('');
  const [showFacilityOptions, setShowFacilityOptions] = useState(false);
  const [showPositionOptions, setShowPositionOptions] = useState(false);
  const [facilityError, setFacilityError] = useState('');
  const [positionError, setPositionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [successDialog, setSuccessDialog] = useState(null);
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
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

  const positionOptions = useMemo(() => {
    return [...positions].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th'));
  }, [positions]);

  const filteredPositionOptions = useMemo(() => {
    const query = positionQuery.trim().toLowerCase();
    if (!query) return positionOptions.slice(0, 80);

    return positionOptions
      .filter((position) => String(position.name || '').toLowerCase().includes(query))
      .slice(0, 80);
  }, [positionOptions, positionQuery]);

  useEffect(() => {
    let ignore = false;

    const loadFacilities = async () => {
      setLoadingFacilities(true);
      setFacilityError('');

      try {
        const res = await apiFetch(`/api/facilities`);
        const data = await readJsonResponse(res, 'โหลดรายชื่อหน่วยบริการไม่สำเร็จ');
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

    const loadPositions = async () => {
      setLoadingPositions(true);
      setPositionError('');

      try {
        const res = await apiFetch(`/api/staff-positions`);
        const data = await readJsonResponse(res, 'โหลดรายชื่อตำแหน่งไม่สำเร็จ');
        if (!res.ok) throw new Error(data.error || 'โหลดรายชื่อตำแหน่งไม่สำเร็จ');
        if (ignore) return;

        setPositions(Array.isArray(data.positions) ? data.positions.filter((position) => position?.name) : []);
      } catch (e) {
        if (!ignore) setPositionError(e.message || 'ไม่สามารถโหลดรายชื่อตำแหน่งได้');
      } finally {
        if (!ignore) setLoadingPositions(false);
      }
    };

    loadPositions();
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
        const res = await apiFetch(`/api/auth/line/register-draft`);
        const data = await readJsonResponse(res, 'ไม่สามารถโหลดข้อมูล LINE ได้');
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

  useEffect(() => {
    if (!successDialog) return undefined;

    const redirectTimer = window.setTimeout(() => {
      router.push('/');
    }, 2200);

    const onKeyDown = (event) => {
      if (event.key === 'Enter') router.push('/');
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(redirectTimer);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [router, successDialog]);

  const onChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setNotice('');
    setSuccessDialog(null);
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
    setSuccessDialog(null);
  };

  const selectPosition = (position) => {
    setForm((prev) => ({
      ...prev,
      position_name: position.name,
    }));
    setPositionQuery(position.name);
    setShowPositionOptions(false);
    setError('');
    setNotice('');
    setSuccessDialog(null);
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
    setSuccessDialog(null);
  };

  const onPositionQueryChange = (event) => {
    const { value } = event.target;
    setPositionQuery(value);
    setShowPositionOptions(true);
    setForm((prev) => ({
      ...prev,
      position_name: '',
    }));
    setError('');
    setNotice('');
    setSuccessDialog(null);
  };

  const onFacilityKeyDown = (event) => {
    if (event.key !== 'Enter' || form.facility_id || filteredFacilityOptions.length === 0) return;

    event.preventDefault();
    selectFacility(filteredFacilityOptions[0]);
  };

  const onPositionKeyDown = (event) => {
    if (event.key !== 'Enter' || form.position_name || filteredPositionOptions.length === 0) return;

    event.preventDefault();
    selectPosition(filteredPositionOptions[0]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSuccessDialog(null);
    setSubmitting(true);

    if (!form.facility_id) {
      setError('กรุณาเลือกหน่วยบริการที่สังกัด');
      setSubmitting(false);
      return;
    }

    if (!form.position_name) {
      setError('กรุณาเลือกตำแหน่งเจ้าหน้าที่จากรายการ');
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiFetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await readJsonResponse(res, 'ส่งคำขอไม่สำเร็จ');
      if (!res.ok) throw new Error(data.error || 'ส่งคำขอไม่สำเร็จ');

      const successMessage = data.message || 'ส่งคำขอลงทะเบียนเรียบร้อย รอแอดมินอนุมัติ';
      setNotice(successMessage);
      setSuccessDialog({
        message: successMessage,
        source: form.source,
      });
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาดในระบบ');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-400';
  const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700';
  const helpClass = 'mt-1.5 text-xs leading-5 text-slate-500';

  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/login" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าเข้าสู่ระบบ
        </Link>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className="border-b border-slate-200 bg-slate-950 bg-cover bg-center bg-no-repeat px-5 py-5 text-white md:px-8"
            style={{ backgroundImage: `url(${publicPath('/img/bglogin.png')})` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white">
              <UserPlus2 className="w-5 h-5" />
            </div>
            <div>
                <h1 className="text-xl font-black leading-tight md:text-2xl">ลงทะเบียนเจ้าหน้าที่</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                  ส่งคำขอให้แอดมินตรวจสอบสิทธิ์ เมื่ออนุมัติแล้วระบบจะแจ้งผลไปยังอีเมลที่กรอก
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8">
          {source === 'line' && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>เข้าสู่ระบบด้วย LINE ครั้งแรก กรุณากรอกข้อมูลลงทะเบียนก่อนใช้งานระบบ</span>
            </div>
          )}

          {pendingFlag && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>บัญชี LINE นี้มีคำขอรออนุมัติอยู่แล้ว หากต้องการแก้ไขข้อมูลสามารถส่งฟอร์มใหม่ได้</span>
            </div>
          )}

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {notice && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {notice}
            </div>
          )}

          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="register-username">ชื่อผู้ใช้ <span className="text-red-500">*</span></label>
              <input
                id="register-username"
                name="username"
                value={form.username}
                onChange={onChange}
                required
                autoComplete="username"
                placeholder="เช่น somchai.s"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="register-full-name">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
              <input
                id="register-full-name"
                name="full_name"
                value={form.full_name}
                onChange={onChange}
                required
                autoComplete="name"
                placeholder="ชื่อและนามสกุลจริง"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="register-email">อีเมลสำหรับแจ้งผลอนุมัติ <span className="text-red-500">*</span></label>
              <input
                id="register-email"
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                autoComplete="email"
                placeholder="name@example.go.th"
                className={inputClass}
              />
              <p className={helpClass}>ระบบจะส่งผลการอนุมัติไปยังอีเมลนี้</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="register-password">รหัสผ่าน <span className="text-red-500">*</span></label>
              <input
                id="register-password"
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className={inputClass}
              />
              <p className={helpClass}>ใช้เข้าสู่ระบบหลังได้รับอนุมัติ</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="register-phone">เบอร์โทรศัพท์</label>
              <input
                id="register-phone"
                name="phone"
                value={form.phone}
                onChange={onChange}
                autoComplete="tel"
                placeholder="เบอร์ที่ติดต่อได้"
                className={inputClass}
              />
            </div>
            <div className="relative">
              <label className={labelClass} htmlFor="register-position">ตำแหน่งเจ้าหน้าที่ <span className="text-red-500">*</span></label>
              <input
                id="register-position"
                value={positionQuery}
                onChange={onPositionQueryChange}
                onFocus={() => setShowPositionOptions(true)}
                onBlur={() => setTimeout(() => setShowPositionOptions(false), 120)}
                onKeyDown={onPositionKeyDown}
                required
                disabled={loadingPositions || positionOptions.length === 0}
                placeholder={
                  loadingPositions
                    ? 'กำลังโหลดตำแหน่ง...'
                    : positionOptions.length === 0
                      ? 'ไม่พบรายชื่อตำแหน่ง'
                      : 'พิมพ์ค้นหาตำแหน่งเจ้าหน้าที่'
                }
                className={inputClass}
              />
              <p className={helpClass}>พิมพ์เพื่อค้นหา แล้วเลือกจากรายการตำแหน่งในระบบ</p>
              {showPositionOptions && !loadingPositions && positionOptions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {filteredPositionOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">ไม่พบตำแหน่งที่ตรงกับคำค้น</div>
                  ) : (
                    filteredPositionOptions.map((position) => (
                      <button
                        key={position.id}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectPosition(position);
                        }}
                        className="w-full px-3 py-2 text-left text-sm font-semibold text-sky-900 hover:bg-sky-50"
                      >
                        {position.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="relative md:col-span-2">
              <label className={labelClass} htmlFor="register-facility">หน่วยบริการที่สังกัด <span className="text-red-500">*</span></label>
              <input
                id="register-facility"
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
                className={inputClass}
              />
              <p className={helpClass}>ค้นหาจากชื่อหน่วยบริการ อำเภอ ตำบล หรือรหัสประเภทหน่วยบริการ</p>
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
            {positionError && (
              <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {positionError}
              </div>
            )}
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="register-note">หมายเหตุเพิ่มเติม</label>
              <textarea
                id="register-note"
                name="note"
                value={form.note}
                onChange={onChange}
                placeholder="ระบุข้อมูลเพิ่มเติมสำหรับแอดมิน ถ้ามี"
                className={`${inputClass} min-h-24 resize-y`}
              />
            </div>

            <input type="hidden" name="source" value={form.source} />
            <input type="hidden" name="line_user_id" value={form.line_user_id} />
            <input type="hidden" name="facility_name" value={form.facility_name} />

            <button
              type="submit"
              disabled={
                submitting
                || loadingFacilities
                || loadingPositions
                || facilityOptions.length === 0
                || positionOptions.length === 0
                || Boolean(facilityError)
                || Boolean(positionError)
                || (source === 'line' && !draft?.line_user_id)
              }
              className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus2 className="w-4 h-4" />}
              {submitting ? 'กำลังส่งคำขอ...' : 'ขอลงทะเบียน'}
            </button>
          </form>
          </div>
        </div>
      </div>

      {successDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-success-title"
            aria-describedby="registration-success-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 id="registration-success-title" className="text-lg font-black text-slate-900">
              ส่งคำขอลงทะเบียนแล้ว
            </h2>
            <p id="registration-success-description" className="mt-2 text-sm leading-6 text-slate-600">
              {successDialog.message}
              {successDialog.source === 'line'
                ? ' บัญชี LINE นี้จะเข้าใช้งานได้หลังแอดมินอนุมัติ'
                : ' คุณสามารถกลับไปหน้าเข้าสู่ระบบได้หลังได้รับการอนุมัติ'}
              {' '}ระบบจะกลับไปหน้าแรกอัตโนมัติ
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
              >
                กลับหน้าแรก
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
