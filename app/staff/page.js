import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  LayoutGrid,
  MapPin,
  BarChart2,
  AlertTriangle,
  UserCircle2,
  Mail,
  Shield,
  LogOut,
  ArrowUpRight,
} from 'lucide-react';

import { getSession, deleteSession } from '@/app/lib/session';
import { STAFF_MODULES } from '@/app/lib/modules';
import { getUserModulePermissions } from '@/app/lib/module-permissions';

function iconFor(moduleKey) {
  switch (moduleKey) {
    case 'map':
      return MapPin;
    case 'dashboard':
      return BarChart2;
    default:
      return AlertTriangle;
  }
}

function themeFor(moduleKey) {
  switch (moduleKey) {
    case 'dashboard':
      return {
        gradient: 'from-emerald-500 via-teal-500 to-cyan-700',
        glow: 'shadow-emerald-500/25',
        tint: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      };
    case 'my_reports':
      return {
        gradient: 'from-amber-500 via-orange-500 to-rose-600',
        glow: 'shadow-amber-500/25',
        tint: 'bg-amber-50 text-amber-700 border-amber-100',
      };
    default:
      return {
        gradient: 'from-sky-500 via-cyan-500 to-blue-700',
        glow: 'shadow-sky-500/25',
        tint: 'bg-sky-50 text-sky-700 border-sky-100',
      };
  }
}

async function logoutAction() {
  'use server';
  await deleteSession();
  redirect('/login');
}

export default async function StaffPortalPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'admin') redirect('/admin');

  const permissions = await getUserModulePermissions(session.userId, session.role);
  const enabledModules = STAFF_MODULES.filter((m) => permissions[m.key]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.20),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="max-w-[1500px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <aside className="relative lg:col-span-3 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-2xl">
            <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />

            <div className="relative px-6 py-7 border-b border-white/10">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 p-1 shadow-2xl shadow-cyan-500/20">
                <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center">
                  <UserCircle2 className="w-14 h-14 text-cyan-100" />
                </div>
              </div>
              <h2 className="mt-4 text-center text-xl font-bold text-white">{session.fullName}</h2>
              <p className="mt-1 text-center text-sm text-cyan-200">เจ้าหน้าที่ระบบ</p>
              <div className="mt-5 space-y-2 text-sm text-slate-300">
                <p className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <Mail className="w-4 h-4 text-cyan-300" />{session.username}
                </p>
                <p className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <Shield className="w-4 h-4 text-emerald-300" />Role: {session.role}
                </p>
              </div>
            </div>

            <div className="relative p-4 space-y-2">
              <Link
                href="/staff"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/15 text-white border border-white/20 text-sm font-semibold shadow-lg shadow-cyan-950/20"
              >
                <LayoutGrid className="w-4 h-4" />หน้าโมดูลของฉัน
              </Link>
              <Link
                href="/map"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 border border-transparent hover:border-white/10 text-sm font-medium transition-all"
              >
                <MapPin className="w-4 h-4" />หน้าแผนที่
              </Link>
            </div>

            <form action={logoutAction} className="relative p-4 pt-0">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-400/25 text-red-100 text-sm font-semibold hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />ออกจากระบบ
              </button>
            </form>
          </aside>

          <main className="lg:col-span-9 space-y-5">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-2xl">
              <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
              <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200 font-bold">Staff Portal</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">หน้าแรกเจ้าหน้าที่</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  เลือกโมดูลที่ต้องการใช้งาน ระบบจะแสดงเฉพาะโมดูลที่แอดมินอนุญาตให้บัญชีของคุณใช้งาน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {enabledModules.map((module) => {
                const Icon = iconFor(module.key);
                const theme = themeFor(module.key);
                return (
                  <Link
                    key={module.key}
                    href={module.workspaceRoute}
                    className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white p-5 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl ${theme.glow}`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${theme.gradient}`} />
                    <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-slate-100 blur-2xl transition-all group-hover:bg-cyan-100" />
                    <div className="flex items-start gap-3">
                      <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white flex items-center justify-center shadow-lg ${theme.glow}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="relative min-w-0 flex-1">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${theme.tint}`}>
                          เปิดใช้งาน
                        </span>
                        <p className="text-lg font-bold text-slate-900 leading-tight">{module.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{module.description}</p>
                      </div>
                      <ArrowUpRight className="relative h-4 w-4 text-slate-300 transition-all group-hover:text-slate-700" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {enabledModules.length === 0 && (
              <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-8 text-center shadow-xl">
                <p className="text-amber-800 font-semibold">ยังไม่มีโมดูลที่เปิดใช้งานสำหรับบัญชีนี้</p>
                <p className="text-sm text-slate-500 mt-1">กรุณาติดต่อแอดมินเพื่อเปิดสิทธิ์การใช้งานโมดูล</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
