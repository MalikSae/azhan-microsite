import { headers } from 'next/headers';
import { scheduleBelongsToBrand } from './packagePolicy.mjs';

export async function getScheduleForCurrentBrand(id) {
  const numericId = String(id || '').split('-')[0];
  if (!/^[1-9]\d*$/.test(numericId)) return null;
  const requestHeaders = await headers();
  const brandId = requestHeaders.get('x-brand-id');
  if (!brandId || !/^[1-9]\d*$/.test(brandId)) return null;
  const base = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const res = await fetch(`${base}/api/schedules/${numericId}?brand=${brandId}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Gagal memuat paket. Silakan coba lagi.');
  const schedule = await res.json();
  return scheduleBelongsToBrand(schedule, brandId) ? schedule : null;
}
