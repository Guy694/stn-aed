const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/stn-aed';

const APP_ROUTE_MARKERS = [
  '/map',
  '/admin',
  '/staff',
  '/dashboard',
  '/my-reports',
  '/login',
  '/register',
];

function normalizePath(path) {
  if (!path) return '/';
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeBasePrefix(prefix) {
  if (!prefix) return '';

  if (/^https?:\/\//i.test(prefix)) {
    try {
      return new URL(prefix).pathname || '';
    } catch {
      return '';
    }
  }

  const withLeadingSlash = prefix.startsWith('/') ? prefix : `/${prefix}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

function joinBasePath(base, normalizedPath) {
  if (!base) return normalizedPath;
  if (normalizedPath === base || normalizedPath.startsWith(`${base}/`)) return normalizedPath;
  return `${base}${normalizedPath}`;
}

function runtimeBasePath() {
  if (typeof window === 'undefined') return '';

  const markerIndex = APP_ROUTE_MARKERS
    .map((route) => window.location.pathname.indexOf(route))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  return markerIndex > 0 ? window.location.pathname.slice(0, markerIndex) : '';
}

function assetBasePath() {
  if (typeof document === 'undefined') return '';

  const assets = document.querySelectorAll('script[src*="/_next/"], link[href*="/_next/"], link[href*="/favicon"]');

  for (const asset of assets) {
    const rawAssetUrl = asset.getAttribute('src') || asset.getAttribute('href') || '';
    if (!rawAssetUrl) continue;

    const parsed = (() => {
      try {
        return new URL(rawAssetUrl, window.location.origin);
      } catch {
        return null;
      }
    })();

    if (!parsed) continue;

    // Keep only pathname to force same-origin API calls and avoid host mismatch
    // issues that surface as browser "Failed to fetch" errors.
    const assetPath = parsed.pathname || '';

    const nextIndex = assetPath.indexOf('/_next/');
    if (nextIndex > 0) return assetPath.slice(0, nextIndex);

    const faviconIndex = assetPath.indexOf('/favicon');
    if (faviconIndex > 0) return assetPath.slice(0, faviconIndex);
  }

  return '';
}

export function pathCandidates(path) {
  const normalizedPath = normalizePath(path);
  if (/^https?:\/\//i.test(normalizedPath)) return [normalizedPath];

  const runtimeBase = normalizeBasePrefix(runtimeBasePath());
  const assetBase = normalizeBasePrefix(assetBasePath());
  const publicBase = normalizeBasePrefix(PUBLIC_BASE_PATH);

  const preferred = [runtimeBase, assetBase, publicBase]
    .filter(Boolean)
    .map((base) => joinBasePath(base, normalizedPath));

  // Always keep the raw path as the last fallback so routes can still resolve
  // when basePath inference is wrong in some environments.
  return [...new Set([...preferred, normalizedPath])];
}

export function apiUrl(path) {
  return pathCandidates(path)[0];
}

export function publicPath(path) {
  const normalizedPath = normalizePath(path);
  const runtimeBase = normalizeBasePrefix(runtimeBasePath());
  const publicBase = normalizeBasePrefix(PUBLIC_BASE_PATH);
  return joinBasePath(runtimeBase || publicBase, normalizedPath);
}

function networkErrorResponse(path, attemptedUrls, error) {
  const payload = {
    error: 'Failed to fetch',
    path,
    attemptedUrls,
    detail: error?.message || String(error || 'Unknown network error'),
  };

  return new Response(JSON.stringify(payload), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function apiFetch(path, init) {
  const urls = pathCandidates(path);
  let lastError = null;
  const attempted = [];

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    attempted.push(url);
    try {
      const response = await fetch(url, init);
      const contentType = response.headers.get('content-type') || '';
      if (response.status === 404 && index < urls.length - 1) continue;
      if (!contentType.includes('application/json') && response.status >= 400 && index < urls.length - 1) continue;
      return response;
    } catch (error) {
      lastError = error;
      if (index === urls.length - 1) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.warn('apiFetch failed after trying URLs:', attempted, error);
        }
        return networkErrorResponse(path, attempted, error);
      }
    }
  }

  return networkErrorResponse(path, attempted, lastError);
}
