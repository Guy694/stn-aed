import { getSession } from '@/app/lib/session';
import { redirect } from 'next/navigation';
import { getUserModulePermissions } from '@/app/lib/module-permissions';
import StaffWorkspaceShell from '@/app/components/StaffWorkspaceShell';

export default async function MyReportsLayout({ children }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    const permissions = await getUserModulePermissions(session.userId, session.role);
    if (!permissions.my_reports) {
      redirect('/staff');
    }
    return (
      <StaffWorkspaceShell session={session} moduleKey="my_reports" permissions={permissions}>
        {children}
      </StaffWorkspaceShell>
    );
  }

  return <>{children}</>;
}
