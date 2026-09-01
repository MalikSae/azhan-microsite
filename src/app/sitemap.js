import { headers } from 'next/headers';
import { getPublicSchedules } from '@/lib/api';

export default async function sitemap() {
  const headersList = await headers();
  const rawHost = headersList.get('x-forwarded-host') || headersList.get('host') || 'azhan.test';
  const host = rawHost.split(':')[0].trim();
  const proto = headersList.get('x-forwarded-proto') || 'https';
  const brandId = headersList.get('x-brand-id') || '1';

  let schedules = [];
  try {
    schedules = await getPublicSchedules(brandId);
  } catch (error) {
    console.error('[Sitemap] Gagal mengambil paket untuk sitemap:', error);
  }

  const packageUrls = schedules.map((schedule) => {
    const slug = `${schedule.id}-${(schedule.jadwal_nama || 'paket').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return {
      url: `${proto}://${host}/paket/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    };
  });

  return [
    {
      url: `${proto}://${host}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${proto}://${host}/paket`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${proto}://${host}/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...packageUrls,
  ];
}
