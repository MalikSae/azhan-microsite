import { NextResponse } from 'next/server';
import { mediaUrl } from '@/lib/mediaUrl';

function getHostname(request) {
  const rawHost = request.headers.get('x-forwarded-host')
    || request.headers.get('host')
    || request.nextUrl.hostname
    || '';

  return rawHost.split(':')[0].trim();
}

// Origin domain brand yang diakses pengunjung (di balik nginx, request.url
// berisi host internal Next.js, mis. localhost:3000).
function getPublicOrigin(request) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!host) return new URL(request.url).origin;
  const proto = (request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '')).split(',')[0].trim();
  return `${proto}://${host}`;
}

function resolveIconUrl(iconUrl, origin) {
  if (!iconUrl) return new URL('/globe.svg', origin);

  try {
    // mediaUrl: "/uploads/..." dilayani lewat domain brand (rewrite next.config.mjs).
    return new URL(mediaUrl(iconUrl, origin));
  } catch {
    // Gunakan ikon fallback jika URL logo brand tidak valid.
  }

  return new URL('/globe.svg', origin);
}

export async function GET(request) {
  const hostname = getHostname(request);
  const origin = getPublicOrigin(request);
  const internalApiBaseUrl = process.env.API_BASE_URL_INTERNAL || 'http://localhost:9090';

  try {
    const response = await fetch(
      `${internalApiBaseUrl}/api/public/brand?domain=${encodeURIComponent(hostname)}`,
      { cache: 'no-store' },
    );

    if (response.ok) {
      const brand = await response.json();
      const redirect = NextResponse.redirect(
        resolveIconUrl(brand.icon_url, origin),
        307,
      );
      redirect.headers.set('Cache-Control', 'no-store, max-age=0');
      return redirect;
    }
  } catch {
    // Fallback tetap memastikan request favicon menghasilkan gambar.
  }

  const fallback = NextResponse.redirect(new URL('/globe.svg', origin), 307);
  fallback.headers.set('Cache-Control', 'no-store, max-age=0');
  return fallback;
}
