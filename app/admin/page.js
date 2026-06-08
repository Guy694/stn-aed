import Link from 'next/link';
import { LayoutDashboard, ShieldCheck, Building2, Hospital, Zap, Stethoscope, RadioTower, ScrollText, ArrowUpRight } from 'lucide-react';
import { redirect } from 'next/navigation';

import { getUserModulePermissions } from '@/app/lib/module-permissions';
import { getSession } from '@/app/lib/session';

const modules = [
  {
    href: '/admin/facilities',
    title: 'หน่วยบริการ',
    description: 'จัดการข้อมูลหน่วยบริการสาธารณสุข',
    icon: Building2,
    barClass: 'bg-emerald-600',
    iconClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    href: '/admin/aed',
    title: 'AED',
    description: 'Dashboard, จัดการจุดบริการ AED และรายงานปัญหา',
    icon: Zap,
    barClass: 'bg-sky-600',
    iconClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    href: '/admin/dental',
    title: 'ทันตกรรม',
    description: 'Dashboard, จัดการหน่วยทันตกรรม และรายงานปัญหา',
    icon: Stethoscope,
    barClass: 'bg-violet-600',
    iconClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    href: '/admin/health-stations',
    title: 'Health Station',
    description: 'Dashboard, จัดการสถานี และรายงานปัญหา',
    icon: RadioTower,
    barClass: 'bg-teal-600',
    iconClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
];

const mainMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'สิทธิผู้ใช้งาน', icon: ShieldCheck },
  { label: 'Audit Logs', icon: ScrollText },
  { label: 'หน่วยบริการ', icon: Building2 },
  { label: 'รพ.สต', icon: Hospital },
  { label: 'รพท', icon: Hospital },
  { label: 'รพช', icon: Hospital },
  { label: 'สสจ.', icon: Hospital },
  { label: 'สสอ.', icon: Hospital },
];

export default async function AdminIndexPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (session.role !== 'admin') {
    const permissions = await getUserModulePermissions(session.userId, session.role);

    if (permissions.manage_aed) redirect('/admin/facilities');
    if (permissions.manage_dental) redirect('/admin/dental');
    if (permissions.manage_health_stations) redirect('/admin/health-stations');

    redirect('/staff');
  }

  return (
    <div className="space-y-6 px-6 py-7">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
          <p className="text-sm font-semibold text-slate-500">Admin</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">ระบบจัดการข้อมูลสุขภาพ สตูล</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            เลือกโมดูลที่ต้องการใช้งาน เมนูด้านซ้ายจะเปลี่ยนเป็นเมนูเฉพาะของโมดูลนั้นทันที เพื่อให้หน้าจอทำงานไม่รกและโฟกัสงานได้ชัดเจน
          </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-slate-700">โมดูลระบบ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 ${module.barClass}`} />
                <div className="flex items-start gap-3">
                  <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl border ${module.iconClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="relative flex-1">
                    <p className="text-lg font-bold text-slate-900">{module.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{module.description}</p>
                  </div>
                  <ArrowUpRight className="relative h-4 w-4 text-slate-300 transition-all group-hover:text-slate-700" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-700">เมนูหน้าหลัก</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Icon className="w-4 h-4 text-sky-600" />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
