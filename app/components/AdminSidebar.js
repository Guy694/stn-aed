'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft, Zap, Stethoscope, RadioTower, BarChart2, Shield, Users, Building2, Hospital, ScrollText } from 'lucide-react';

const baseStyle = {
  activeBg: 'bg-slate-800',
  activeText: 'text-white',
  activeBorder: 'border-slate-700',
};

const mainMenu = [
  { href: '/admin', icon: Building2, label: 'หน้าหลักโมดูล', description: 'เลือกโมดูลที่ต้องการใช้งาน', iconBg: 'bg-white/10', iconColor: 'text-cyan-200', ...baseStyle },
  { href: '/dashboard', icon: BarChart2, label: 'Dashboard', description: 'ภาพรวมข้อมูลระบบ', iconBg: 'bg-white/10', iconColor: 'text-emerald-200', ...baseStyle },
  { href: '/admin/users', icon: Users, label: 'สิทธิผู้ใช้งาน', description: 'เปิด-ปิดสิทธิ์รายโมดูล', iconBg: 'bg-white/10', iconColor: 'text-indigo-200', ...baseStyle },
  { href: '/admin/audit', icon: ScrollText, label: 'Audit Logs', description: 'ประวัติการดำเนินการ', iconBg: 'bg-white/10', iconColor: 'text-amber-200', ...baseStyle },
  { href: '/admin/facilities', icon: Building2, label: 'หน่วยบริการ', description: 'จัดการข้อมูลหน่วยบริการ', iconBg: 'bg-white/10', iconColor: 'text-emerald-200', ...baseStyle },
];

const orgItems = [
  { label: 'รพ.สต', icon: Hospital },
  { label: 'รพท', icon: Hospital },
  { label: 'รพช', icon: Hospital },
  { label: 'สสจ.', icon: Hospital },
  { label: 'สสอ.', icon: Hospital },
];

const moduleMenus = {
  aed: {
    title: 'โมดูล AED',
    items: [
      {
        href: '/dashboard?module=aed',
        icon: BarChart2,
        label: 'Dashboard AED',
        description: 'ภาพรวมข้อมูล AED',
        iconBg: 'bg-white/10',
        iconColor: 'text-sky-200',
        activeBg: 'bg-white/15',
        activeText: 'text-white',
        activeBorder: 'border-white/20',
      },
      {
        href: '/admin/aed?tab=aed',
        icon: Zap,
        label: 'จัดการจุดบริการ AED',
        description: 'เพิ่ม แก้ไข ลบจุด AED',
        iconBg: 'bg-white/10',
        iconColor: 'text-sky-200',
        activeBg: 'bg-white/15',
        activeText: 'text-white',
        activeBorder: 'border-white/20',
      },
      {
        href: '/admin/aed?tab=reports',
        icon: Users,
        label: 'รายงานปัญหา',
        description: 'รายการแจ้งปัญหา AED',
        iconBg: 'bg-white/10',
        iconColor: 'text-amber-200',
        activeBg: 'bg-white/15',
        activeText: 'text-white',
        activeBorder: 'border-white/20',
      },
    ],
  },
  dental: {
    title: 'โมดูลทันตกรรม',
    items: [
      {
        href: '/dashboard?module=dental',
        icon: BarChart2,
        label: 'Dashboard ทันตกรรม',
        description: 'ภาพรวมข้อมูลทันตกรรม',
        iconBg: 'bg-white/10',
        iconColor: 'text-violet-200',
        activeBg: 'bg-white/15',
        activeText: 'text-white',
        activeBorder: 'border-white/20',
      },
      {
        href: '/admin/dental',
        icon: Stethoscope,
        label: 'จัดการจุดบริการทันตกรรม',
        description: 'เพิ่ม แก้ไข ลบหน่วยทันตกรรม',
        iconBg: 'bg-white/10',
        iconColor: 'text-violet-200',
        activeBg: 'bg-white/15',
        activeText: 'text-white',
        activeBorder: 'border-white/20',
      },
    ],
  },
  healthStations: {
    title: 'โมดูล Health Station',
    items: [
      {
        href: '/dashboard?module=health-stations',
        icon: BarChart2,
        label: 'Dashboard Health Station',
        description: 'ภาพรวมข้อมูล Health Station',
        iconBg: 'bg-white/10',
        iconColor: 'text-teal-200',
        activeBg: 'bg-white/15',
        activeText: 'text-white',
        activeBorder: 'border-white/20',
      },
      {
        href: '/admin/health-stations',
        icon: RadioTower,
        label: 'จัดการจุดบริการ',
        description: 'เพิ่ม แก้ไข ลบสถานี',
        iconBg: 'bg-white/10',
        iconColor: 'text-teal-200',
        activeBg: 'bg-white/15',
        activeText: 'text-white',
        activeBorder: 'border-white/20',
      },
    ],
  },
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dashboardModule = pathname === '/dashboard' ? searchParams.get('module') : null;
  const activeModuleKey = dashboardModule === 'aed' || pathname.startsWith('/admin/aed')
    ? 'aed'
    : dashboardModule === 'dental' || pathname.startsWith('/admin/dental')
      ? 'dental'
      : dashboardModule === 'health-stations' || pathname.startsWith('/admin/health-stations')
        ? 'healthStations'
        : null;

  const currentItems = activeModuleKey ? moduleMenus[activeModuleKey].items : mainMenu;
  const currentTitle = activeModuleKey ? moduleMenus[activeModuleKey].title : 'เมนูหน้าหลัก';

  const isActive = (href) => {
    const cleanHref = href.split('?')[0];
    const hrefParams = new URLSearchParams(href.split('?')[1] || '');

    if (cleanHref === '/dashboard' && hrefParams.has('module')) {
      return pathname === '/dashboard' && searchParams.get('module') === hrefParams.get('module');
    }

    if (href.includes('?tab=reports')) {
      const hasReportsTab = searchParams.get('tab') === 'reports';
      return pathname.startsWith('/admin/aed') && hasReportsTab;
    }

    if (href.includes('?tab=aed')) {
      const hasAedTab = searchParams.get('tab') === 'aed';
      return pathname.startsWith('/admin/aed') && hasAedTab;
    }

    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/dashboard/';
    if (href === '/admin') return pathname === '/admin' || pathname === '/admin/';
    return pathname.startsWith(cleanHref);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-64 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 text-white">
      {/* Brand header */}
      <div className="px-4 py-4 border-b border-slate-800 flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-white leading-tight">ระบบจัดการข้อมูล</p>
          <p className="text-[10px] text-slate-400 leading-tight">จังหวัดสตูล</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        <div>
          <p className="mb-1.5 px-2 text-xs font-semibold text-slate-400">
            {currentTitle}
          </p>
          <div className="space-y-0.5">
            {currentItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                    active
                      ? `${item.activeBg} ${item.activeText} ${item.activeBorder} shadow-sm`
                      : 'border-transparent text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      active ? item.activeBg : item.iconBg
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? item.activeText : item.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate leading-tight">{item.label}</p>
                    <p className="text-[10px] text-slate-500 font-normal truncate leading-tight mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {!activeModuleKey && (
          <div>
            <p className="mb-1.5 px-2 text-xs font-semibold text-slate-400">หน่วยบริการ</p>
            <div className="space-y-1">
              {orgItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900">
                    <Icon className="w-3.5 h-3.5 text-sky-300" />
                    <span className="text-xs font-medium text-slate-300">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeModuleKey ? (
          <div>
            <p className="mb-1.5 px-2 text-xs font-semibold text-slate-400">Navigation</p>
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">กลับหน้าเลือกโมดูล</span>
            </Link>
          </div>
        ) : (
          <div>
            <p className="mb-1.5 px-2 text-xs font-semibold text-slate-400">โมดูลทั้งหมด</p>
            <div className="space-y-0.5">
              <Link
                href="/admin/facilities"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate leading-tight">หน่วยบริการ</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">จัดการข้อมูลหน่วยบริการ</p>
                </div>
              </Link>
              <Link
                href="/admin/aed"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-100">
                  <Zap className="w-4 h-4 text-sky-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate leading-tight">AED</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">จัดการข้อมูล AED</p>
                </div>
              </Link>
              <Link
                href="/admin/dental"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-100">
                  <Stethoscope className="w-4 h-4 text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate leading-tight">ทันตกรรม</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">จัดการข้อมูลทันตกรรม</p>
                </div>
              </Link>
              <Link
                href="/admin/health-stations"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-100">
                  <RadioTower className="w-4 h-4 text-teal-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate leading-tight">Health Station</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">จัดการข้อมูลสถานี</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <p className="text-center text-[10px] text-slate-500">สำนักงานสาธารณสุขจังหวัดสตูล</p>
      </div>
    </aside>
  );
}
