import { redirect } from 'next/navigation';

import { getSession } from '@/app/lib/session';
import { getUserModulePermissions } from '@/app/lib/module-permissions';

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    const permissions = await getUserModulePermissions(session.userId, session.role);
    const enabled = Boolean(
      permissions.dashboard ||
      permissions.manage_aed ||
      permissions.manage_dental ||
      permissions.manage_health_stations
    );
    if (!enabled) {
      redirect('/staff');
    }
  }

  return <>{children}</>;
}
