'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { getMyBooking, listMyPayments } from '@/lib/portalApi';
import Badge from '@/components/ui/Badge';

const formatRupiah = (angka) => {
  if (angka === undefined || angka === null || isNaN(angka)) return 'Rp 0';
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
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const PROGRESS_ITEMS = [
  { key: 'progress_paspor', label: 'Dokumen Paspor' },
  { key: 'progress_visa', label: 'Visa Umroh' },
  { key: 'progress_tiket', label: 'Tiket Pesawat' },
  { key: 'progress_hotel', label: 'Booking Hotel Makkah/Madinah' },
  { key: 'progress_land_arrangement', label: 'Land Arrangement (LA)' },
  { key: 'progress_manasik', label: 'Bimbingan Manasik' },
  { key: 'progress_siskopatuh', label: 'Pendaftaran Siskopatuh' },
  { key: 'progress_vaksin_meningitis', label: 'Vaksin Meningitis' },
];

export default function PortalBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id;

  const { brandName, brandLogo } = useBrand();
  const { jamaah, isLoading: authLoading } = usePortalAuth();

  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!authLoading && !jamaah) {
      router.push('/portal/login');
    }
  }, [authLoading, jamaah, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) return;
      try {
        setLoading(true);
        setErrorMessage(null);
        const [bData, pData] = await Promise.all([
          getMyBooking(bookingId),
          listMyPayments(bookingId).catch(() => []),
        ]);
        setBooking(bData);
        setPayments(pData || []);
      } catch (err) {
        setErrorMessage(err.message || 'Booking tidak ditemukan');
      } finally {
        setLoading(false);
      }
    };

    if (jamaah && bookingId) {
      fetchData();
    }
  }, [jamaah, bookingId]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo && brandLogo.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Memuat detail booking...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !booking) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 text-center max-w-md shadow-xs">
          <div className="w-12 h-12 rounded-full bg-danger-100 text-danger-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-neutral-900 mb-1">Booking Tidak Ditemukan</h2>
          <p className="text-xs text-neutral-500 mb-4">
            Data booking ini tidak tersedia atau bukan milik akun Anda.
          </p>
          <Link
            href="/portal"
            className="inline-flex px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold shadow-xs"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalTerbayar = payments
    .filter((p) => p.status === 'confirmed')
    .reduce((sum, p) => sum + (p.jumlah || 0), 0);

  const sisaTagihan = Math.max(0, (booking.total_harga || 0) - totalTerbayar);

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/portal" className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Kembali</span>
            </Link>
            <span className="text-neutral-300">|</span>
            <span className="text-xs font-bold text-neutral-900">
              Invoice #INV-{String(booking.id).padStart(5, '0')}
            </span>
          </div>

          <Link href="/portal" className="hover:opacity-90 transition-opacity">
            {fullLogoUrl ? (
              <img src={fullLogoUrl} alt={brandName} className="h-7 w-auto object-contain" />
            ) : (
              <span className="text-xs font-bold text-neutral-800">{brandName}</span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner Paket */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-neutral-100 pb-3">
            <div>
              <span className="text-xs font-mono text-neutral-400 block">Jadwal Keberangkatan</span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                {booking.jadwal_nama}
              </h1>
            </div>
            <div>
              <Badge variant={booking.status === 'lunas' ? 'success' : 'warning'}>
                {booking.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-neutral-400 block">Tanggal Berangkat</span>
              <span className="font-bold text-neutral-800 text-sm">
                {formatTanggal(booking.berangkat_tanggal)}
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-neutral-400 block">Tipe Kamar</span>
              <span className="font-bold text-neutral-800 text-sm">Kamar {booking.room_type}</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-neutral-400 block">Nama Jamaah</span>
              <span className="font-bold text-neutral-800 text-sm">{booking.nama_jamaah}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Progress Keberangkatan */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-neutral-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Progress Kesiapan Keberangkatan</h2>
              <p className="text-xs text-neutral-500">
                Status verifikasi kelengkapan dokumen dan fasilitas keberangkatan Anda.
              </p>
            </div>
            <div>
              {booking.siap_berangkat ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-100 text-success-800 text-xs font-bold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>SIAP BERANGKAT</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 text-warning-800 text-xs font-bold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>PERSIAPAN BERJALAN</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {PROGRESS_ITEMS.map((p) => {
              const isReady = Boolean(booking[p.key]);
              return (
                <div
                  key={p.key}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isReady
                      ? 'border-success-200 bg-success-50/60 shadow-2xs'
                      : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  <span className={`text-xs font-semibold ${isReady ? 'text-success-900' : 'text-neutral-800'}`}>
                    {p.label}
                  </span>
                  {isReady ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-success-600 shrink-0"
                      aria-label="Sudah Siap"
                    >
                      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                      <path d="m9 11 3 3L22 4" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-neutral-400 shrink-0"
                      aria-label="Belum Siap"
                    >
                      <path d="M12 2v4" />
                      <path d="m16.2 7.8 2.9-2.9" />
                      <path d="M18 12h4" />
                      <path d="m16.2 16.2 2.9 2.9" />
                      <path d="M12 18v4" />
                      <path d="m4.9 19.1 2.9-2.9" />
                      <path d="M2 12h4" />
                      <path d="m4.9 4.9 2.9 2.9" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Perlengkapan */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-neutral-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Perlengkapan</h2>
              <p className="text-xs text-neutral-500">
                Status penyerahan perlengkapan ibadah umroh untuk perjalanan Anda.
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-1">
              {booking.perlengkapan_status === 'sudah_diberikan' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-100 text-success-800 text-xs font-bold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>SUDAH DIBERIKAN</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold">
                  BELUM DIBERIKAN
                </span>
              )}
              {booking.perlengkapan_status === 'sudah_diberikan' && booking.perlengkapan_tanggal && (
                <span className="text-xs text-neutral-500 font-body">
                  Diterima pada {formatTanggal(booking.perlengkapan_tanggal)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Rincian Tagihan (Invoice Read-Only) */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-base font-bold text-neutral-900">Rincian Biaya & Invoice</h2>
            <p className="text-xs text-neutral-500">
              Rincian harga paket dasar, layanan tambahan (add-ons), dan diskon.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Harga Paket Dasar ({booking.room_type})</span>
              <span className="font-semibold text-neutral-900 font-mono">
                {formatRupiah(booking.harga_dasar)}
              </span>
            </div>

            {booking.addons && booking.addons.length > 0 && (
              <div className="py-1 space-y-1.5 border-b border-neutral-100">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                  Layanan Tambahan (Add-Ons)
                </span>
                {booking.addons.map((a) => (
                  <div key={a.id} className="flex justify-between pl-2 text-neutral-600">
                    <span>• {a.nama || a.name}</span>
                    <span className="font-semibold text-neutral-900 font-mono">
                      {formatRupiah(a.nominal)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {booking.diskon > 0 && (
              <div className="flex justify-between py-2 border-b border-neutral-100 text-danger-600 font-medium">
                <span>Potongan / Diskon {booking.diskon_keterangan ? `(${booking.diskon_keterangan})` : ''}</span>
                <span className="font-semibold font-mono">
                  - {formatRupiah(booking.diskon)}
                </span>
              </div>
            )}

            <div className="flex justify-between pt-3 text-sm font-extrabold text-neutral-900">
              <span>Total Tagihan</span>
              <span className="font-mono text-base">{formatRupiah(booking.total_harga)}</span>
            </div>
          </div>
        </section>

        {/* Section 3: Riwayat Pembayaran */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Riwayat Pembayaran</h2>
              <p className="text-xs text-neutral-500">
                Daftar pembayaran yang telah tercatat dan dikonfirmasi admin.
              </p>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-400 italic">
              Belum ada riwayat pembayaran yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">Tanggal</th>
                    <th className="pb-2.5">Metode</th>
                    <th className="pb-2.5">Jumlah</th>
                    <th className="pb-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="text-neutral-800">
                      <td className="py-2.5">{formatTanggal(p.tanggal)}</td>
                      <td className="py-2.5 font-medium uppercase">{p.metode}</td>
                      <td className="py-2.5 font-bold font-mono">{formatRupiah(p.jumlah)}</td>
                      <td className="py-2.5 text-right">
                        <Badge variant={p.status === 'confirmed' ? 'success' : 'warning'}>
                          {p.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Summary Footer */}
          <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-success-50 rounded-xl border border-success-200">
              <span className="text-success-700 block text-xs">Total Terbayar</span>
              <span className="font-bold text-success-800 text-sm font-mono">
                {formatRupiah(totalTerbayar)}
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-neutral-500 block text-xs">Sisa Tagihan</span>
              <span className="font-bold text-neutral-900 text-sm font-mono">
                {formatRupiah(sisaTagihan)}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
