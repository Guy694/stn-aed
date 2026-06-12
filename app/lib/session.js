import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

const COOKIE_NAME = 'stn_service_session';
export const SESSION_IDLE_TIMEOUT_SECONDS = 15 * 60;
export const SESSION_IDLE_TIMEOUT_MS = SESSION_IDLE_TIMEOUT_SECONDS * 1000;

function sessionPayload(user) {
  return {
    userId: user.userId ?? user.id,
    username: user.username,
    fullName: user.fullName ?? user.full_name,
    role: user.role,
    lastActivityAt: Date.now(),
  };
}

async function writeSession(user) {
  const expiresAt = new Date(Date.now() + SESSION_IDLE_TIMEOUT_MS);
  const session = await encrypt(sessionPayload(user));
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    maxAge: SESSION_IDLE_TIMEOUT_SECONDS,
    sameSite: 'lax',
    path: '/',
  });
}

export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_IDLE_TIMEOUT_SECONDS}s`)
    .sign(encodedKey);
}

export async function decrypt(session = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user) {
  await writeSession(user);
}

export async function refreshSession(session) {
  await writeSession(session);
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!session) return null;
  const payload = await decrypt(session);
  if (!payload) return null;

  const lastActivityAt = Number(payload.lastActivityAt ?? Number(payload.iat) * 1000);
  if (!Number.isFinite(lastActivityAt) || Date.now() - lastActivityAt >= SESSION_IDLE_TIMEOUT_MS) {
    return null;
  }

  return payload;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
