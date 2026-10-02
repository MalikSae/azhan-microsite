// URL file upload dari API (path "/uploads/...") dimuat lewat domain brand
// sendiri — rewrite "/uploads/*" di next.config.mjs meneruskannya ke API —
// bukan langsung ke host API (mis. http://localhost:9090), yang tidak bisa
// dijangkau dari perangkat lain dan diblokir browser sebagai origin berbeda.
//
// origin opsional: isi (mis. "https://hana.azhan.test") bila butuh URL absolut,
// seperti JSON-LD dan metadata Open Graph.
export function mediaUrl(path, origin = '') {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const relative = path.startsWith('/') ? path : `/${path}`;
  return origin ? `${origin.replace(/\/$/, '')}${relative}` : relative;
}
