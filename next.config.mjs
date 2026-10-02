/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.azhan.test', 'alsha.azhan.test', 'zahara.azhan.test', 'athia.azhan.test', 'hana.azhan.test', 'nava.azhan.test'],
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
    // Panggilan API dari browser lewat origin brand sendiri (lihat src/lib/apiBase.js).
    // Rewrites ini berjalan setelah route handler, jadi src/app/api/public/* tetap
    // diproses Next lebih dulu (meneruskan IP klien, cookie referral, dll).
    return [
      { source: '/uploads/:path*', destination: `${apiBase}/uploads/:path*` },
      { source: '/api/portal/:path*', destination: `${apiBase}/api/portal/:path*` },
      { source: '/api/public/:path*', destination: `${apiBase}/api/public/:path*` },
      { source: '/api/schedules', destination: `${apiBase}/api/schedules` },
      { source: '/api/schedules/:path*', destination: `${apiBase}/api/schedules/:path*` },
      { source: '/api/itineraries/:path*', destination: `${apiBase}/api/itineraries/:path*` },
    ];
  },
};

export default nextConfig;
