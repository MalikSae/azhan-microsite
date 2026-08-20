'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { listMyBookings, listMyDokumen, uploadMyDokumen } from '@/lib/portalApi';
import Badge from '@/components/ui/Badge';
import ProgressTimeline from '@/components/ProgressTimeline';

const DOKUMEN_ITEMS = [
  { key: 'foto', label: 'Pas Foto (4x6)', desc: 'Latar belakang putih, tampak 80% wajah' },
  { key: 'paspor', label: 'Buku Paspor', desc: 'Halaman identitas paspor yang masih aktif' },
  { key: 'ktp', label: 'KTP Elektronik', desc: 'Foto KTP asli jelas dan terbaca' },
  { key: 'kk', label: 'Kartu Keluarga', desc: 'Foto lembar Kartu Keluarga asli' },
  { key: 'buku_nikah', label: 'Buku Nikah / Akta Lahir', desc: 'Untuk mahram / pasangan / anak' },
  { key: 'vaksin_meningitis', label: 'Sertifikat Vaksin', desc: 'Buku kuning / sertifikat vaksin meningitis' },
];

const formatRupiah = (angka) => {
  if (angka === undefined || angka === null || isNaN(angka)) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

const formatTanggal = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getStatusBookingBadge = (status) => {
  switch (status) {
    case 'lunas':
    case 'siap_berangkat':
      return <Badge variant="success">{status.toUpperCase()}</Badge>;
    case 'dp':
    case 'baru':
    case 'draft':
      return <Badge variant="warning">{status.toUpperCase()}</Badge>;
    case 'batal':
      return <Badge variant="danger">BATAL</Badge>;
    default:
      return <Badge variant="neutral">{status.toUpperCase()}</Badge>;
  }
};

export function getNearestBooking(bookings) {
  if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
    return null;
  }

  // 1. Filter out 'batal'
  const activeBookings = bookings.filter((b) => b.status !== 'batal');
  if (activeBookings.length === 0) {
    return null;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const futureBookings = [];
  const pastBookings = [];

  for (const b of activeBookings) {
    const t = b.berangkat_tanggal ? new Date(b.berangkat_tanggal).getTime() : 0;
    if (t >= today) {
      futureBookings.push({ booking: b, time: t });
    } else {
      pastBookings.push({ booking: b, time: t });
    }
  }

  if (futureBookings.length > 0) {
    // Sort upcoming ascending (closest date first)
    futureBookings.sort((a, b) => a.time - b.time);
    return futureBookings[0].booking;
  }

  // If all are in the past, pick the most recent past date (descending)
  pastBookings.sort((a, b) => b.time - a.time);
  return pastBookings[0].booking;
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const { brandName, brandLogo } = useBrand();
  const { jamaah, isLoading: authLoading, logout } = usePortalAuth();

  const [bookings, setBookings] = useState([]);
  const [dokumenList, setDokumenList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  useEffect(() => {
    if (!authLoading && !jamaah) {
      router.push('/portal/login');
    }
  }, [authLoading, jamaah, router]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [bData, dData] = await Promise.all([
        listMyBookings().catch(() => []),
        listMyDokumen().catch(() => []),
      ]);
      setBookings(bData || []);
      setDokumenList(dData || []);
    } catch (err) {
      console.error('Gagal mengambil data portal:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (jamaah) {
      loadData();
    }
  }, [jamaah]);

  const handleFileUpload = async (jenis, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingKey(jenis);
    setAlertInfo(null);

    try {
      await uploadMyDokumen(jenis, file);
      setAlertInfo({ type: 'success', text: `Dokumen ${jenis.toUpperCase()} berhasil diunggah!` });
      const dData = await listMyDokumen();
      setDokumenList(dData || []);
    } catch (err) {
      setAlertInfo({ type: 'error', text: err.message || 'Gagal mengunggah dokumen' });
    } finally {
      setUploadingKey(null);
      e.target.value = '';
    }
  };

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo && brandLogo.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;

  const nearestBooking = getNearestBooking(bookings);

  if (authLoading || (!jamaah && authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Memuat portal jamaah...</p>
        </div>
      </div>
    );
  }

  if (!jamaah) return null;

  return (
    <div className="min-h-screen pb-16">
      {/* Portal Header Bar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              {fullLogoUrl ? (
                <img src={fullLogoUrl} alt={brandName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-brand text-white font-bold text-base flex items-center justify-center">
                  {brandName.charAt(0)}
                </div>
              )}
            </Link>
          </div>

          <button
            onClick={() => {
              logout();
              router.push('/portal/login');
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-danger-700 bg-danger-50 hover:bg-danger-100 border border-danger-200 transition-colors"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Welcome Greeting Banner */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-col justify-between items-start gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-mono font-semibold mb-2">
              ID: {jamaah.id_jamaah || `#${jamaah.id}`}
            </div>
            <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
              Halo, {jamaah.nama_lengkap}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Selamat datang di portal keberangkatan umroh resmi Anda.
            </p>
          </div>

          {jamaah.no_hp && (
            <div className="text-xs text-neutral-500 bg-neutral-50 px-3.5 py-2 rounded-xl border border-neutral-200">
              <span className="text-neutral-400 block">No. Handphone:</span>
              <span className="font-semibold text-neutral-800">{jamaah.no_hp}</span>
            </div>
          )}
        </div>

        {/* Global Alert Notification */}
        {alertInfo && (
          <div className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
            alertInfo.type === 'success'
              ? 'bg-success-50 border-success-200 text-success-700'
              : 'bg-danger-50 border-danger-200 text-danger-700'
          }`}>
            <span>{alertInfo.text}</span>
          </div>
        )}

        {/* Section: Timeline Progress Keberangkatan (Hanya jika ada active booking) */}
        {nearestBooking && (
          <ProgressTimeline booking={nearestBooking} />
        )}

        {/* Section 1: Kelola Dokumen Keberangkatan */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col gap-1 border-b border-neutral-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Kelola Dokumen Persyaratan
              </h2>
              <p className="text-xs text-neutral-500">
                Upload foto/scan dokumen asli untuk proses visa dan administrasi keberangkatan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 pt-1">
            {DOKUMEN_ITEMS.map((item) => {
              const doc = dokumenList.find((d) => d.jenis === item.key);
              const isUploaded = Boolean(doc && doc.file_url);
              const isCurrentUploading = uploadingKey === item.key;

              return (
                <div
                  key={item.key}
                  className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex flex-col justify-between gap-3 transition-all hover:border-neutral-300"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-bold text-sm text-neutral-900 truncate">{item.label}</h3>
                        {isUploaded && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4.5 h-4.5 text-success-600 shrink-0"
                            aria-label="Sudah diupload"
                          >
                            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                            <path d="m9 11 3 3L22 4" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 leading-snug">{item.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-2">
                    {isUploaded ? (
                      <>
                        <span className="text-xs text-neutral-500">Berkas terunggah</span>
                        <a
                          href={doc.file_url.startsWith('http') ? doc.file_url : `${apiBaseUrl}${doc.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold transition-colors shadow-2xs"
                        >
                          Lihat Berkas
                        </a>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-neutral-400 italic">Belum ada berkas</span>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold transition-colors shadow-2xs">
                          {isCurrentUploading ? (
                            <span>Mengunggah...</span>
                          ) : (
                            <span>Upload</span>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isCurrentUploading}
                            onChange={(e) => handleFileUpload(item.key, e)}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Booking Keberangkatan Saya */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-base font-bold text-neutral-900">
              Jadwal & Booking Saya
            </h2>
            <p className="text-xs text-neutral-500">
              Informasi paket perjalanan, status pembayaran, dan checklist kesiapan Anda.
            </p>
          </div>

          {loadingData ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Memuat data booking...
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
              <p className="text-sm font-semibold text-neutral-700">Anda belum memiliki booking terdaftar.</p>
              <p className="text-xs text-neutral-500 mt-1">
                Silakan hubungi customer service {brandName} untuk pendaftaran jadwal umroh.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 pt-1">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all shadow-2xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-neutral-400">
                        #INV-{String(b.id).padStart(5, '0')}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-neutral-900 leading-snug">
                      {b.jadwal_nama}
                    </h3>

                    <div className="text-xs space-y-1 text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-400">Keberangkatan:</span>
                        <span className="font-semibold text-neutral-800">
                          {formatTanggal(b.berangkat_tanggal)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-400">Tipe Kamar:</span>
                        <span className="font-medium text-neutral-800">Kamar {b.room_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-neutral-400 block">Total Biaya</span>
                      <span className="text-sm font-extrabold text-neutral-900 font-mono">
                        {formatRupiah(b.total_harga)}
                      </span>
                    </div>

                    <Link
                      href={`/portal/booking/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:brightness-95 transition-all shadow-xs group"
                    >
                      <span>Lihat Rincian</span>
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
