import { NextResponse } from 'next/server';

export async function middleware(request) {
  // 1. Get hostname without port
  const hostname = request.nextUrl.hostname || (request.headers.get('host') || '').split(':')[0];

  const apiBaseUrl = process.env.API_BASE_URL_INTERNAL || 'http://localhost:9090';

  try {
    // 2. Fetch brand by domain
    const res = await fetch(`${apiBaseUrl}/api/public/brand?domain=${encodeURIComponent(hostname)}`, {
      headers: {
        'Accept': 'application/json',
      },
      // Short cache or no-store in middleware
      cache: 'no-store'
    });

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
    requestHeaders.set('x-brand-color', brand.primary_color || '#B87A3A');

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
