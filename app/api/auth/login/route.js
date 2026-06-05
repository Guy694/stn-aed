import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/app/lib/db';
import { createSession } from '@/app/lib/session';
import { ensureRegistrationRequestTable } from '@/app/lib/registration-requests';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
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
        return NextResponse.json(
          { error: 'บัญชีนี้กำลังรอแอดมินอนุมัติ' },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
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
