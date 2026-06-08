import StaffModuleSidebar from '@/app/components/StaffModuleSidebar';
import { getUserModulePermissions } from '@/app/lib/module-permissions';
import { getModuleTheme, getStaffModuleByKey } from '@/app/lib/modules';

export default async function StaffWorkspaceShell({ session, moduleKey, permissions: providedPermissions, children }) {
  const moduleConfig = getStaffModuleByKey(moduleKey);
  if (!moduleConfig) return children;

  const permissions = providedPermissions || await getUserModulePermissions(session.userId, session.role);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4 md:p-6 lg:p-0">
        <StaffModuleSidebar
          moduleConfig={moduleConfig}
          theme={getModuleTheme(moduleKey)}
          permissions={permissions}
        />
      </div>
      <div className="lg:ml-72">{children}</div>
    </div>
  );
}
