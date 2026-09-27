// Kode referral agen Syiar dari link ?ref=KODE (agen-azhan.md 3.3).
export const REFERRAL_COOKIE = 'azhan_ref';
export const REFERRAL_MAX_AGE = 60 * 60 * 24 * 90; // 90 hari

export function normalizeKodeReferral(raw) {
  const kode = String(raw || '').trim().toUpperCase();
  return /^[A-Z0-9]{3,20}$/.test(kode) ? kode : '';
}

// Dipakai route handler: kode diambil dari cookie httpOnly, bukan dari body
// yang dikirim browser.
export function kodeReferralFromRequest(request) {
  return normalizeKodeReferral(request.cookies.get(REFERRAL_COOKIE)?.value);
}
