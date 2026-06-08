import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { query } from '@/app/lib/db';
import { ensureRegistrationRequestTable, upsertPendingRegistration } from '@/app/lib/registration-requests';
import { checkRateLimit, rateLimitResponse } from '@/app/lib/rate-limit';
import { recordRateLimitEvent, recordRegistrationRequestEvent } from '@/app/lib/security-events';
import { isActiveStaffPositionName } from '@/app/lib/staff-positions';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  const rateLimitOptions = {
    keyPrefix: 'auth-register',
    limit: 5,
    windowMs: 10 * 60 * 1000,
  };
  const rateLimit = checkRateLimit(request, rateLimitOptions);
  if (rateLimit.limited) {
    await recordRateLimitEvent({
      request,
      ...rateLimitOptions,
      summary: 'มีการส่งคำขอลงทะเบียนถี่เกินกำหนด',
    });
    return rateLimitResponse(rateLimit);
  }

  try {
    const body = await request.json();

    const username = String(body?.username || '').trim();
    const fullName = String(body?.full_name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const phone = String(body?.phone || '').trim() || null;
    const positionName = String(body?.position_name || '').trim() || null;
    const facilityId = Number(body?.facility_id || 0);
    let facilityName = String(body?.facility_name || '').trim() || null;
    const note = String(body?.note || '').trim() || null;
    const source = body?.source === 'line' ? 'line' : 'form';
    const lineUserId = body?.line_user_id ? String(body.line_user_id).trim() : null;

    if (!username || !fullName || !email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้ ชื่อ-นามสกุล อีเมล และรหัสผ่าน' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    if (!positionName || !(await isActiveStaffPositionName(positionName))) {
      return NextResponse.json({ error: 'กรุณาเลือกตำแหน่งเจ้าหน้าที่จากรายการ' }, { status: 400 });
    }

    if (!Number.isFinite(facilityId) || facilityId <= 0) {
      return NextResponse.json({ error: 'กรุณาเลือกหน่วยบริการที่สังกัด' }, { status: 400 });
    }

    const facilities = await query(
      `SELECT name
       FROM health_facilities
       WHERE id = ? AND is_active = 1
       LIMIT 1`,
      [facilityId],
    );
    if (facilities.length === 0) {
      return NextResponse.json({ error: 'ไม่พบหน่วยบริการที่เลือก หรือหน่วยบริการไม่เปิดใช้งาน' }, { status: 400 });
    }
    facilityName = facilities[0].name;

    const users = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (users.length > 0) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' }, { status: 409 });
    }

    await ensureRegistrationRequestTable();

    const pendingByUsername = await query(
      `SELECT id
       FROM staff_registration_requests
       WHERE username = ? AND status = 'pending'
       LIMIT 1`,
      [username],
    );
    if (pendingByUsername.length > 0) {
      return NextResponse.json({ error: 'มีคำขอลงทะเบียนนี้อยู่ระหว่างรออนุมัติแล้ว' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const requestId = await upsertPendingRegistration({
      source,
      lineUserId,
      username,
      fullName,
      email,
      phone,
      positionName,
      facilityName,
      note,
      passwordHash,
    });

    await recordRegistrationRequestEvent({
      request,
      requestId,
      registration: {
        source,
        lineUserId,
        username,
        fullName,
        email,
        phone,
        positionName,
        facilityName,
      },
    });

    return NextResponse.json({
      success: true,
      requestId,
      message: 'ส่งคำขอลงทะเบียนเรียบร้อย รอแอดมินอนุมัติ',
    });
  } catch (error) {
    console.error('Register request error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
