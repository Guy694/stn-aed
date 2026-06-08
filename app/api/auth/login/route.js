import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/app/lib/db';
import { createSession } from '@/app/lib/session';
import { ensureRegistrationRequestTable } from '@/app/lib/registration-requests';
import { checkRateLimit, rateLimitResponse } from '@/app/lib/rate-limit';
import { recordLoginFailure, recordRateLimitEvent } from '@/app/lib/security-events';

export async function POST(request) {
  const rateLimitOptions = {
    keyPrefix: 'auth-login',
    limit: 20,
    windowMs: 10 * 60 * 1000,
  };
  const rateLimit = checkRateLimit(request, rateLimitOptions);
  if (rateLimit.limited) {
    await recordRateLimitEvent({
      request,
      ...rateLimitOptions,
      summary: 'มีการพยายามเข้าสู่ระบบถี่เกินกำหนด',
    });
    return rateLimitResponse(rateLimit);
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      await recordLoginFailure({ request, username, reason: 'missing_credentials' });
      return NextResponse.json(
        { error: 'กรุณากรอก username และ password' },
        { status: 400 }
      );
    }

    const users = await query(
      'SELECT id, username, password_hash, full_name, role FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (users.length === 0) {
      await ensureRegistrationRequestTable();
      const pending = await query(
        `SELECT id
         FROM staff_registration_requests
         WHERE username = ? AND status = 'pending'
         LIMIT 1`,
        [username],
      );

      if (pending.length > 0) {
        await recordLoginFailure({ request, username, reason: 'pending_registration' });
        return NextResponse.json(
          { error: 'บัญชีนี้กำลังรอแอดมินอนุมัติ' },
          { status: 403 },
        );
      }

      await recordLoginFailure({ request, username, reason: 'unknown_username' });
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      await recordLoginFailure({ request, username, reason: 'invalid_password' });
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    await createSession(user);

    const redirectTo = user.role === 'admin' ? '/admin' : '/staff';

    return NextResponse.json({
      success: true,
      redirectTo,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
