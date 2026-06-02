import { NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';
import { checkRateLimit, rateLimitResponse } from '@/app/lib/rate-limit';
import { getVisitStats, insertVisitLog } from '@/app/lib/visit-logs';

export async function GET() {
  try {
    const stats = await getVisitStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Visit stats error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงสถิติผู้เข้าชมได้' }, { status: 500 });
  }
}

export async function POST(request) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'visit-log',
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimit.limited) return rateLimitResponse(rateLimit);

  try {
    const body = await request.json().catch(() => ({}));
    const path = typeof body?.path === 'string' && body.path.trim() ? body.path.trim() : request.nextUrl.pathname;

    const session = await getSession();
    const result = await insertVisitLog({
      request,
      path,
      method: 'VIEW',
      session,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Visit log error:', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกการเข้าชมได้' }, { status: 500 });
  }
}
