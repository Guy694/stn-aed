import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ChevronRight,
  ClipboardList,
  Compass,
  MapPin,
  BarChart3,
  Layers3,
  RadioTower,
  Stethoscope,
  Zap,
  UserCircle2,
  Mail,
  Shield,
  LogOut,
} from 'lucide-react';

import Navbar from '@/app/components/Navbar';
import { getSession, deleteSession } from '@/app/lib/session';
import { ADMIN_MANAGE_MODULES, STAFF_MODULES } from '@/app/lib/modules';
import { getUserModulePermissions } from '@/app/lib/module-permissions';

function iconFor(moduleKey) {
  switch (moduleKey) {
    case 'map':
      return MapPin;
    case 'dashboard':
      return BarChart3;
    case 'my_reports':
      return ClipboardList;
    case 'manage_aed':
      return Zap;
    case 'manage_dental':
      return Stethoscope;
    case 'manage_health_stations':
      return RadioTower;
    default:
      return Layers3;
  }
}

function accentFor(moduleKey) {
  switch (moduleKey) {
    case 'dashboard':
      return {
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: 'bg-emerald-600 text-white',
        border: 'border-emerald-200 hover:border-emerald-300',
      };
    case 'my_reports':
      return {
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: 'bg-amber-600 text-white',
        border: 'border-amber-200 hover:border-amber-300',
      };
    case 'manage_dental':
      return {
        badge: 'bg-violet-100 text-violet-700 border-violet-200',
        icon: 'bg-violet-600 text-white',
        border: 'border-violet-200 hover:border-violet-300',
      };
    case 'manage_health_stations':
      return {
        badge: 'bg-teal-100 text-teal-700 border-teal-200',
        icon: 'bg-teal-600 text-white',
        border: 'border-teal-200 hover:border-teal-300',
      };
    case 'manage_aed':
      return {
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        icon: 'bg-cyan-700 text-white',
        border: 'border-cyan-200 hover:border-cyan-300',
      };
    default:
      return {
        badge: 'bg-sky-100 text-sky-700 border-sky-200',
        icon: 'bg-sky-600 text-white',
        border: 'border-sky-200 hover:border-sky-300',
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
  const enabledModules = [...STAFF_MODULES, ...ADMIN_MANAGE_MODULES].filter((m) => permissions[m.key]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={session} />

      <aside className="border-b border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:fixed lg:inset-y-16 lg:left-0 lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-5">
        <div className="space-y-3 lg:space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 lg:h-12 lg:w-12 lg:rounded-2xl">
                <UserCircle2 className="h-6 w-6 text-slate-600 lg:h-7 lg:w-7" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900">{session.fullName}</p>
                <p className="text-sm text-slate-500">เจ้าหน้าที่ระบบ</p>
              </div>
            </div>

            <div className="mt-4 hidden space-y-2 lg:block">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="truncate">{session.username}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <Shield className="h-4 w-4 text-slate-500" />
                <span>Role: {session.role}</span>
              </div>
            </div>
          </div>

          <div className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
            <p className="text-sm font-semibold text-slate-900">ทางลัด</p>
            <div className="mt-3 space-y-2">
              <Link
                href="/staff"
                className="flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                หน้าเลือกโมดูล
                <ChevronRight className="h-4 w-4 text-sky-500" />
              </Link>
              <Link
                href="/map"
                className="flex min-h-11 items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                หน้าแผนที่
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </div>

          <form action={logoutAction} className="hidden lg:block">
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <LogOut className="h-4 w-4" />ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-4 py-4 md:px-6 md:py-8 lg:ml-72 lg:mr-0 lg:max-w-none lg:p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold text-sky-700">พื้นที่ทำงานตามสิทธิ์</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">พื้นที่ทำงานเจ้าหน้าที่</h1>
              <p className="mt-2 text-sm text-slate-600">
                เลือกโมดูลที่ต้องการใช้งาน ระบบจะแสดงเฉพาะโมดูลที่ได้รับสิทธิ์จากแอดมิน
              </p>
            </div>
            <Link
              href="/map"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <Compass className="h-4 w-4" />เปิดหน้าแผนที่
            </Link>
          </div>
        </section>

        <section className="mt-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-bold text-slate-900">โมดูลที่ได้รับสิทธิ์</p>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {enabledModules.length} โมดูล
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">กดเลือกโมดูลเพื่อเข้าสู่หน้าทำงานเฉพาะส่วน</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {enabledModules.map((module) => {
              const Icon = iconFor(module.key);
              const accent = accentFor(module.key);

              return (
                <Link
                  key={module.key}
                  href={module.entryRoute || module.workspaceRoute}
                  className={`group rounded-2xl border bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${accent.border}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.icon}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${accent.badge}`}>
                        ได้รับสิทธิ์
                      </span>
                      <p className="mt-1 text-base font-bold text-slate-900">{module.label}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{module.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>

          {enabledModules.length === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="font-semibold text-amber-800">ยังไม่มีโมดูลที่เปิดใช้งานสำหรับบัญชีนี้</p>
              <p className="mt-1 text-sm text-amber-700">กรุณาติดต่อแอดมินเพื่อขอสิทธิ์การใช้งาน</p>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
