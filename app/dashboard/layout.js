import { redirect } from 'next/navigation';

import { getSession } from '@/app/lib/session';
import { isModuleEnabledForUser } from '@/app/lib/module-permissions';

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    const enabled = await isModuleEnabledForUser(session.userId, session.role, 'dashboard');
    if (!enabled) {
      redirect('/staff');
    }
  }

  return <>{children}</>;
}
