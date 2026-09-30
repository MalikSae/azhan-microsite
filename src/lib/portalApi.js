const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';

const getPortalToken = () => {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('portal_access_token'); } catch { return null; }
};

const authHeaders = () => {
  const token = getPortalToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};
export async function getInvoiceLink(bookingId) {
 const res = await fetch(`${API_BASE_URL}/api/portal/bookings/${bookingId}/invoice-link`, { headers: authHeaders(), cache: 'no-store' });
 const data = await readJSON(res);
 if (!res.ok) throw new Error(data.error || 'Gagal memuat invoice');
 return `/invoice/${data.invoice_token}`;
}

export async function portalLogin(brandId, identifier, portalPin) {
  const res = await fetch(`${API_BASE_URL}/api/portal/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand_id: Number(brandId),
      portal_pin: portalPin,
      identifier: identifier,
    }),
  });

  const data = await readJSON(res);
  if (!res.ok) {
    throw new Error(data.error || 'Gagal login ke portal');
  }
  return data;
}

export async function getMe() {
  const res = await fetch(`${API_BASE_URL}/api/portal/me`, {
    headers: authHeaders(),
  });
  const data = await readJSON(res);
  if (!res.ok) {
    throw new Error(data.error || 'Gagal mengambil profil jamaah');
  }
  return data;
}

export async function listMyBookings() {
  const res = await fetch(`${API_BASE_URL}/api/portal/bookings`, {
    headers: authHeaders(),
  });
  const data = await readJSON(res);
  if (!res.ok) {
    throw new Error(data.error || 'Gagal mengambil data booking');
  }
  return data;
}

export async function getMyBooking(id) {
  const res = await fetch(`${API_BASE_URL}/api/portal/bookings/${id}`, {
    headers: authHeaders(),
  });
  const data = await readJSON(res);
  if (!res.ok) {
    throw new Error(data.error || 'Booking tidak ditemukan');
  }
  return data;
}

export async function listMyPayments(bookingId) {
  const res = await fetch(`${API_BASE_URL}/api/portal/bookings/${bookingId}/payments`, {
    headers: authHeaders(),
  });
  const data = await readJSON(res);
  if (!res.ok) {
    throw new Error(data.error || 'Gagal mengambil riwayat pembayaran');
  }
  return data;
}

export async function listPaymentAccounts() {
  const res = await fetch(`${API_BASE_URL}/api/portal/bank-accounts`, { headers: authHeaders() });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Gagal mengambil rekening tujuan');
  return data;
}

export async function uploadPortalMedia(file) {
  const token = getPortalToken();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/portal/media/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Bukti transfer gagal diunggah');
  return data.url;
}

export async function submitPaymentConfirmation(bookingId, payload) {
  const res = await fetch(`${API_BASE_URL}/api/portal/bookings/${bookingId}/payments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Konfirmasi pembayaran gagal dikirim');
  return data;
}

// ─── Agen Syiar ──────────────────────────────────────────────────────────────

export async function getAgenStatus() {
  const res = await fetch(`${API_BASE_URL}/api/portal/agen`, { headers: authHeaders() });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Gagal memuat status Syiar');
  return data;
}

export async function ajukanAgen(payload) {
  const res = await fetch(`${API_BASE_URL}/api/portal/agen/pengajuan`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Pengajuan agen gagal dikirim');
  return data;
}

export async function kirimBuktiPendaftaranAgen(buktiTransferUrl) {
  const res = await fetch(`${API_BASE_URL}/api/portal/agen/pembayaran/bukti`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ bukti_transfer_url: buktiTransferUrl }),
  });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Bukti transfer gagal dikirim');
  return data;
}

// Agen aktif: dashboard (A3), riwayat komisi (A6), booking Jalur 1 (A5).
export async function getAgenDashboard() {
  const res = await fetch(`${API_BASE_URL}/api/portal/agen/dashboard`, { headers: authHeaders() });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Gagal memuat dashboard agen');
  return data;
}

export async function listKomisiAgen({ limit = 50, offset = 0 } = {}) {
  const res = await fetch(`${API_BASE_URL}/api/portal/agen/komisi?limit=${limit}&offset=${offset}`, { headers: authHeaders() });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Gagal memuat riwayat komisi');
  return data;
}

export async function listJamaahSaya(q = '') {
  const res = await fetch(`${API_BASE_URL}/api/portal/agen/jamaah?q=${encodeURIComponent(q)}`, { headers: authHeaders() });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Gagal memuat daftar jamaah');
  return data;
}

export async function buatBookingAgen(payload) {
  const res = await fetch(`${API_BASE_URL}/api/portal/agen/bookings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Booking gagal dibuat');
  return data;
}

// Tarik saldo (A7).
export async function getPencairanAgen() {
  const res = await fetch(`${API_BASE_URL}/api/portal/agen/pencairan`, { headers: authHeaders() });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Gagal memuat data pencairan');
  return data;
}

export async function ajukanPencairanAgen(payload) {
  const res = await fetch(`${API_BASE_URL}/api/portal/agen/pencairan`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Pengajuan pencairan gagal dikirim');
  return data;
}

// Bukti transfer keluar milik agen sendiri, dibuka sebagai blob.
export async function bukaBuktiPencairan(id) {
  const res = await fetch(`${API_BASE_URL}/api/portal/agen/pencairan/${id}/bukti`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Bukti transfer tidak dapat dibuka');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function listMyDokumen() {
  const res = await fetch(`${API_BASE_URL}/api/portal/dokumen`, {
    headers: authHeaders(),
  });
  const data = await readJSON(res);
  if (!res.ok) {
    throw new Error(data.error || 'Gagal mengambil daftar dokumen');
  }
  return data;
}

export async function uploadMyDokumen(jenis, file) {
  const token = getPortalToken();
  if (!token) {
    throw new Error('Sesi login telah berakhir, silakan login kembali');
  }

  // 1. Upload media to /api/portal/media/upload
  const formData = new FormData();
  formData.append('file', file);

  const uploadRes = await fetch(`${API_BASE_URL}/api/portal/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const uploadData = await readJSON(uploadRes);
  if (!uploadRes.ok) {
    throw new Error(uploadData.error || 'Gagal mengupload file dokumen');
  }

  // 2. Upsert document record in /api/portal/dokumen
  const docRes = await fetch(`${API_BASE_URL}/api/portal/dokumen`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      jenis: jenis,
      file_url: uploadData.url,
    }),
  });

  const docData = await readJSON(docRes);
  if (!docRes.ok) {
    throw new Error(docData.error || 'Gagal memperbarui status dokumen');
  }

  return docData;
}

async function readJSON(res) {
  const data = await res.json().catch(() => ({ error: 'Server belum dapat memproses permintaan. Silakan coba lagi.' }));
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('portal-session-expired'));
    const error = new Error(data.error || 'Sesi berakhir. Silakan masuk kembali.'); error.status = 401; throw error;
  }
  return data;
}
export async function portalLogout() {
  const res = await fetch(API_BASE_URL + '/api/portal/logout', { method: 'POST', headers: authHeaders() });
  if (!res.ok && res.status !== 401) throw new Error('Sesi belum dapat diakhiri. Coba lagi.');
}
export async function getCashback() {
  const res = await fetch(API_BASE_URL + '/api/portal/cashback', { headers: authHeaders(), cache: 'no-store' });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(data.error || 'Gagal memuat cashback'); return data;
}
export async function getDocumentFile(id) {
  const res = await fetch(API_BASE_URL + '/api/portal/dokumen/' + id + '/file', { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) { await readJSON(res); throw new Error('Dokumen belum dapat dibuka'); } return await res.blob();
}
