'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';

function normalizePath(path) {
  if (!path || path === '/') return '/';
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

function parseHref(href) {
  const [path, query = ''] = href.split('?');
  return { path: normalizePath(path), params: new URLSearchParams(query) };
}

export default function StaffModuleSidebar({ moduleConfig, theme, permissions }) {
  const pathname = normalizePath(usePathname());
  const searchParams = useSearchParams();
  const workspacePath = normalizePath(moduleConfig.workspaceRoute);
  const visibleItems = moduleConfig.sidebarItems.filter(
    (item) => !item.permission || permissions[item.permission]
  );

  const isActive = (href) => {
    const target = parseHref(href);
    const moduleRoute = parseHref(moduleConfig.route);

    if (pathname === workspacePath) {
      return target.path === moduleRoute.path && target.params.toString() === moduleRoute.params.toString();
    }

    if (pathname !== target.path && !pathname.startsWith(`${target.path}/`)) return false;

    return [...target.params.entries()].every(([key, value]) => searchParams.get(key) === value);
  };

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0">
      <div className={`mb-4 h-1 rounded-full ${theme.bar || 'bg-sky-600'}`} />
      <div>
        <p className="text-xs font-semibold text-slate-500">{moduleConfig.sidebarTitle}</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">{moduleConfig.label}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">แสดงเมนูตามสิทธิ์ของบัญชีนี้</p>
      </div>

      <div className="mt-4 space-y-2">
        {visibleItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-h-11 items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                active
                  ? 'border-sky-200 bg-sky-50 text-sky-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span>{item.label}</span>
              <ChevronRight className={`h-4 w-4 ${active ? 'text-sky-600' : 'text-slate-400'}`} />
            </Link>
          );
        })}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <Link
          href="/staff"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <ArrowLeft className="w-4 h-4" />กลับหน้าเลือกโมดูล
        </Link>
      </div>
    </aside>
  );
}
