import { redirect } from 'next/navigation';

import { isModuleEnabledForUser } from '@/app/lib/module-permissions';
import { getSession } from '@/app/lib/session';

export default async function AdminHealthStationsLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  if (session.role !== 'admin') {
    const enabled = await isModuleEnabledForUser(session.userId, session.role, 'manage_health_stations');
    if (!enabled) redirect('/staff');
  }

  return <>{children}</>;
}
