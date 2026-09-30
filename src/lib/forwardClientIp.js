// Route handler di src/app/api/public/* dan server component yang memanggil
// erp-azhan dari server Next.js. Tanpa header ini, API melihat semua pengunjung
// sebagai satu IP (IP server microsite), sehingga rate limit per IP berlaku
// bersama untuk semua orang. API hanya membaca header ini bila IP server
// microsite terdaftar di TRUSTED_PROXIES milik erp-azhan.
const CLIENT_IP_HEADERS = ['x-forwarded-for', 'x-real-ip'];

// source: Request (route handler) atau Headers dari `await headers()`
// (server component).
export function clientIpHeaders(source) {
  const incoming = typeof source?.get === 'function' ? source : source?.headers;
  const forwarded = {};
  for (const name of CLIENT_IP_HEADERS) {
    const value = incoming?.get(name);
    if (value) forwarded[name] = value;
  }
  return forwarded;
}
