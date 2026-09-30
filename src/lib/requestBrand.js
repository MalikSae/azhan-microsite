// Resolve again from the request hostname; never trust a client-supplied brand header/body.
export async function bindRequestBrand(request, body) {
  const host = (request.headers.get('host') || request.headers.get('x-forwarded-host') || '').split(':')[0].trim();
  const base = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const res = await fetch(`${base}/api/public/brand?domain=${encodeURIComponent(host)}`, { cache: 'no-store' });
  if (!res.ok) throw Object.assign(new Error('Brand tidak tersedia.'), { status: res.status === 404 ? 404 : 503 });
  const brand = await res.json();
  if (!Number.isSafeInteger(Number(brand.id)) || Number(brand.id) <= 0) throw Object.assign(new Error('Brand tidak valid.'), { status: 503 });
  if (body.brand_id != null && Number(body.brand_id) !== Number(brand.id)) {
    throw Object.assign(new Error('Paket atau akun tidak sesuai dengan brand situs ini.'), { status: 400 });
  }
  body.brand_id = Number(brand.id);
  return body;
}
