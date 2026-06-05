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
    <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0">
      <div className={`mb-4 h-1.5 rounded-full bg-gradient-to-r ${theme.gradient}`} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{moduleConfig.sidebarTitle}</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">{moduleConfig.label}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">เมนูที่เกี่ยวข้องกับโมดูลนี้เท่านั้น</p>
      </div>

      <div className="mt-4 space-y-2">
        {moduleConfig.sidebarItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-sky-200 bg-sky-50 text-sky-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span>{item.label}</span>
              <span
                className={`h-2 w-2 rounded-full transition-all ${
                  active ? `bg-gradient-to-r ${theme.gradient}` : 'bg-slate-300 group-hover:bg-slate-400'
                }`}
              />
            </Link>
          );
        })}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />กลับหน้าเลือกโมดูล
        </Link>
      </div>
    </aside>
  );
}
