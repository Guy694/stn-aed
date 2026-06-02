'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

function normalizePath(path) {
  if (!path || path === '/') return '/';
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

export default function StaffModuleSidebar({ moduleConfig, theme }) {
  const pathname = normalizePath(usePathname());
  const workspacePath = normalizePath(moduleConfig.workspaceRoute);
  const moduleRoute = normalizePath(moduleConfig.route);

  const isActive = (href) => {
    const target = normalizePath(href);
    if (pathname === target) return true;
    if (target !== '/' && pathname.startsWith(`${target}/`)) return true;

    return pathname === workspacePath && target === moduleRoute;
  };

  return (
    <aside className="relative lg:col-span-3 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-4 text-white shadow-2xl">
      <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className={`relative mb-5 h-1.5 rounded-full bg-gradient-to-r ${theme.gradient}`} />
      <div className="relative">
        <p className={`text-xs uppercase tracking-[0.2em] font-bold ${theme.text}`}>{moduleConfig.sidebarTitle}</p>
        <h2 className="mt-2 text-xl font-black text-white">{moduleConfig.label}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">เมนูด้านซ้ายถูกแยกตามโมดูลที่เลือกใช้งาน</p>
      </div>

      <div className="relative mt-5 space-y-1.5">
        {moduleConfig.sidebarItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'border-white/20 bg-white/15 text-white shadow-sm'
                  : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span>{item.label}</span>
              <span
                className={`h-2 w-2 rounded-full transition-all ${
                  active ? `bg-gradient-to-r ${theme.gradient}` : 'bg-white/20 group-hover:bg-white/40'
                }`}
              />
            </Link>
          );
        })}
      </div>

      <div className="relative mt-5 border-t border-white/10 pt-4">
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-all hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />กลับหน้าเลือกโมดูล
        </Link>
      </div>
    </aside>
  );
}
