import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { checkRateLimit, rateLimitResponse } from '@/app/lib/rate-limit';
import { recordRateLimitEvent } from '@/app/lib/security-events';
import { extractClientIp, toNetworkSegment } from '@/app/lib/visit-logs';

const REPORT_TYPE_LABELS = {
  damaged:     'เครื่องชำรุด/เสียหาย',
  maintenance: 'ต้องการบำรุงรักษา',
  missing:     'เครื่องหาย/สูญหาย',
  battery:     'แบตเตอรี่หมด/ใกล้หมด',
  other:       'อื่นๆ',
};

function compact(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function compactUserAgent(value) {
  if (!value) return null;
  return String(value).replace(/\s+/g, ' ').slice(0, 180);
}

function bangkokNow() {
  return new Date().toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

function formatAedReportMessage({
  reportId,
  aedId,
  aed,
  typeLabel,
  description,
  reporterName,
  reporterPhone,
  request,
}) {
  const ipAddress = extractClientIp(request);
  const networkSegment = toNetworkSegment(ipAddress);
  const userAgent = compactUserAgent(request.headers.get('user-agent'));
  const route = [request.method, request.nextUrl?.pathname].filter(Boolean).join(' ');

  return [
    '🚨 ระบบข้อมูลสุขภาพ สตูล',
    'แจ้งปัญหาเครื่อง AED',
    '',
    'สรุปปัญหา',
    `• ประเภท: ${typeLabel}`,
    `• จุดบริการ: ${compact(aed.location_name)}`,
    `• อำเภอ: ${compact(aed.district_name)}`,
    description ? `• รายละเอียด: ${description}` : null,
    '',
    'ผู้แจ้ง',
    `• ชื่อ: ${compact(reporterName, 'ไม่ระบุ')}`,
    `• โทรศัพท์: ${compact(reporterPhone, 'ไม่ระบุ')}`,
    '',
    'ผู้ดูแลเครื่อง',
    `• ชื่อ: ${compact(aed.manager_name, 'ไม่ระบุ')}`,
    `• โทรศัพท์: ${compact(aed.manager_phone, 'ไม่ระบุ')}`,
    '',
    'ต้นทาง',
    `• IP: ${compact(ipAddress)}`,
    networkSegment ? `• Network: ${networkSegment}` : null,
    route ? `• Route: ${route}` : null,
    userAgent ? `• อุปกรณ์/Browser: ${userAgent}` : null,
    '',
    'ควรทำต่อ: ตรวจสอบรายงานในเมนูรายงานปัญหา AED และประสานผู้ดูแลเครื่อง',
    `เวลา: ${bangkokNow()}`,
    `Report ID: ${reportId}`,
    `AED ID: ${aedId}`,
  ].filter(Boolean).join('\n');
}

// POST /api/aed/[id]/report — public endpoint (no auth required)
export async function POST(request, { params }) {
  const rateLimitOptions = {
    keyPrefix: 'aed-report',
    limit: 5,
    windowMs: 10 * 60 * 1000,
  };
  const rateLimit = checkRateLimit(request, rateLimitOptions);
  if (rateLimit.limited) {
    await recordRateLimitEvent({
      request,
      ...rateLimitOptions,
      summary: 'มีการแจ้งปัญหา AED ถี่เกินกำหนด',
    });
    return rateLimitResponse(rateLimit);
  }

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
      const message = formatAedReportMessage({
        reportId: result.insertId,
        aedId,
        aed,
        typeLabel,
        description: safeDescription,
        reporterName: safeReporterName,
        reporterPhone: safeReporterPhone,
        request,
      });

      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            disable_web_page_preview: true,
          }),
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
