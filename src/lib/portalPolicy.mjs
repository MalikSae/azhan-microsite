export function localTransferDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function chooseBooking(bookings, id) {
  if (id) return bookings.find(b => String(b.id) === String(id)) || null;
  return bookings.find(b => b.status === 'baru' || b.status === 'dp') || bookings[0] || null;
}

export const documentItems = [
  { jenis: 'ktp', label: 'KTP', required: true },
  { jenis: 'paspor', label: 'Paspor', required: true },
  { jenis: 'kk', label: 'Kartu Keluarga', required: true },
  { jenis: 'pas_foto', label: 'Pas Foto', required: true },
  { jenis: 'vaksin_meningitis', label: 'Dokumen Vaksin Meningitis', required: true },
  { jenis: 'buku_nikah', label: 'Buku Nikah', required: false },
  { jenis: 'akte_lahir', label: 'Akta Kelahiran', required: false },
];

export function requirements(jamaah, booking) {
  const dob = jamaah?.tanggal_lahir;
  const departure = booking?.berangkat_tanggal || localTransferDate();
  const child = dob && /^\d{4}-\d{2}-\d{2}$/.test(dob) &&
    (Number(departure.slice(0,4)) - Number(dob.slice(0,4)) - (departure.slice(5,10) < dob.slice(5,10) ? 1 : 0)) < 17;
  return documentItems.map(item => ({ ...item, required: item.jenis === 'ktp' ? !child : item.jenis === 'akte_lahir' ? !!child : item.required }));
}

export function documentProgress(docs, items) {
  const required = items.filter(item => item.required);
  return { total: required.length, approved: required.filter(item => docs.some(doc => doc.jenis === item.jenis && doc.status === 'approved')).length };
}

export function paymentFileError(file) {
  if (!file) return 'Pilih bukti transfer';
  if (file.size > 5 * 1024 * 1024) return 'Ukuran file maksimal 5MB';
  if (!['image/jpeg','image/png','image/webp','image/gif','application/pdf'].includes(file.type)) return 'Gunakan JPG, PNG, WEBP, GIF, atau PDF';
  return null;
}
