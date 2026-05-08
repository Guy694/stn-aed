import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/app/lib/db';
import { createSession } from '@/app/lib/session';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const loginUrl = new URL('/login', request.url);

  if (errorParam) {
    loginUrl.searchParams.set('error', 'line_denied');
    return NextResponse.redirect(loginUrl);
  }

  if (!code || !state) {
    loginUrl.searchParams.set('error', 'invalid_request');
    return NextResponse.redirect(loginUrl);
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const storedState = cookieStore.get('line_oauth_state')?.value;
  cookieStore.delete('line_oauth_state');

  if (!storedState || storedState !== state) {
    loginUrl.searchParams.set('error', 'state_mismatch');
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_REDIRECT_URI,
        client_id: process.env.LINE_CLIENT_ID,
        client_secret: process.env.LINE_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      loginUrl.searchParams.set('error', 'token_exchange');
      return NextResponse.redirect(loginUrl);
    }

    const { access_token } = await tokenRes.json();

    // Get LINE profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      loginUrl.searchParams.set('error', 'profile_fetch');
      return NextResponse.redirect(loginUrl);
    }

    const { userId: lineUserId, displayName, pictureUrl } = await profileRes.json();

    // Upsert user (default role = 'user')
    await query(
      `INSERT INTO users (line_user_id, username, full_name, picture_url, role)
       VALUES (?, ?, ?, ?, 'user')
       ON DUPLICATE KEY UPDATE
         full_name   = VALUES(full_name),
         picture_url = VALUES(picture_url)`,
      [lineUserId, lineUserId, displayName, pictureUrl ?? null]
    );

    const [user] = await query(
      'SELECT id, full_name, role FROM users WHERE line_user_id = ? LIMIT 1',
      [lineUserId]
    );

    await createSession({
      id: user.id,
      username: displayName,
      full_name: user.full_name,
      role: user.role,
    });

    const dest = user.role === 'admin' ? '/stn-aed/admin/' : '/stn-aed/my-reports';
    return NextResponse.redirect(new URL(dest, request.url));
  } catch (err) {
    console.error('LINE callback error:', err);
    loginUrl.searchParams.set('error', 'server_error');
    return NextResponse.redirect(loginUrl);
  }
}
