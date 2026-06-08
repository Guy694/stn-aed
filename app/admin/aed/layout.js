import { redirect } from 'next/navigation';

import { getUserModulePermissions } from '@/app/lib/module-permissions';
import { getSession } from '@/app/lib/session';
import StaffWorkspaceShell from '@/app/components/StaffWorkspaceShell';

export default async function AdminAedLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  if (session.role !== 'admin') {
    const permissions = await getUserModulePermissions(session.userId, session.role);
    if (!permissions.manage_aed) redirect('/staff');
    return (
      <StaffWorkspaceShell session={session} moduleKey="manage_aed" permissions={permissions}>
        {children}
      </StaffWorkspaceShell>
    );
  }

  return <>{children}</>;
}
