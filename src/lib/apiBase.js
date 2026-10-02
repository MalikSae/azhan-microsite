// Basis URL API untuk fetch. Di browser selalu same-origin (''), diteruskan ke
// API lewat rewrites di next.config.mjs: panggilan langsung ke host API (mis.
// localhost:9090) dari domain brand diblokir browser dan butuh CORS per domain.
// Di server (SSR/route handler) memanggil API langsung.
export function apiBase() {
  if (typeof window !== 'undefined') return '';
  return process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
}
