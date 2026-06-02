import 'server-only';

import { NextResponse } from 'next/server';

import { extractClientIp } from '@/app/lib/visit-logs';

const buckets = new Map();

function cleanup(now) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(request, { keyPrefix, limit, windowMs }) {
  const now = Date.now();
  cleanup(now);

  const ip = extractClientIp(request) || 'unknown';
  const key = `${keyPrefix}:${ip}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { limited: true, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { limited: false, remaining: Math.max(limit - bucket.count, 0), resetAt: bucket.resetAt };
}

export function rateLimitResponse(result) {
  const retryAfterSeconds = Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1);
  return NextResponse.json(
    { error: 'Too many requests', retryAfter: retryAfterSeconds },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    },
  );
}
