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

export async function getPublicBankAccounts(brandId) {
  const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const url = brandId ? `${baseUrl}/api/public/bank-accounts?brand_id=${brandId}` : `${baseUrl}/api/public/bank-accounts`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch bank accounts:', err);
    return [];
  }
}
