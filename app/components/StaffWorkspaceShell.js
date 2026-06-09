import StaffModuleSidebar from '@/app/components/StaffModuleSidebar';
import { getUserModulePermissions } from '@/app/lib/module-permissions';
import { getStaffModuleByKey } from '@/app/lib/modules';

export default async function StaffWorkspaceShell({ session, moduleKey, permissions: providedPermissions, children }) {
  const moduleConfig = getStaffModuleByKey(moduleKey);
  if (!moduleConfig) return children;

  const permissions = providedPermissions || await getUserModulePermissions(session.userId, session.role);

  return (
    <div className="min-h-screen bg-slate-50">
      <StaffModuleSidebar
        moduleConfig={moduleConfig}
        permissions={permissions}
        session={session}
      />
      <div className="lg:ml-64">{children}</div>
    </div>
  );
}
