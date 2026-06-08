export const STAFF_MODULES = [
  {
    key: 'map',
    label: 'แผนที่ AED',
    description: 'ดูข้อมูล AED, ทันตกรรม และ Health Station บนแผนที่',
    icon: 'MapPin',
    route: '/map',
    entryRoute: '/map',
    workspaceRoute: '/staff/module/map',
    color: 'sky',
    sidebarTitle: 'งานแผนที่',
    sidebarItems: [
      { label: 'หน้าแผนที่หลัก', href: '/map' },
      { label: 'แดชบอร์ดสรุป', href: '/dashboard', permission: 'dashboard' },
    ],
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'ดูสถิติภาพรวม AED, ทันตกรรม และ Health Station',
    icon: 'BarChart2',
    route: '/dashboard',
    entryRoute: '/dashboard',
    workspaceRoute: '/staff/module/dashboard',
    color: 'emerald',
    sidebarTitle: 'งานวิเคราะห์',
    sidebarItems: [
      { label: 'หน้า Dashboard', href: '/dashboard' },
      { label: 'หน้าแผนที่', href: '/map', permission: 'map' },
    ],
  },
  {
    key: 'my_reports',
    label: 'แจ้งรายงาน AED',
    description: 'แจ้งปัญหา AED และติดตามสถานะการดำเนินการ',
    icon: 'AlertTriangle',
    route: '/my-reports',
    entryRoute: '/my-reports',
    workspaceRoute: '/staff/module/my_reports',
    color: 'amber',
    sidebarTitle: 'งานรายงาน',
    sidebarItems: [
      { label: 'แจ้งปัญหา AED', href: '/my-reports' },
      { label: 'แดชบอร์ดสรุป', href: '/dashboard', permission: 'dashboard' },
    ],
  },
];

export const STAFF_MODULE_KEYS = STAFF_MODULES.map((m) => m.key);

export const ADMIN_MANAGE_MODULES = [
  {
    key: 'manage_dental',
    label: 'โมดูลทันตกรรม',
    description: 'ดู Dashboard และจัดการข้อมูลจุดบริการทันตกรรม',
    route: '/admin/dental',
    entryRoute: '/dashboard?module=dental',
    workspaceRoute: '/staff/module/manage_dental',
    color: 'violet',
    sidebarTitle: 'จัดการทันตกรรม',
    sidebarItems: [
      { label: 'Dashboard ทันตกรรม', href: '/dashboard?module=dental' },
      { label: 'จัดการจุดบริการทันตกรรม', href: '/admin/dental' },
    ],
  },
  {
    key: 'manage_health_stations',
    label: 'โมดูล Health Station',
    description: 'ดู Dashboard และจัดการข้อมูลจุดบริการ Health Station',
    route: '/admin/health-stations',
    entryRoute: '/dashboard?module=health-stations',
    workspaceRoute: '/staff/module/manage_health_stations',
    color: 'teal',
    sidebarTitle: 'จัดการ Health Station',
    sidebarItems: [
      { label: 'Dashboard Health Station', href: '/dashboard?module=health-stations' },
      { label: 'จัดการจุดบริการ', href: '/admin/health-stations' },
    ],
  },
  {
    key: 'manage_aed',
    label: 'โมดูล AED',
    description: 'ดู Dashboard จัดการจุดบริการ AED และติดตามรายงานปัญหา',
    route: '/admin/aed?tab=aed',
    entryRoute: '/dashboard?module=aed',
    workspaceRoute: '/staff/module/manage_aed',
    color: 'cyan',
    sidebarTitle: 'จัดการ AED',
    sidebarItems: [
      { label: 'Dashboard AED', href: '/dashboard?module=aed' },
      { label: 'จัดการจุดบริการ AED', href: '/admin/aed?tab=aed' },
      { label: 'รายงานปัญหา', href: '/admin/aed?tab=reports' },
    ],
  },
];

export const ADMIN_MANAGE_MODULE_KEYS = ADMIN_MANAGE_MODULES.map((m) => m.key);

export const ALL_MODULE_PERMISSION_KEYS = [
  ...STAFF_MODULE_KEYS,
  ...ADMIN_MANAGE_MODULE_KEYS,
];

export function getStaffModuleByKey(key) {
  return [...STAFF_MODULES, ...ADMIN_MANAGE_MODULES].find((m) => m.key === key) || null;
}

export function getModuleTheme(moduleKey) {
  switch (moduleKey) {
    case 'dashboard':
      return {
        bar: 'bg-emerald-600',
        icon: 'text-emerald-600',
      };
    case 'my_reports':
      return {
        bar: 'bg-amber-600',
        icon: 'text-amber-600',
      };
    case 'manage_dental':
      return {
        bar: 'bg-violet-600',
        icon: 'text-violet-600',
      };
    case 'manage_health_stations':
      return {
        bar: 'bg-teal-600',
        icon: 'text-teal-600',
      };
    default:
      return {
        bar: 'bg-sky-600',
        icon: 'text-sky-600',
      };
  }
}
