'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft, Zap, Stethoscope, RadioTower, BarChart2, Shield, Users, Building2, Hospital, ScrollText } from 'lucide-react';

const baseStyle = {
  activeBg: 'bg-white/15',
  activeText: 'text-white',
  activeBorder: 'border-white/20',
};

const mainMenu = [
  { href: '/admin', icon: Building2, label: 'หน้าหลักโมดูล', description: 'เลือกโมดูลที่ต้องการใช้งาน', iconBg: 'bg-white/10', iconColor: 'text-cyan-200', ...baseStyle },
  { href: '/dashboard', icon: BarChart2, label: 'Dashboard', description: 'ภาพรวมข้อมูลระบบ', iconBg: 'bg-white/10', iconColor: 'text-emerald-200', ...baseStyle },
  { href: '/admin/users', icon: Users, label: 'สิทธิผู้ใช้งาน', description: 'เปิด-ปิดสิทธิ์รายโมดูล', iconBg: 'bg-white/10', iconColor: 'text-indigo-200', ...baseStyle },
  { href: '/admin/audit', icon: ScrollText, label: 'Audit Logs', description: 'ประวัติการดำเนินการ', iconBg: 'bg-white/10', iconColor: 'text-amber-200', ...baseStyle },
  { href: '/admin/aed', icon: Building2, label: 'หน่วยบริการ', description: 'จัดการข้อมูลหน่วยบริการ', iconBg: 'bg-white/10', iconColor: 'text-emerald-200', ...baseStyle },
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
        href: '/dashboard',
        icon: BarChart2,
        label: 'Dashboard',
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
        href: '/dashboard',
        icon: BarChart2,
        label: 'Dashboard',
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
        href: '/dashboard',
        icon: BarChart2,
        label: 'Dashboard',
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
        label: 'จัดการจุดบริการ Health Station',
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

  const activeModuleKey = pathname.startsWith('/admin/aed')
    ? 'aed'
    : pathname.startsWith('/admin/dental')
      ? 'dental'
      : pathname.startsWith('/admin/health-stations')
        ? 'healthStations'
        : null;

  const currentItems = activeModuleKey ? moduleMenus[activeModuleKey].items : mainMenu;
  const currentTitle = activeModuleKey ? moduleMenus[activeModuleKey].title : 'เมนูหน้าหลัก';

  const isActive = (href) => {
    const cleanHref = href.split('?')[0];

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
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-950 text-white border-r border-white/10 z-40 flex flex-col overflow-hidden shadow-2xl">
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 right-0 h-52 w-52 rounded-full bg-emerald-500/15 blur-3xl" />
      {/* Brand header */}
      <div className="relative px-4 py-4 border-b border-white/10 flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-white leading-tight">ระบบจัดการข้อมูล</p>
          <p className="text-[10px] text-cyan-200/80 leading-tight">Admin Command Center</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 p-3 space-y-5 overflow-y-auto">
        <div>
          <p className="text-[9px] font-bold text-cyan-200/70 uppercase tracking-widest mb-1.5 px-2">
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
                      : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white'
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
                    <p className="text-[10px] text-slate-400 font-normal truncate leading-tight mt-0.5">
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
            <p className="text-[9px] font-bold text-cyan-200/70 uppercase tracking-widest mb-1.5 px-2">หน่วยบริการ</p>
            <div className="space-y-1">
              {orgItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Icon className="w-3.5 h-3.5 text-cyan-200" />
                    <span className="text-xs font-medium text-slate-300">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeModuleKey ? (
          <div>
            <p className="text-[9px] font-bold text-cyan-200/70 uppercase tracking-widest mb-1.5 px-2">Navigation</p>
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">กลับหน้าเลือกโมดูล</span>
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-[9px] font-bold text-cyan-200/70 uppercase tracking-widest mb-1.5 px-2">โมดูลทั้งหมด</p>
            <div className="space-y-0.5">
              <Link
                href="/admin/aed"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-slate-300 hover:bg-white/10 hover:text-white"
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-slate-300 hover:bg-white/10 hover:text-white"
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-slate-300 hover:bg-white/10 hover:text-white"
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
      <div className="relative px-4 py-3 border-t border-white/10 shrink-0">
        <p className="text-[10px] text-cyan-100/60 text-center">สำนักงานสาธารณสุขจังหวัดสตูล</p>
      </div>
    </aside>
  );
}
