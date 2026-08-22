import { NextResponse } from 'next/server';

function getHostname(request) {
  const rawHost = request.headers.get('x-forwarded-host')
    || request.headers.get('host')
    || request.nextUrl.hostname
    || '';

  return rawHost.split(':')[0].trim();
}

function resolveIconUrl(iconUrl, publicApiBaseUrl, requestUrl) {
  if (!iconUrl) return new URL('/globe.svg', requestUrl);

  try {
    if (/^https?:\/\//i.test(iconUrl)) return new URL(iconUrl);
    if (iconUrl.startsWith('/') && publicApiBaseUrl) {
      return new URL(iconUrl, `${publicApiBaseUrl.replace(/\/$/, '')}/`);
    }
  } catch {
    // Gunakan ikon fallback jika URL logo brand tidak valid.
  }

  return new URL('/globe.svg', requestUrl);
}

export async function GET(request) {
  const hostname = getHostname(request);
  const internalApiBaseUrl = process.env.API_BASE_URL_INTERNAL || 'http://localhost:9090';
  const publicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || internalApiBaseUrl;

  try {
    const response = await fetch(
      `${internalApiBaseUrl}/api/public/brand?domain=${encodeURIComponent(hostname)}`,
      { cache: 'no-store' },
    );

    if (response.ok) {
      const brand = await response.json();
      const redirect = NextResponse.redirect(
        resolveIconUrl(brand.icon_url, publicApiBaseUrl, request.url),
        307,
      );
      redirect.headers.set('Cache-Control', 'no-store, max-age=0');
      return redirect;
    }
  } catch {
    // Fallback tetap memastikan request favicon menghasilkan gambar.
  }

  const fallback = NextResponse.redirect(new URL('/globe.svg', request.url), 307);
  fallback.headers.set('Cache-Control', 'no-store, max-age=0');
  return fallback;
}
