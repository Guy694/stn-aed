import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { checkRateLimit, rateLimitResponse } from '@/app/lib/rate-limit';

const REPORT_TYPE_LABELS = {
  damaged:     'เครื่องชำรุด/เสียหาย',
  maintenance: 'ต้องการบำรุงรักษา',
  missing:     'เครื่องหาย/สูญหาย',
  battery:     'แบตเตอรี่หมด/ใกล้หมด',
  other:       'อื่นๆ',
};

// POST /api/aed/[id]/report — public endpoint (no auth required)
export async function POST(request, { params }) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'aed-report',
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimit.limited) return rateLimitResponse(rateLimit);

  try {
    const { id } = await params;
    const aedId = parseInt(id, 10);
    if (!aedId || isNaN(aedId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verify AED exists
    const [aed] = await query(
      'SELECT id, location_name, district_name, manager_name, manager_phone FROM aed WHERE id = ?',
      [aedId]
    );
    if (!aed) {
      return NextResponse.json({ error: 'ไม่พบข้อมูล AED' }, { status: 404 });
    }

    const body = await request.json();
    const { reporter_name, reporter_phone, report_type, description } = body;

    if (!report_type || !REPORT_TYPE_LABELS[report_type]) {
      return NextResponse.json({ error: 'กรุณาระบุประเภทปัญหา' }, { status: 400 });
    }

    // Sanitise inputs
    const safeReporterName  = reporter_name?.toString().trim().slice(0, 255) || null;
    const safeReporterPhone = reporter_phone?.toString().trim().slice(0, 50)  || null;
    const safeDescription   = description?.toString().trim().slice(0, 2000)   || null;

    // Insert report
    const result = await query(
      `INSERT INTO aed_reports (aed_id, reporter_name, reporter_phone, report_type, description, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [aedId, safeReporterName, safeReporterPhone, report_type, safeDescription]
    );

    // ── Telegram notification ──
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const typeLabel = REPORT_TYPE_LABELS[report_type];
      const now = new Date().toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        dateStyle: 'short',
        timeStyle: 'short',
      });

      const lines = [
        '🚨 *แจ้งปัญหาเครื่อง AED*',
        '',
        `📍 *สถานที่:* ${escMd(aed.location_name)}`,
        aed.district_name ? `🏥 *อำเภอ:* ${escMd(aed.district_name)}` : null,
        `⚠️ *ประเภทปัญหา:* ${escMd(typeLabel)}`,
        safeDescription   ? `📝 *รายละเอียด:* ${escMd(safeDescription)}` : null,
        '',
        safeReporterName || safeReporterPhone
          ? `👤 *ผู้แจ้ง:* ${escMd(safeReporterName || '-')}${safeReporterPhone ? ` \\(${escMd(safeReporterPhone)}\\)` : ''}`
          : null,
        aed.manager_name
          ? `🔧 *ผู้ดูแลเครื่อง:* ${escMd(aed.manager_name)}${aed.manager_phone ? ` \\(${escMd(aed.manager_phone)}\\)` : ''}`
          : null,
        '',
        `🕐 *เวลา:* ${now}`,
      ].filter((l) => l !== null).join('\n');

      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: 'MarkdownV2' }),
        });
        await query('UPDATE aed_reports SET notified_at = NOW() WHERE id = ?', [result.insertId]);
      } catch (tgErr) {
        console.error('Telegram notify error:', tgErr);
      }
    }

    return NextResponse.json({ id: result.insertId, message: 'แจ้งปัญหาสำเร็จ' }, { status: 201 });
  } catch (error) {
    console.error('Report AED error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

// Escape special chars for Telegram MarkdownV2
function escMd(text) {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+=|{}.!\\-]/g, '\\$&');
}
