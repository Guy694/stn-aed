import Link from 'next/link';
import { LayoutDashboard, ShieldCheck, Building2, Hospital, Zap, Stethoscope, RadioTower, ScrollText, ArrowUpRight } from 'lucide-react';

const modules = [
  {
    href: '/admin/aed',
    title: 'AED',
    description: 'Dashboard, จัดการจุดบริการ AED และรายงานปัญหา',
    icon: Zap,
    color: 'from-sky-500 via-cyan-500 to-blue-700',
    glow: 'shadow-sky-500/25',
  },
  {
    href: '/admin/dental',
    title: 'ทันตกรรม',
    description: 'Dashboard, จัดการหน่วยทันตกรรม และรายงานปัญหา',
    icon: Stethoscope,
    color: 'from-violet-500 via-fuchsia-500 to-purple-700',
    glow: 'shadow-violet-500/25',
  },
  {
    href: '/admin/health-stations',
    title: 'Health Station',
    description: 'Dashboard, จัดการสถานี และรายงานปัญหา',
    icon: RadioTower,
    color: 'from-emerald-500 via-teal-500 to-cyan-700',
    glow: 'shadow-emerald-500/25',
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

export default function AdminIndexPage() {
  return (
    <div className="px-6 py-7 space-y-7">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-7 text-white shadow-2xl">
        <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Main Dashboard</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">ระบบจัดการข้อมูลสุขภาพ สตูล</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            เลือกโมดูลที่ต้องการใช้งาน เมนูด้านซ้ายจะเปลี่ยนเป็นเมนูเฉพาะของโมดูลนั้นทันที เพื่อให้หน้าจอทำงานไม่รกและโฟกัสงานได้ชัดเจน
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 mb-3">โมดูลระบบ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white p-5 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl ${module.glow}`}
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${module.color}`} />
                <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-slate-100 blur-2xl transition-all group-hover:bg-cyan-100" />
                <div className="flex items-start gap-3">
                  <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${module.color} text-white flex items-center justify-center shadow-lg ${module.glow}`}>
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

      <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 mb-3">เมนูหน้าหลัก</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-3 py-2 shadow-sm">
                <Icon className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
