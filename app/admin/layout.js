import { getSession } from '@/app/lib/session';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/app/components/AdminSidebar';

export default async function AdminLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'admin') {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe,transparent_32%),radial-gradient(circle_at_bottom_right,#dcfce7,transparent_30%),linear-gradient(135deg,#f8fafc,#eef2ff)]">
        <AdminSidebar />
        <div className="ml-64 min-h-screen flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
