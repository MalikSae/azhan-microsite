const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';

const getPortalToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('portal_access_token');
};

const authHeaders = () => {
  const token = getPortalToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export async function portalLogin(brandId, namaLengkap, idJamaah) {
  const res = await fetch(`${API_BASE_URL}/api/portal/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand_id: Number(brandId),
      nama_lengkap: namaLengkap,
      id_jamaah: idJamaah,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Gagal login ke portal');
  }
  return data;
}

export async function getMe() {
  const res = await fetch(`${API_BASE_URL}/api/portal/me`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Gagal mengambil profil jamaah');
  }
  return data;
}

export async function listMyBookings() {
  const res = await fetch(`${API_BASE_URL}/api/portal/bookings`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Gagal mengambil data booking');
  }
  return data;
}

export async function getMyBooking(id) {
  const res = await fetch(`${API_BASE_URL}/api/portal/bookings/${id}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Booking tidak ditemukan');
  }
  return data;
}

export async function listMyPayments(bookingId) {
  const res = await fetch(`${API_BASE_URL}/api/portal/bookings/${bookingId}/payments`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Gagal mengambil riwayat pembayaran');
  }
  return data;
}

export async function listMyDokumen() {
  const res = await fetch(`${API_BASE_URL}/api/portal/dokumen`, {
    headers: authHeaders(),
  });
  const data = await res.json();
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

  const uploadData = await uploadRes.json();
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

  const docData = await docRes.json();
  if (!docRes.ok) {
    throw new Error(docData.error || 'Gagal memperbarui status dokumen');
  }

  return docData;
}
