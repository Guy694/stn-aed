import { getSession } from '@/app/lib/session';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <>{children}</>;
}
