import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

function getHost(headerList) {
  const rawHost = headerList.get('x-forwarded-host') || headerList.get('host') || 'azhan.test';
  return rawHost.split(':')[0].trim();
}

function getColor(value, fallback) {
  return /^#[0-9a-f]{3,8}$/i.test(value || '') ? value : fallback;
}

/**
 * Manifest dibuat per request supaya setiap domain brand mendapatkan identitas
 * aplikasi, warna, dan ikon yang sesuai. Browser menyimpan instalasi PWA per
 * origin, sehingga alsha.azhan.id dan hana.azhan.id menjadi aplikasi terpisah.
 */
export default async function manifest() {
  const headerList = await headers();
  const host = getHost(headerList);
  const brandId = headerList.get('x-brand-id') || 'default';
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandColor = getColor(headerList.get('x-brand-color'), '#0f766e');
  const icon = `/brand-icon?brand=${encodeURIComponent(brandId)}`;

  return {
    id: `https://${host}/`,
    name: `${brandName} - Travel Umroh`,
    short_name: brandName.slice(0, 20),
    description: `Paket umroh dan layanan jamaah ${brandName}`,
    lang: 'id-ID',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: brandColor,
    background_color: '#f8fafc',
    categories: ['travel', 'lifestyle'],
    prefer_related_applications: false,
    icons: [
      {
        src: icon,
        sizes: '192x192',
        type: 'image/webp',
        purpose: 'any maskable',
      },
      {
        src: icon,
        sizes: '512x512',
        type: 'image/webp',
        purpose: 'any maskable',
      },
    ],
  };
}
