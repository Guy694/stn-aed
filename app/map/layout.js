import StaffWorkspaceShell from '@/app/components/StaffWorkspaceShell';
import { getUserModulePermissions } from '@/app/lib/module-permissions';
import { getSession } from '@/app/lib/session';
import { redirect } from 'next/navigation';

export default async function MapLayout({ children }) {
  const session = await getSession();

  if (session && session.role !== 'admin') {
    const permissions = await getUserModulePermissions(session.userId, session.role);
    if (!permissions.map) redirect('/staff');

    return (
      <StaffWorkspaceShell session={session} moduleKey="map" permissions={permissions}>
        {children}
      </StaffWorkspaceShell>
    );
  }

  return <>{children}</>;
}
