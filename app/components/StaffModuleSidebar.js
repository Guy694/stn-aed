'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  MapPin,
  Menu,
  RadioTower,
  Shield,
  Stethoscope,
  UserCircle2,
  X,
  Zap,
} from 'lucide-react';

import { apiFetch } from '@/app/lib/client-api';
import { ADMIN_MANAGE_MODULES, STAFF_MODULES } from '@/app/lib/modules';

const allModules = [...STAFF_MODULES, ...ADMIN_MANAGE_MODULES];

const moduleVisuals = {
  map: { icon: MapPin, iconColor: 'text-sky-200' },
  dashboard: { icon: BarChart2, iconColor: 'text-emerald-200' },
  my_reports: { icon: ClipboardList, iconColor: 'text-amber-200' },
  manage_aed: { icon: Zap, iconColor: 'text-cyan-200' },
  manage_dental: { icon: Stethoscope, iconColor: 'text-violet-200' },
  manage_health_stations: { icon: RadioTower, iconColor: 'text-teal-200' },
};

function normalizePath(path) {
  if (!path || path === '/') return '/';
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

function parseHref(href) {
  const [path, query = ''] = href.split('?');
  return { path: normalizePath(path), params: new URLSearchParams(query) };
}

function iconForContextItem(item) {
  if (item.href.includes('reports') || item.href.includes('my-reports')) return AlertTriangle;
  if (item.href.includes('dashboard')) return BarChart2;
  if (item.href.includes('dental')) return Stethoscope;
  if (item.href.includes('health-stations')) return RadioTower;
  if (item.href.includes('aed')) return Zap;
  return MapPin;
}

function NavItem({ active, description, href, icon: Icon, iconColor = 'text-sky-200', label, onNavigate }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`group flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
        active
          ? 'border-slate-700 bg-slate-800 text-white'
          : 'border-transparent text-slate-300 hover:bg-slate-900 hover:text-white'
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-white/10' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
        <Icon className={`h-4 w-4 ${active ? 'text-white' : iconColor}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-tight">{label}</span>
        {description && (
          <span className={`mt-0.5 block truncate text-[10px] leading-tight ${active ? 'text-slate-300' : 'text-slate-500'}`}>
            {description}
          </span>
        )}
      </span>
      <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-slate-300' : 'text-slate-600 group-hover:text-slate-400'}`} />
    </Link>
  );
}

export default function StaffModuleSidebar({ moduleConfig = null, permissions = {}, session = null }) {
  const pathname = normalizePath(usePathname());
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const enabledModules = allModules.filter((module) => permissions[module.key]);
  const operationalModules = enabledModules.filter((module) => module.key.startsWith('manage_'));
  const generalModules = enabledModules.filter((module) => !module.key.startsWith('manage_'));
  const visibleContextItems = moduleConfig?.sidebarItems.filter(
    (item) => !item.permission || permissions[item.permission],
  ) || [];

  const isHrefActive = (href) => {
    const target = parseHref(href);
    if (pathname !== target.path && !pathname.startsWith(`${target.path}/`)) return false;
    return [...target.params.entries()].every(([key, value]) => searchParams.get(key) === value);
  };
  const hasActiveContextItem = visibleContextItems.some((item) => isHrefActive(item.href));

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    closeMobile();
    await apiFetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  const sidebarContent = (
    <>
      <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-800 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold leading-tight text-white">พื้นที่ทำงานเจ้าหน้าที่</p>
          <p className="truncate text-[10px] leading-tight text-slate-400">ระบบข้อมูลสุขภาพ จังหวัดสตูล</p>
        </div>
        <button
          type="button"
          onClick={closeMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="ปิดเมนู"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        <section>
          <p className="mb-1.5 px-2 text-xs font-semibold text-slate-400">เมนูหลัก</p>
          <div className="space-y-0.5">
            <NavItem
              active={pathname === '/staff'}
              href="/staff"
              icon={Home}
              iconColor="text-sky-200"
              label="หน้าเลือกโมดูล"
              description="ภาพรวมสิทธิ์การใช้งาน"
              onNavigate={closeMobile}
            />
          </div>
        </section>

        {moduleConfig && visibleContextItems.length > 0 && (
          <section>
            <p className="mb-1.5 px-2 text-xs font-semibold text-slate-400">{moduleConfig.sidebarTitle}</p>
            <div className="space-y-0.5">
              {visibleContextItems.map((item) => (
                <NavItem
                  key={item.href}
                  active={isHrefActive(item.href)}
                  href={item.href}
                  icon={iconForContextItem(item)}
                  iconColor={moduleVisuals[moduleConfig.key]?.iconColor}
                  label={item.label}
                  onNavigate={closeMobile}
                />
              ))}
            </div>
          </section>
        )}

        {generalModules.length > 0 && (
          <section>
            <p className="mb-1.5 px-2 text-xs font-semibold text-slate-400">งานทั่วไป</p>
            <div className="space-y-0.5">
              {generalModules.map((module) => {
                const visual = moduleVisuals[module.key];
                return (
                  <NavItem
                    key={module.key}
                    active={moduleConfig?.key === module.key && !hasActiveContextItem}
                    href={module.entryRoute || module.workspaceRoute}
                    icon={visual.icon}
                    iconColor={visual.iconColor}
                    label={module.label}
                    description={module.description}
                    onNavigate={closeMobile}
                  />
                );
              })}
            </div>
          </section>
        )}

        {operationalModules.length > 0 && (
          <section>
            <p className="mb-1.5 px-2 text-xs font-semibold text-slate-400">งานจัดการข้อมูล</p>
            <div className="space-y-0.5">
              {operationalModules.map((module) => {
                const visual = moduleVisuals[module.key];
                return (
                  <NavItem
                    key={module.key}
                    active={moduleConfig?.key === module.key && !hasActiveContextItem}
                    href={module.entryRoute || module.workspaceRoute}
                    icon={visual.icon}
                    iconColor={visual.iconColor}
                    label={module.label}
                    description={module.description}
                    onNavigate={closeMobile}
                  />
                );
              })}
            </div>
          </section>
        )}
      </nav>

      <div className="shrink-0 border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-2.5">
          <UserCircle2 className="h-8 w-8 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {session?.fullName || session?.full_name || session?.username || 'เจ้าหน้าที่'}
            </p>
            <p className="truncate text-[10px] text-slate-500">{session?.username || 'บัญชีเจ้าหน้าที่'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label="ออกจากระบบ"
            title="ออกจากระบบ"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-[60] inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 lg:hidden"
        aria-label="เปิดเมนูงานเจ้าหน้าที่"
        aria-expanded={mobileOpen}
      >
        <Menu className="h-4 w-4" />
        เมนูงาน
      </button>

      {mobileOpen && (
        <button
          type="button"
          onClick={closeMobile}
          className="fixed inset-0 z-[60] bg-slate-950/50 lg:hidden"
          aria-label="ปิดเมนู"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-64 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 text-white transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
