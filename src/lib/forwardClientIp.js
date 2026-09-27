// Route handler di src/app/api/public/* meneruskan request ke erp-azhan dari
// server Next.js. Tanpa header ini, API melihat semua pengunjung sebagai satu
// IP (IP server microsite), sehingga rate limit per IP berlaku bersama untuk
// semua orang. API hanya membaca header ini bila IP server microsite terdaftar
// di TRUSTED_PROXIES milik erp-azhan.
const CLIENT_IP_HEADERS = ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip'];

export function clientIpHeaders(request) {
  const headers = {};
  for (const name of CLIENT_IP_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}
