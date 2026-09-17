/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.azhan.test', 'alsha.azhan.test', 'zahara.azhan.test', 'athia.azhan.test', 'hana.azhan.test', 'nava.azhan.test'],
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiBase}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
