import { query } from '@/app/lib/db';

let tableReady = false;

export async function ensureVisitLogsTable() {
  if (tableReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS website_visit_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      visited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      user_id BIGINT UNSIGNED NULL,
      username VARCHAR(120) NULL,
      role VARCHAR(40) NULL,
      method VARCHAR(16) NOT NULL DEFAULT 'GET',
      path VARCHAR(512) NOT NULL,
      query_string TEXT NULL,
      ip_address VARCHAR(64) NULL,
      network_segment VARCHAR(64) NULL,
      user_agent TEXT NULL,
      referer VARCHAR(1024) NULL,
      accept_language VARCHAR(255) NULL,
      PRIMARY KEY (id),
      INDEX idx_visit_time (visited_at),
      INDEX idx_visit_ip (ip_address),
      INDEX idx_visit_path (path),
      INDEX idx_visit_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  tableReady = true;
}

function firstHeaderValue(value) {
  if (!value) return null;
  const first = value.split(',')[0]?.trim();
  return first || null;
}

export function extractClientIp(request) {
  const xForwardedFor = firstHeaderValue(request.headers.get('x-forwarded-for'));
  const xRealIp = firstHeaderValue(request.headers.get('x-real-ip'));
  const cfConnectingIp = firstHeaderValue(request.headers.get('cf-connecting-ip'));

  const rawIp = xForwardedFor || xRealIp || cfConnectingIp || null;
  if (!rawIp) return null;

  if (rawIp.startsWith('::ffff:')) {
    return rawIp.replace('::ffff:', '');
  }

  return rawIp;
}

export function toNetworkSegment(ipAddress) {
  if (!ipAddress) return null;

  if (ipAddress.includes(':')) {
    const parts = ipAddress.split(':').filter(Boolean);
    return parts.length >= 4 ? `${parts.slice(0, 4).join(':')}::/64` : `${ipAddress}/128`;
  }

  const octets = ipAddress.split('.');
  if (octets.length === 4) {
    return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
  }

  return ipAddress;
}

export async function insertVisitLog({ request, path, method = 'GET', session = null }) {
  await ensureVisitLogsTable();

  const ipAddress = extractClientIp(request);
  const networkSegment = toNetworkSegment(ipAddress);
  const userAgent = request.headers.get('user-agent') || null;
  const referer = request.headers.get('referer') || null;
  const acceptLanguage = request.headers.get('accept-language') || null;
  const queryString = request.nextUrl.search || null;

  const recentDuplicate = await query(
    `SELECT id
     FROM website_visit_logs
     WHERE ip_address <=> ?
       AND method = ?
       AND path = ?
       AND visited_at >= (NOW() - INTERVAL 15 SECOND)
     ORDER BY id DESC
     LIMIT 1`,
    [ipAddress, method, path]
  );

  if (recentDuplicate.length > 0) {
    return { inserted: false, deduplicated: true };
  }

  await query(
    `INSERT INTO website_visit_logs (
      user_id,
      username,
      role,
      method,
      path,
      query_string,
      ip_address,
      network_segment,
      user_agent,
      referer,
      accept_language
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session?.userId || null,
      session?.username || null,
      session?.role || null,
      method,
      path,
      queryString,
      ipAddress,
      networkSegment,
      userAgent,
      referer,
      acceptLanguage,
    ]
  );

  return { inserted: true, deduplicated: false };
}

export async function getVisitStats() {
  await ensureVisitLogsTable();

  const [summary] = await query(
    `SELECT
      COUNT(*) AS total_visits,
      COUNT(DISTINCT ip_address) AS total_unique_ips,
      SUM(CASE WHEN DATE(visited_at) = CURRENT_DATE THEN 1 ELSE 0 END) AS today_visits,
      COUNT(DISTINCT CASE WHEN DATE(visited_at) = CURRENT_DATE THEN ip_address END) AS today_unique_ips,
      SUM(CASE WHEN visited_at >= (NOW() - INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS visits_24h,
      COUNT(DISTINCT CASE WHEN visited_at >= (NOW() - INTERVAL 5 MINUTE) THEN ip_address END) AS active_ips_5m
    FROM website_visit_logs`
  );

  return {
    totalVisits: Number(summary?.total_visits || 0),
    totalUniqueIps: Number(summary?.total_unique_ips || 0),
    todayVisits: Number(summary?.today_visits || 0),
    todayUniqueIps: Number(summary?.today_unique_ips || 0),
    visits24h: Number(summary?.visits_24h || 0),
    activeIps5m: Number(summary?.active_ips_5m || 0),
  };
}

export async function getRecentVisitLogs(limit = 100) {
  await ensureVisitLogsTable();

  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);

  return query(
    `SELECT
      id,
      visited_at,
      user_id,
      username,
      role,
      method,
      path,
      ip_address,
      network_segment,
      referer,
      user_agent,
      accept_language
    FROM website_visit_logs
    ORDER BY visited_at DESC
    LIMIT ?`,
    [safeLimit]
  );
}
