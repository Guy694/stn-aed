import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CLIENT_ID,
    redirect_uri: process.env.LINE_REDIRECT_URI,
    state,
    scope: 'profile openid',
  });

  const cookieStore = await cookies();
  cookieStore.set('line_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params}`
  );
}
