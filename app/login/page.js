'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, LogIn, ArrowLeft, Shield } from 'lucide-react';

import { apiFetch, apiUrl, publicPath } from '@/app/lib/client-api';

const LINE_ERROR_MSG = {
  line_denied:     'คุณยกเลิกการเข้าสู่ระบบด้วย LINE',
  state_mismatch:  'การยืนยันตัวตนล้มเหลว กรุณาลองใหม่',
  token_exchange:  'ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองใหม่',
  profile_fetch:   'ไม่สามารถดึงข้อมูล LINE ได้ กรุณาลองใหม่',
  pending_approval: 'บัญชีของคุณอยู่ระหว่างรอแอดมินอนุมัติ',
  server_error:    'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่',
  invalid_request: 'คำขอไม่ถูกต้อง กรุณาลองใหม่',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lineError = searchParams.get('error');
  const idleLogout = searchParams.get('reason') === 'idle';

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    idleLogout
      ? 'ออกจากระบบอัตโนมัติ เนื่องจากไม่มีการใช้งานเกิน 15 นาที'
      : lineError
        ? (LINE_ERROR_MSG[lineError] ?? 'เกิดข้อผิดพลาด')
        : '',
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด');
        return;
      }
      router.push(data.redirectTo || '/staff');
      router.refresh();
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_440px]">
          <section
            className="hidden border-r border-slate-200 bg-slate-950 bg-cover bg-center bg-no-repeat p-8 text-white lg:flex lg:flex-col lg:justify-between"
            style={{ backgroundImage: `url(${publicPath('/img/bglogin.png')})` }}
          >
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1">
                <Image
                  src={publicPath('/img/logo.png')}
                  alt="ตราสำนักงานสาธารณสุขจังหวัดสตูล"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                  priority
                />
              </div>
              <div className="mt-8 max-w-xl">
                <p className="text-sm font-semibold text-sky-200">สำนักงานสาธารณสุขจังหวัดสตูล</p>
                <h1 className="mt-3 text-3xl font-black leading-tight text-white">
                  ระบบข้อมูลจุดบริการสาธารณสุข จังหวัดสตูล
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
                  เข้าถึงข้อมูล AED หน่วยบริการ ทันตกรรม Health Station และ dashboard จากจุดเดียว พร้อมสิทธิ์การใช้งานตามบทบาท
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              {['AED', 'ทันตกรรม', 'Health Station'].map((label) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <p className="font-semibold text-white">{label}</p>
                  <p className="mt-1 text-xs text-slate-400">ข้อมูลจังหวัด</p>
                </div>
              ))}
            </div>
          </section>

          <section className="p-5 sm:p-8">
            <Link
              href="/map"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้าแผนที่
            </Link>

            <div className="mb-7">
             
              <h2 className="text-2xl font-black leading-tight text-slate-900">เข้าสู่ระบบ</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                เฉพาะเจ้าหน้าที่สาธารณสุขจังหวัดสตูลที่ได้รับอนุมัติแล้ว
              </p>
            </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="username"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  aria-label={showPass ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">หรือ</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* LINE Login */}
          <a
            href={apiUrl('/api/auth/line')}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl text-sm font-semibold bg-[#06C755] hover:bg-[#05b34d] text-white transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            เข้าสู่ระบบด้วย LINE
          </a>

          <Link
            href="/register"
            className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
          >
            ลงทะเบียนเจ้าหน้าที่ใหม่
          </Link>

          {/* Footer note */}
          <p className="text-center text-xs leading-5 text-slate-500 mt-5">
            หากบัญชียังไม่ได้รับอนุมัติ กรุณารออีเมลแจ้งผลจากเจ้าหน้าที่ผู้ดูแลระบบ
          </p>
          </section>
      </div>
    </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
