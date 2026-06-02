import { redirect } from 'next/navigation';
import { getSession } from '@/app/lib/session';

export default async function StaffLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'admin') {
    redirect('/admin');
  }

  return <>{children}</>;
}
