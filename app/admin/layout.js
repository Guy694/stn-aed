import { getSession } from '@/app/lib/session';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/app/components/AdminSidebar';
import AdminNavbar from '@/app/components/AdminNavbar';

export default async function AdminLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminSidebar />
        <div className="ml-64 min-h-screen flex flex-col">
          <AdminNavbar user={session} />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
