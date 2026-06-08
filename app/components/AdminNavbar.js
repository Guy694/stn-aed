'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BarChart2, Home, LogOut, Map, Shield, UserCircle2 } from 'lucide-react';

import { apiFetch } from '@/app/lib/client-api';

function getAdminContext(pathname, searchParams) {
  if (pathname === '/dashboard') {
    const moduleKey = searchParams.get('module');
    if (moduleKey === 'aed') return { title: 'Dashboard AED', section: 'โมดูล AED' };
    if (moduleKey === 'dental') return { title: 'Dashboard ทันตกรรม', section: 'โมดูลทันตกรรม' };
    if (moduleKey === 'health-stations') return { title: 'Dashboard Health Station', section: 'โมดูล Health Station' };
    return { title: 'Dashboard รวม', section: 'ภาพรวมระบบ' };
  }

  if (pathname.startsWith('/admin/aed')) return { title: 'จัดการจุดบริการ AED', section: 'โมดูล AED' };
  if (pathname.startsWith('/admin/dental')) return { title: 'จัดการจุดบริการทันตกรรม', section: 'โมดูลทันตกรรม' };
  if (pathname.startsWith('/admin/health-stations')) return { title: 'จัดการจุดบริการ', section: 'โมดูล Health Station' };
  if (pathname.startsWith('/admin/facilities')) return { title: 'จัดการหน่วยบริการ', section: 'ข้อมูลพื้นฐาน' };
  if (pathname.startsWith('/admin/users')) return { title: 'สิทธิผู้ใช้งาน', section: 'ผู้ดูแลระบบ' };
  if (pathname.startsWith('/admin/audit')) return { title: 'Audit Logs', section: 'ความปลอดภัย' };
  return { title: 'ระบบจัดการข้อมูลสุขภาพ สตูล', section: 'Admin' };
}

export default function AdminNavbar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const context = getAdminContext(pathname, searchParams);
  const displayName = user?.fullName || user?.full_name || user?.username || 'Admin';

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Shield className="h-3.5 w-3.5 text-sky-600" />
            <span>{context.section}</span>
          </div>
          <h1 className="mt-0.5 truncate text-base font-black text-slate-950">
            {context.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 md:inline-flex"
          >
            <Home className="h-3.5 w-3.5" />
            หน้าหลัก
          </Link>
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 lg:inline-flex"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Dashboard รวม
          </Link>
          <Link
            href="/map"
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 lg:inline-flex"
          >
            <Map className="h-3.5 w-3.5" />
            แผนที่
          </Link>

          <div className="ml-2 hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:flex">
            <UserCircle2 className="h-4 w-4 text-slate-500" />
            <span className="max-w-40 truncate font-semibold">{displayName}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  );
}
