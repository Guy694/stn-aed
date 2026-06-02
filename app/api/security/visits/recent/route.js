import { NextResponse } from 'next/server';
import { requireAdmin } from '@/app/lib/auth-guards';
import { getRecentVisitLogs } from '@/app/lib/visit-logs';

export async function GET(request) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const limit = request.nextUrl.searchParams.get('limit');
    const logs = await getRecentVisitLogs(limit);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Recent visit logs error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึง log การเข้าชมได้' }, { status: 500 });
  }
}
