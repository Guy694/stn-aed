import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/app/lib/db';
import { createSession } from '@/app/lib/session';
import { ensureRegistrationRequestTable } from '@/app/lib/registration-requests';

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

    const existingUsers = await query(
      'SELECT id, username, full_name, role FROM users WHERE line_user_id = ? LIMIT 1',
      [lineUserId],
    );

    if (existingUsers.length === 0) {
      await ensureRegistrationRequestTable();

      const pending = await query(
        `SELECT id
         FROM staff_registration_requests
         WHERE line_user_id = ? AND status = 'pending'
         LIMIT 1`,
        [lineUserId],
      );

      cookieStore.set(
        'line_register_draft',
        JSON.stringify({
          line_user_id: lineUserId,
          full_name: displayName,
          picture_url: pictureUrl ?? null,
          has_pending_request: pending.length > 0,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 30,
          path: '/',
        },
      );

      const registerUrl = new URL('/register', request.url);
      registerUrl.searchParams.set('source', 'line');
      if (pending.length > 0) {
        registerUrl.searchParams.set('status', 'pending');
      }
      return NextResponse.redirect(registerUrl);
    }

    await query(
      `UPDATE users
       SET full_name = ?, picture_url = ?
       WHERE id = ?`,
      [displayName, pictureUrl ?? null, existingUsers[0].id],
    );

    const user = existingUsers[0];

    await createSession({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    });

    cookieStore.delete('line_register_draft');

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const dest = `${basePath}${user.role === 'admin' ? '/admin/' : '/staff'}`;
    return NextResponse.redirect(new URL(dest, request.url));
  } catch (err) {
    console.error('LINE callback error:', err);
    loginUrl.searchParams.set('error', 'server_error');
    return NextResponse.redirect(loginUrl);
  }
}
