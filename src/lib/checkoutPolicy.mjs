export const TERMS_VERSION = 'booking-2026-09-28';
export function paymentTerms(schedule, regularCount, total, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const days = Math.round((Date.parse(`${schedule.berangkat_tanggal}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  const fullPayment = days <= 45;
  return { fullPayment, minimum: fullPayment ? total : Math.min(total, regularCount * (schedule.effective_minimal_dp ?? 0)) };
}
export function validPhone(value) { return /^\+?[0-9 () .-]+$/.test(value) && value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 15; }
export function validInfant(dob, departure, today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || dob > today) return false;
  const born = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(born.getTime()) || born.toISOString().slice(0, 10) !== dob) return false;
  born.setUTCFullYear(born.getUTCFullYear() + 2);
  return Date.parse(`${departure}T00:00:00Z`) < born.getTime();
}
