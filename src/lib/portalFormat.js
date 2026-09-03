export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatTanggalIndo(dateString) {
  if (!dateString) return '-';
  try {
    const cleanStr = String(dateString).trim();
    const normalizedStr = /^\d{4}-\d{2}-\d{2}$/.test(cleanStr)
      ? `${cleanStr}T00:00:00`
      : cleanStr;
    const date = new Date(normalizedStr);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString || '-';
  }
}
