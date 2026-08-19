export async function getPublicSchedules(brandId) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const url = brandId ? `${baseUrl}/api/schedules?brand=${brandId}` : `${baseUrl}/api/schedules`;
  
  const res = await fetch(url, { cache: 'no-store' });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Gagal mengambil data paket (${res.status}): ${errorText || res.statusText}`);
  }
  
  return res.json();
}
