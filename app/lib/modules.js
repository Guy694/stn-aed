export const STAFF_MODULES = [
  {
    key: 'map',
    label: 'แผนที่ AED',
    description: 'ดูข้อมูล AED, ทันตกรรม และ Health Station บนแผนที่',
    icon: 'MapPin',
    route: '/map',
    workspaceRoute: '/staff/module/map',
    color: 'sky',
    sidebarTitle: 'งานแผนที่',
    sidebarItems: [
      { label: 'หน้าแผนที่หลัก', href: '/map' },
      { label: 'แดชบอร์ดสรุป', href: '/dashboard' },
    ],
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'ดูสถิติภาพรวม AED, ทันตกรรม และ Health Station',
    icon: 'BarChart2',
    route: '/dashboard',
    workspaceRoute: '/staff/module/dashboard',
    color: 'emerald',
    sidebarTitle: 'งานวิเคราะห์',
    sidebarItems: [
      { label: 'หน้า Dashboard', href: '/dashboard' },
      { label: 'หน้าแผนที่', href: '/map' },
    ],
  },
  {
    key: 'my_reports',
    label: 'แจ้งรายงาน AED',
    description: 'แจ้งปัญหา AED และติดตามสถานะการดำเนินการ',
    icon: 'AlertTriangle',
    route: '/my-reports',
    workspaceRoute: '/staff/module/my_reports',
    color: 'amber',
    sidebarTitle: 'งานรายงาน',
    sidebarItems: [
      { label: 'แจ้งปัญหา AED', href: '/my-reports' },
      { label: 'แดชบอร์ดสรุป', href: '/dashboard' },
    ],
  },
];

export const STAFF_MODULE_KEYS = STAFF_MODULES.map((m) => m.key);

export function getStaffModuleByKey(key) {
  return STAFF_MODULES.find((m) => m.key === key) || null;
}
