import { NextResponse } from 'next/server';

export async function middleware(request) {
  // 1. Get hostname without port from Host / X-Forwarded-Host header
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.hostname || '';
  const hostname = rawHost.split(':')[0].trim();

  const apiBaseUrl = process.env.API_BASE_URL_INTERNAL || 'http://localhost:9090';

  try {
    // 2. Fetch brand by domain
    console.log('[Middleware] Fetching brand for hostname:', hostname);
    const res = await fetch(`${apiBaseUrl}/api/public/brand?domain=${encodeURIComponent(hostname)}`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    console.log('[Middleware] Brand fetch status:', res.status, 'for hostname:', hostname);

    if (res.status === 404) {
      // 3. Brand not found -> rewrite to /brand-not-found
      return NextResponse.rewrite(new URL('/brand-not-found', request.url));
    }

    if (!res.ok) {
      // 4. Other non-200 response -> treat as brand not found
      return NextResponse.rewrite(new URL('/brand-not-found', request.url));
    }

    // 5. Success 200: set request headers
    const brand = await res.json();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-brand-id', String(brand.id));
    requestHeaders.set('x-brand-name', brand.name || '');
    requestHeaders.set('x-brand-whatsapp', brand.whatsapp_number || '');
    requestHeaders.set('x-brand-logo', brand.logo_url || '');
    requestHeaders.set('x-brand-icon', brand.icon_url || '');
    requestHeaders.set('x-brand-color', brand.primary_color || '#B87A3A');

    // Extended SEO & Local NAP headers
    requestHeaders.set('x-brand-address', brand.address || brand.alamat || '');
    requestHeaders.set('x-brand-city', brand.city || brand.kota || '');
    requestHeaders.set('x-brand-province', brand.province || brand.provinsi || '');
    requestHeaders.set('x-brand-email', brand.email || '');
    requestHeaders.set('x-brand-phone', brand.phone || brand.telp_kantor || '');
    requestHeaders.set('x-brand-gmaps', brand.gmaps_url || '');
    requestHeaders.set('x-brand-legal', brand.legal_info || brand.keterangan_legalitas || '');
    requestHeaders.set('x-brand-meta-title', brand.meta_title || '');
    requestHeaders.set('x-brand-meta-desc', brand.meta_description || '');
    requestHeaders.set('x-brand-og-image', brand.og_image_url || '');
    requestHeaders.set('x-brand-gsc-code', brand.google_verification_code || '');
    if (brand.social_media) {
      requestHeaders.set('x-brand-socials', JSON.stringify(brand.social_media));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // 4. Network error / unexpected error -> rewrite to /brand-not-found
    console.error('Middleware fetch brand error:', error);
    return NextResponse.rewrite(new URL('/brand-not-found', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.svg, .png, .jpeg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
