import 'server-only';

import { query } from '@/app/lib/db';
import { extractClientIp, toNetworkSegment } from '@/app/lib/visit-logs';

let securityEventTableReady = false;

const LOGIN_IP_ALERT_THRESHOLD = Number(process.env.SECURITY_LOGIN_IP_ALERT_THRESHOLD || 5);
const LOGIN_USERNAME_ALERT_THRESHOLD = Number(process.env.SECURITY_LOGIN_USERNAME_ALERT_THRESHOLD || 3);
const LOGIN_WINDOW_MINUTES = Number(process.env.SECURITY_LOGIN_ALERT_WINDOW_MINUTES || 10);
const WRITE_ACTOR_ALERT_THRESHOLD = Number(process.env.SECURITY_WRITE_ACTOR_ALERT_THRESHOLD || 20);
const WRITE_IP_ALERT_THRESHOLD = Number(process.env.SECURITY_WRITE_IP_ALERT_THRESHOLD || 30);
const WRITE_WINDOW_MINUTES = Number(process.env.SECURITY_WRITE_ALERT_WINDOW_MINUTES || 10);

export async function ensureSecurityEventTable() {
  if (securityEventTableReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS security_event_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      event_type VARCHAR(80) NOT NULL,
      severity VARCHAR(20) NOT NULL DEFAULT 'info',
      title VARCHAR(255) NOT NULL,
      summary VARCHAR(1000) NULL,
      actor_user_id BIGINT UNSIGNED NULL,
      actor_username VARCHAR(120) NULL,
      actor_role VARCHAR(40) NULL,
      ip_address VARCHAR(64) NULL,
      network_segment VARCHAR(64) NULL,
      method VARCHAR(16) NULL,
      path VARCHAR(512) NULL,
      user_agent TEXT NULL,
      referer VARCHAR(1024) NULL,
      metadata JSON NULL,
      notified_at DATETIME NULL,
      PRIMARY KEY (id),
      INDEX idx_security_created_at (created_at),
      INDEX idx_security_event_type (event_type),
      INDEX idx_security_severity (severity),
      INDEX idx_security_ip (ip_address),
      INDEX idx_security_actor (actor_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  securityEventTableReady = true;
}

function requestContext(request) {
  if (!request) {
    return {
      ipAddress: null,
      networkSegment: null,
      method: null,
      path: null,
      userAgent: null,
      referer: null,
    };
  }

  const ipAddress = extractClientIp(request);
  return {
    ipAddress,
    networkSegment: toNetworkSegment(ipAddress),
    method: request.method || null,
    path: request.nextUrl?.pathname || null,
    userAgent: request.headers.get('user-agent') || null,
    referer: request.headers.get('referer') || null,
  };
}

function redactMetadata(value) {
  if (!value || typeof value !== 'object') return value || null;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (/password|token|secret|hash/i.test(key)) return [key, '[redacted]'];
      if (typeof item === 'string' && item.length > 500) return [key, `${item.slice(0, 500)}...`];
      return [key, item];
    }),
  );
}

function formatBangkokDate(date = new Date()) {
  return date.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

const SEVERITY_COPY = {
  info: { icon: 'ℹ️', label: 'ข้อมูล' },
  low: { icon: '🟡', label: 'เฝ้าระวัง' },
  medium: { icon: '🟠', label: 'ควรตรวจสอบ' },
  high: { icon: '🔴', label: 'เร่งด่วน' },
};

const EVENT_COPY = {
  registration_requested: 'คำขอลงทะเบียนใหม่',
  login_failed_anomaly: 'เข้าสู่ระบบผิดปกติ',
  rate_limit_exceeded: 'เรียกใช้งานถี่ผิดปกติ',
  data_write_anomaly: 'บันทึกข้อมูลถี่ผิดปกติ',
};

const REASON_COPY = {
  missing_credentials: 'กรอกข้อมูลเข้าสู่ระบบไม่ครบ',
  pending_registration: 'บัญชียังรออนุมัติ',
  unknown_username: 'ไม่พบชื่อผู้ใช้',
  invalid_password: 'รหัสผ่านไม่ถูกต้อง',
};

const SOURCE_COPY = {
  form: 'ฟอร์มปกติ',
  line: 'LINE Login',
};

const ACTION_COPY = {
  create: 'เพิ่มข้อมูล',
  update: 'แก้ไขข้อมูล',
  delete: 'ลบข้อมูล',
  update_status: 'เปลี่ยนสถานะ',
  update_permissions: 'แก้ไขสิทธิ์',
  approve_registration: 'อนุมัติลงทะเบียน',
  reject_registration: 'ปฏิเสธลงทะเบียน',
};

const ENTITY_COPY = {
  aed: 'จุดบริการ AED',
  aed_report: 'รายงาน AED',
  dental_unit: 'หน่วยทันตกรรม',
  health_station: 'Health Station',
  health_facility: 'หน่วยบริการ',
  user: 'ผู้ใช้งาน',
  registration_request: 'คำขอลงทะเบียน',
};

function compact(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function compactUserAgent(value) {
  if (!value) return null;
  return String(value)
    .replace(/\s+/g, ' ')
    .slice(0, 180);
}

function metadataRows(eventType, metadata = {}) {
  if (!metadata) return [];

  if (eventType === 'registration_requested') {
    return [
      ['เลขคำขอ', metadata.requestId],
      ['ช่องทาง', SOURCE_COPY[metadata.source] || metadata.source],
      ['ชื่อผู้ใช้', metadata.username],
      ['ชื่อ-นามสกุล', metadata.fullName],
      ['ตำแหน่ง', metadata.positionName],
      ['หน่วยบริการ', metadata.facilityName],
      ['อีเมล', metadata.email],
      ['โทรศัพท์', metadata.phone],
    ];
  }

  if (eventType === 'login_failed_anomaly') {
    return [
      ['ชื่อผู้ใช้ที่พยายามเข้า', metadata.username],
      ['สาเหตุล่าสุด', REASON_COPY[metadata.reason] || metadata.reason],
      ['จำนวนจาก IP นี้', `${compact(metadata.ipCount, '0')} ครั้ง`],
      ['จำนวนของ username นี้', `${compact(metadata.usernameCount, '0')} ครั้ง`],
      ['ช่วงเวลา', `${compact(metadata.windowMinutes, '0')} นาที`],
    ];
  }

  if (eventType === 'rate_limit_exceeded') {
    return [
      ['กลุ่ม endpoint', metadata.keyPrefix],
      ['เกณฑ์ที่ตั้งไว้', `${compact(metadata.limit, '0')} ครั้ง / ${compact(metadata.windowSeconds, '0')} วินาที`],
    ];
  }

  if (eventType === 'data_write_anomaly') {
    return [
      ['การกระทำล่าสุด', ACTION_COPY[metadata.action] || metadata.action],
      ['ชุดข้อมูล', ENTITY_COPY[metadata.entityType] || metadata.entityType],
      ['รหัสข้อมูล', metadata.entityId],
      ['จำนวนโดยผู้ใช้นี้', `${compact(metadata.actorCount, '0')} ครั้ง`],
      ['จำนวนจาก IP นี้', `${compact(metadata.ipCount, '0')} ครั้ง`],
      ['ช่วงเวลา', `${compact(metadata.windowMinutes, '0')} นาที`],
    ];
  }

  return Object.entries(metadata)
    .slice(0, 8)
    .map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : value]);
}

function recommendedAction(eventType) {
  if (eventType === 'registration_requested') return 'เปิดหน้าอนุมัติผู้ใช้งานเพื่อตรวจข้อมูลและกำหนดสิทธิ์';
  if (eventType === 'login_failed_anomaly') return 'ตรวจสอบ IP, username และประวัติการเข้าใช้งาน หากไม่ใช่เจ้าหน้าที่ให้พิจารณาบล็อกที่ firewall/proxy';
  if (eventType === 'rate_limit_exceeded') return 'ตรวจสอบว่าเป็น bot, script หรือผู้ใช้กดซ้ำผิดปกติ';
  if (eventType === 'data_write_anomaly') return 'ตรวจสอบ audit log และยืนยันว่าการแก้ไขจำนวนมากเป็นงานที่ตั้งใจทำ';
  return 'ตรวจสอบรายละเอียดในระบบ';
}

function formatTelegramMessage(event) {
  const severity = SEVERITY_COPY[event.severity] || SEVERITY_COPY.info;
  const eventName = EVENT_COPY[event.eventType] || event.eventType;
  const metadata = metadataRows(event.eventType, event.metadata);
  const lines = [
    `${severity.icon} ระบบข้อมูลสุขภาพ สตูล`,
    `${eventName}`,
    '',
    `ระดับ: ${severity.label}`,
    `หัวข้อ: ${event.title}`,
    event.summary ? `สรุป: ${event.summary}` : null,
    '',
    'ผู้เกี่ยวข้อง',
    event.actor?.username
      ? `• ผู้ใช้: ${event.actor.username} (${event.actor.role || '-'})`
      : '• ผู้ใช้: ไม่ได้เข้าสู่ระบบ',
    '',
    'ต้นทาง',
    `• IP: ${compact(event.ipAddress)}`,
    event.networkSegment ? `• Network: ${event.networkSegment}` : null,
    event.method || event.path ? `• Route: ${[event.method, event.path].filter(Boolean).join(' ')}` : null,
    event.userAgent ? `• อุปกรณ์/Browser: ${compactUserAgent(event.userAgent)}` : null,
    '',
    metadata.length > 0 ? 'รายละเอียด' : null,
    ...metadata.map(([label, value]) => `• ${label}: ${compact(value)}`),
    '',
    `ควรทำต่อ: ${recommendedAction(event.eventType)}`,
    `เวลา: ${formatBangkokDate()}`,
    event.eventId ? `Event ID: ${event.eventId}` : null,
  ];

  return lines.filter(Boolean).join('\n');
}

async function sendTelegramAlert(event) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SECURITY_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { skipped: true, reason: 'Telegram env not configured' };

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatTelegramMessage(event),
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body.slice(0, 200)}`);
  }

  return { sent: true };
}

export async function recordSecurityEvent({
  request = null,
  session = null,
  eventType,
  severity = 'info',
  title,
  summary = null,
  metadata = null,
  notify = false,
}) {
  try {
    await ensureSecurityEventTable();

    const context = requestContext(request);
    const safeMetadata = redactMetadata(metadata);

    const result = await query(
      `INSERT INTO security_event_logs (
        event_type,
        severity,
        title,
        summary,
        actor_user_id,
        actor_username,
        actor_role,
        ip_address,
        network_segment,
        method,
        path,
        user_agent,
        referer,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventType,
        severity,
        title,
        summary,
        session?.userId || null,
        session?.username || null,
        session?.role || null,
        context.ipAddress,
        context.networkSegment,
        context.method,
        context.path,
        context.userAgent,
        context.referer,
        safeMetadata ? JSON.stringify(safeMetadata) : null,
      ],
    );

    if (notify) {
      try {
        await sendTelegramAlert({
          eventId: result.insertId,
          eventType,
          severity,
          title,
          summary,
          actor: session,
          ipAddress: context.ipAddress,
          networkSegment: context.networkSegment,
          method: context.method,
          path: context.path,
          userAgent: context.userAgent,
          metadata: safeMetadata,
        });
        await query('UPDATE security_event_logs SET notified_at = NOW() WHERE id = ?', [result.insertId]);
      } catch (notifyError) {
        console.error('Security Telegram alert error:', notifyError);
      }
    }

    return { id: result.insertId };
  } catch (error) {
    console.error('Record security event error:', error);
    return { error };
  }
}

export async function recordRegistrationRequestEvent({ request, requestId, registration }) {
  return recordSecurityEvent({
    request,
    eventType: 'registration_requested',
    severity: 'info',
    title: 'มีคำขอลงทะเบียนใหม่',
    summary: `${registration.fullName} (${registration.username}) ส่งคำขอลงทะเบียนผ่าน ${registration.source}`,
    metadata: {
      requestId,
      source: registration.source,
      username: registration.username,
      fullName: registration.fullName,
      email: registration.email,
      phone: registration.phone,
      positionName: registration.positionName,
      facilityName: registration.facilityName,
      lineUserId: registration.lineUserId ? '[present]' : null,
    },
    notify: true,
  });
}

export async function recordLoginFailure({ request, username, reason }) {
  const ipAddress = extractClientIp(request);
  const safeUsername = String(username || '').trim().slice(0, 120) || null;

  await recordSecurityEvent({
    request,
    eventType: 'login_failed',
    severity: 'low',
    title: 'เข้าสู่ระบบไม่สำเร็จ',
    summary: safeUsername ? `พยายามเข้าสู่ระบบด้วย username ${safeUsername}` : 'พยายามเข้าสู่ระบบโดยข้อมูลไม่ครบ',
    metadata: {
      username: safeUsername,
      reason,
    },
    notify: false,
  });

  await ensureSecurityEventTable();

  const [ipSummary] = await query(
    `SELECT COUNT(*) AS count
     FROM security_event_logs
     WHERE event_type = 'login_failed'
       AND ip_address <=> ?
       AND created_at >= (NOW() - INTERVAL ? MINUTE)`,
    [ipAddress, LOGIN_WINDOW_MINUTES],
  );

  const [usernameSummary] = safeUsername
    ? await query(
      `SELECT COUNT(*) AS count
       FROM security_event_logs
       WHERE event_type = 'login_failed'
         AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.username')) = ?
         AND created_at >= (NOW() - INTERVAL ? MINUTE)`,
      [safeUsername, LOGIN_WINDOW_MINUTES],
    )
    : [{ count: 0 }];

  const ipCount = Number(ipSummary?.count || 0);
  const usernameCount = Number(usernameSummary?.count || 0);
  const ipAlert = ipCount >= LOGIN_IP_ALERT_THRESHOLD && ipCount % LOGIN_IP_ALERT_THRESHOLD === 0;
  const usernameAlert = usernameCount >= LOGIN_USERNAME_ALERT_THRESHOLD && usernameCount % LOGIN_USERNAME_ALERT_THRESHOLD === 0;

  if (ipAlert || usernameAlert) {
    await recordSecurityEvent({
      request,
      eventType: 'login_failed_anomaly',
      severity: ipCount >= LOGIN_IP_ALERT_THRESHOLD * 2 ? 'high' : 'medium',
      title: 'พบการพยายามเข้าสู่ระบบผิดปกติ',
      summary: `Login failed ${ipCount} ครั้งจาก IP นี้ และ ${usernameCount} ครั้งสำหรับ username นี้ ใน ${LOGIN_WINDOW_MINUTES} นาที`,
      metadata: {
        username: safeUsername,
        reason,
        ipCount,
        usernameCount,
        windowMinutes: LOGIN_WINDOW_MINUTES,
      },
      notify: true,
    });
  }
}

export async function recordRateLimitEvent({ request, keyPrefix, limit, windowMs, summary }) {
  await ensureSecurityEventTable();

  const ipAddress = extractClientIp(request);
  const [recentAlert] = await query(
    `SELECT id
     FROM security_event_logs
     WHERE event_type = 'rate_limit_exceeded'
       AND ip_address <=> ?
       AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.keyPrefix')) = ?
       AND notified_at IS NOT NULL
       AND created_at >= (NOW() - INTERVAL 5 MINUTE)
     ORDER BY id DESC
     LIMIT 1`,
    [ipAddress, keyPrefix],
  );

  return recordSecurityEvent({
    request,
    eventType: 'rate_limit_exceeded',
    severity: 'medium',
    title: 'พบการเรียกใช้งานถี่ผิดปกติ',
    summary,
    metadata: {
      keyPrefix,
      limit,
      windowSeconds: Math.round(windowMs / 1000),
    },
    notify: !recentAlert,
  });
}

export async function recordWriteActivity({
  request = null,
  session = null,
  action,
  entityType,
  entityId = null,
  summary = null,
  metadata = null,
}) {
  await recordSecurityEvent({
    request,
    session,
    eventType: 'data_write',
    severity: 'info',
    title: 'มีการแก้ไขข้อมูลในระบบ',
    summary,
    metadata: { action, entityType, entityId, ...redactMetadata(metadata) },
    notify: false,
  });

  await ensureSecurityEventTable();
  const ipAddress = request ? extractClientIp(request) : null;

  const [actorSummary] = await query(
    `SELECT COUNT(*) AS count
     FROM security_event_logs
     WHERE event_type = 'data_write'
       AND actor_user_id <=> ?
       AND created_at >= (NOW() - INTERVAL ? MINUTE)`,
    [session?.userId || null, WRITE_WINDOW_MINUTES],
  );

  const [ipSummary] = await query(
    `SELECT COUNT(*) AS count
     FROM security_event_logs
     WHERE event_type = 'data_write'
       AND ip_address <=> ?
       AND created_at >= (NOW() - INTERVAL ? MINUTE)`,
    [ipAddress, WRITE_WINDOW_MINUTES],
  );

  const actorCount = Number(actorSummary?.count || 0);
  const ipCount = Number(ipSummary?.count || 0);
  const actorAlert = actorCount >= WRITE_ACTOR_ALERT_THRESHOLD && actorCount % WRITE_ACTOR_ALERT_THRESHOLD === 0;
  const ipAlert = ipCount >= WRITE_IP_ALERT_THRESHOLD && ipCount % WRITE_IP_ALERT_THRESHOLD === 0;

  if (actorAlert || ipAlert) {
    await recordSecurityEvent({
      request,
      session,
      eventType: 'data_write_anomaly',
      severity: actorCount >= WRITE_ACTOR_ALERT_THRESHOLD * 2 || ipCount >= WRITE_IP_ALERT_THRESHOLD * 2 ? 'high' : 'medium',
      title: 'พบการบันทึกข้อมูลถี่ผิดปกติ',
      summary: `มีการเขียนข้อมูล ${actorCount} ครั้งโดยผู้ใช้นี้ และ ${ipCount} ครั้งจาก IP นี้ ใน ${WRITE_WINDOW_MINUTES} นาที`,
      metadata: {
        action,
        entityType,
        entityId,
        actorCount,
        ipCount,
        windowMinutes: WRITE_WINDOW_MINUTES,
      },
      notify: true,
    });
  }
}
