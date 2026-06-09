import 'dotenv/config';

const baseUrl = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const configuredBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/^\/+|\/+$/g, '');
const baseUrlPath = new URL(baseUrl).pathname.replace(/^\/+|\/+$/g, '');
const requestBasePath = configuredBasePath && baseUrlPath !== configuredBasePath
  ? `/${configuredBasePath}`
  : '';
const adminUsername = process.env.SMOKE_ADMIN_USERNAME;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD;

const checks = [];

function record(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark} ${name}${detail ? ` - ${detail}` : ''}`);
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${requestBasePath}${path}`, {
    redirect: 'manual',
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
}

async function expectJsonArray(path) {
  const res = await request(path);
  const ok = res.ok;
  let detail = `status ${res.status}`;
  if (ok) {
    const data = await res.json();
    detail += Array.isArray(data) ? `, ${data.length} rows` : ', non-array response';
    record(`GET ${path}`, Array.isArray(data), detail);
    return;
  }
  record(`GET ${path}`, false, detail);
}

async function expectUnauthorized(path, options) {
  const res = await request(path, options);
  record(`Unauthorized ${path}`, res.status === 401, `status ${res.status}`);
}

async function loginAndCheckDashboard() {
  if (!adminUsername || !adminPassword) {
    record('Admin login checks', true, 'skipped; set SMOKE_ADMIN_USERNAME and SMOKE_ADMIN_PASSWORD');
    return;
  }

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: adminUsername, password: adminPassword }),
  });

  const cookie = login.headers.get('set-cookie');
  record('POST /api/auth/login', login.ok && Boolean(cookie), `status ${login.status}`);
  if (!login.ok || !cookie) return;

  const headers = { Cookie: cookie };
  const activity = await request('/api/auth/activity', { method: 'POST', headers });
  record(
    'POST /api/auth/activity',
    activity.ok && Boolean(activity.headers.get('set-cookie')),
    `status ${activity.status}, refreshes cookie`,
  );

  const me = await request('/api/auth/me', { headers });
  record('GET /api/auth/me', me.ok, `status ${me.status}`);

  const dashboard = await request('/api/dashboard', { headers });
  if (dashboard.ok) {
    const data = await dashboard.json();
    record('GET /api/dashboard', Boolean(data.totalStats), 'has totalStats');
  } else {
    record('GET /api/dashboard', false, `status ${dashboard.status}`);
  }
}

async function main() {
  await expectJsonArray('/api/aed');
  await expectJsonArray('/api/facilities');
  await expectJsonArray('/api/dental');
  await expectJsonArray('/api/health-stations');
  await expectUnauthorized('/api/auth/me');
  await expectUnauthorized('/api/auth/activity', { method: 'POST' });
  await expectUnauthorized('/api/dashboard');
  await loginAndCheckDashboard();

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    console.error(`Smoke test failed: ${failed.length}/${checks.length} checks failed`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
