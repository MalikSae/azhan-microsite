'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { useBrand } from '@/context/BrandContext';
import { listMyBookings, listMyPayments, listMyDokumen } from '@/lib/portalApi';
import { formatRupiah, formatTanggalIndo } from '@/lib/portalFormat';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const cleanStr = String(dateStr).trim();
  const normalizedStr = /^\d{4}-\d{2}-\d{2}$/.test(cleanStr)
    ? `${cleanStr}T00:00:00`
    : cleanStr;
  const date = new Date(normalizedStr);
  return isNaN(date.getTime()) ? null : date;
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const { jamaah, isLoading: isAuthLoading } = usePortalAuth();
  const { brandId, brandName, brandLogo, brandIcon, brandWhatsapp } = useBrand();

  const [dataLoading, setDataLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [dokumenList, setDokumenList] = useState([]);

  useEffect(() => {
    if (!isAuthLoading && !jamaah) {
      router.replace('/portal/login');
    }
  }, [isAuthLoading, jamaah, router]);

  useEffect(() => {
    if (!jamaah) return;

    let isMounted = true;

    async function loadDashboardData() {
      setDataLoading(true);
      setHasError(false);

      try {
        const [bookingsRes, dokumenRes] = await Promise.all([
          listMyBookings(),
          listMyDokumen(),
        ]);

        if (!isMounted) return;

        setDokumenList(Array.isArray(dokumenRes) ? dokumenRes : []);

        const bookings = Array.isArray(bookingsRes) ? bookingsRes : [];
        let chosenBooking = null;

        // Filter hanya booking yang aktif (bukan batal, cancelled, atau draft)
        const activeBookings = bookings.filter(
          (b) => b.status !== 'batal' && b.status !== 'cancelled' && b.status !== 'draft'
        );

        if (activeBookings.length > 0) {
          const now = new Date();
          now.setHours(0, 0, 0, 0);

          const upcoming = activeBookings.filter((b) => {
            const depDate = parseLocalDate(b.berangkat_tanggal);
            return depDate && depDate >= now;
          });

          if (upcoming.length > 0) {
            upcoming.sort((a, b) => {
              const dateA = parseLocalDate(a.berangkat_tanggal) || new Date(0);
              const dateB = parseLocalDate(b.berangkat_tanggal) || new Date(0);
              return dateA - dateB;
            });
            chosenBooking = upcoming[0];
          } else {
            const past = [...activeBookings].sort((a, b) => {
              const dateA = parseLocalDate(a.berangkat_tanggal) || new Date(0);
              const dateB = parseLocalDate(b.berangkat_tanggal) || new Date(0);
              return dateB - dateA;
            });
            chosenBooking = past[0];
          }
        }

        setSelectedBooking(chosenBooking);

        if (chosenBooking && chosenBooking.id) {
          try {
            const paymentsRes = await listMyPayments(chosenBooking.id);
            if (isMounted) {
              setPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
            }
          } catch {
            if (isMounted) {
              setPayments([]);
            }
          }
        } else {
          setPayments([]);
        }

        setDataLoading(false);
      } catch {
        if (isMounted) {
          setHasError(true);
          setDataLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [jamaah]);

  if (isAuthLoading || !jamaah || dataLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-neutral-500 font-medium">
        Memuat...
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-neutral-500 text-center">
        Gagal memuat data. Coba muat ulang halaman.
      </div>
    );
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const targetIcon = brandIcon || brandLogo;
  const fullIconUrl = targetIcon
    ? targetIcon.startsWith('http')
      ? targetIcon
      : `${apiBaseUrl}${targetIcon}`
    : null;

  // 1. Perhitungan Hari Keberangkatan (H-)
  let isUpcoming = false;
  let diffDays = 0;
  if (selectedBooking && selectedBooking.berangkat_tanggal) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const depDate = parseLocalDate(selectedBooking.berangkat_tanggal);
    if (depDate) {
      depDate.setHours(0, 0, 0, 0);
      const diffTime = depDate.getTime() - now.getTime();
      diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      isUpcoming = diffDays >= 0;
    }
  }

  // 2. Perhitungan Progress Persiapan (8 Tahap)
  const progressFields = selectedBooking
    ? [
        selectedBooking.progress_paspor,
        selectedBooking.progress_visa,
        selectedBooking.progress_tiket,
        selectedBooking.progress_hotel,
        selectedBooking.progress_land_arrangement,
        selectedBooking.progress_manasik,
        selectedBooking.progress_siskopatuh,
        selectedBooking.progress_vaksin_meningitis,
      ]
    : [];
  const completedProgressCount = progressFields.filter(Boolean).length;

  // 3. Perhitungan Kelengkapan Dokumen (7 Jenis)
  const validDocTypes = [
    'pas_foto',
    'paspor',
    'ktp',
    'kk',
    'buku_nikah',
    'akte_lahir',
    'vaksin_meningitis',
  ];
  const approvedDocTypes = new Set(
    dokumenList
      .filter((d) => d.status === 'approved' && validDocTypes.includes(d.jenis))
      .map((d) => d.jenis)
  );
  const approvedDocsCount = approvedDocTypes.size;

  // 4. Perhitungan Pembayaran (Status Real: confirmed / verified)
  const totalDibayar = payments
    .filter((p) => p.status === 'confirmed' || p.status === 'verified')
    .reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const totalHarga = Number(selectedBooking?.total_harga) || 0;
  const sisaTagihan = Math.max(0, totalHarga - totalDibayar);

  // 5. Data Stepper 6 Node
  const remainingLainnya = selectedBooking
    ? [
        selectedBooking.progress_land_arrangement,
        selectedBooking.progress_siskopatuh,
        selectedBooking.progress_vaksin_meningitis,
      ].filter((x) => !x).length
    : 3;

  const stepperNodes = selectedBooking
    ? [
        { label: 'Paspor', done: Boolean(selectedBooking.progress_paspor) },
        { label: 'Visa', done: Boolean(selectedBooking.progress_visa) },
        { label: 'Tiket', done: Boolean(selectedBooking.progress_tiket) },
        { label: 'Hotel', done: Boolean(selectedBooking.progress_hotel) },
        { label: 'Manasik', done: Boolean(selectedBooking.progress_manasik) },
        {
          label: 'Lainnya',
          isSpecial: true,
          statusText: remainingLainnya === 0 ? 'Selesai' : `${remainingLainnya} Tersisa`,
        },
      ]
    : [];

  return (
    <>
      {/* Zona Header: Tinggi Standar & Foto Ka'bah Diperbesar */}
      <div className="relative overflow-hidden px-4 pt-7 pb-14 sm:pt-8 sm:pb-16 min-h-[165px] flex flex-col justify-start">
        {/* Foto Ka'bah dengan Fokus Tepat pada Bangunan Ka'bah */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/images/bg-kaaba-2.webp"
            alt="Latar Belakang Ka'bah"
            className="w-full h-full object-cover object-[82%_62%] scale-[1.65] sm:scale-[1.75] origin-[82%_62%]"
          />
          {/* Soft overlay gradient dari kiri & bawah agar teks terbaca jelas */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />
        </div>

        {/* Konten Teks Header Rata Kiri */}
        <div className="relative z-10 flex items-start gap-3 max-w-[75%]">
          {/* Logo Brand Kecil */}
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-xs flex items-center justify-center bg-white border border-neutral-200/80 shrink-0">
            {fullIconUrl ? (
              <img
                src={fullIconUrl}
                alt={brandName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-brand text-white font-extrabold text-sm flex items-center justify-center">
                {brandName?.charAt(0) || 'A'}
              </div>
            )}
          </div>

          {/* Sapaan Jamaah */}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-neutral-600 font-medium leading-none mb-1">
              Assalamu&apos;alaikum,
            </p>
            <h1 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight truncate">
              {jamaah.nama_lengkap}
            </h1>
            {jamaah.id_jamaah && (
              <span className="inline-block text-[11px] font-mono text-neutral-500 mt-0.5">
                {jamaah.id_jamaah}
              </span>
            )}
          </div>
        </div>

        {/* Tombol Notifikasi di Pojok Kanan Atas */}
        <div className="absolute top-6 right-4 z-10">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200/80 shadow-2xs flex items-center justify-center text-neutral-700">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Konten Halaman (Overlap Menimpa Header Bagian Bawah) */}
      <div className="relative -mt-9 z-10 px-4 space-y-4 pb-6">
        {/* 1. Card Perjalanan (Dua Kolom dengan Divider & Overlap Header) */}
        {selectedBooking ? (
          <Card className="p-4 shadow-sm sm:shadow-md border border-neutral-200/90">
            <div className="grid grid-cols-12 gap-2 divide-x divide-neutral-200/80 items-center">
              {/* Kolom Kiri: Detail Paket */}
              <div className="col-span-7 pr-2 flex flex-col justify-center">
                <span className="text-[11px] font-medium text-neutral-500 mb-0.5 truncate">
                  {selectedBooking.jadwal_nama || 'Umroh Reguler'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                  {formatTanggalIndo(selectedBooking.berangkat_tanggal)}
                </h2>
                {selectedBooking.id_booking && (
                  <p className="text-[11px] font-mono text-neutral-400 mt-1">
                    Kode Booking: {selectedBooking.id_booking}
                  </p>
                )}
              </div>

              {/* Kolom Kanan: Countdown / Status Keberangkatan */}
              <div className="col-span-5 pl-3 flex flex-col items-center justify-center text-center">
                {isUpcoming ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-extrabold text-brand leading-none">
                      {diffDays}
                    </span>
                    <span className="text-[11px] font-bold text-neutral-800 mt-1 leading-tight">
                      Hari Lagi
                    </span>
                    <span className="text-[10px] text-neutral-400 leading-tight">
                      Menuju Keberangkatan
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-neutral-500 py-2 w-full text-center">
                    Sudah Berlalu
                  </span>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <EmptyState
            title="Belum Ada Perjalanan"
            message="Belum ada perjalanan terdaftar untuk akun Anda."
          />
        )}

        {/* 2. Grid Menu Cepat Seamless (4 Menu: Manasik, Doa-doa, Tips Umroh, Kontak Darurat) */}
        <div className="grid grid-cols-4 gap-2 py-1">
          {/* Menu 1: Manasik */}
          <Link
            href="/portal/perjalanan"
            className="flex flex-col items-center justify-center text-center group"
          >
            <div className="w-12 h-12 aspect-square rounded-2xl bg-brand text-white flex items-center justify-center shrink-0 mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
              <svg
                className="w-6 h-6 text-white shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-neutral-800 leading-tight">
              Manasik
            </span>
          </Link>

          {/* Menu 2: Doa-doa */}
          <Link
            href="/portal/perjalanan"
            className="flex flex-col items-center justify-center text-center group"
          >
            <div className="w-12 h-12 aspect-square rounded-2xl bg-brand text-white flex items-center justify-center shrink-0 mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
              <svg
                className="w-6 h-6 text-white shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 00-1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-neutral-800 leading-tight">
              Doa-doa
            </span>
          </Link>

          {/* Menu 3: Tips Umroh */}
          <Link
            href="/portal/perjalanan"
            className="flex flex-col items-center justify-center text-center group"
          >
            <div className="w-12 h-12 aspect-square rounded-2xl bg-brand text-white flex items-center justify-center shrink-0 mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
              <svg
                className="w-6 h-6 text-white shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.508 1.333 1.508 2.316V18"
                />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-neutral-800 leading-tight">
              Tips Umroh
            </span>
          </Link>

          {/* Menu 4: Kontak Darurat */}
          <a
            href={
              brandWhatsapp
                ? `https://wa.me/${brandWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    'Halo Admin, saya membutuhkan bantuan darurat untuk perjalanan umroh.'
                  )}`
                : '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center text-center group"
          >
            <div className="w-12 h-12 aspect-square rounded-2xl bg-brand text-white flex items-center justify-center shrink-0 mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
              <svg
                className="w-6 h-6 text-white shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-neutral-800 leading-tight">
              Kontak Darurat
            </span>
          </a>
        </div>

        {/* 3. Card Stepper 6 Node: Persiapan Perjalanan */}
        {selectedBooking && (
          <Link href="/portal/perjalanan" className="block">
            <Card className="p-4 hover:border-neutral-300 transition-colors">
              {/* Header Stepper */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                    Persiapan Perjalanan Anda
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Lengkapi semua persiapan dengan mudah
                  </p>
                </div>
                <span className="text-xs font-semibold text-brand flex items-center gap-0.5 shrink-0">
                  Lihat Detail &rarr;
                </span>
              </div>

              {/* 6 Node Stepper Horizontal */}
              <div className="relative px-1">
                {/* Garis Penghubung Latar Belakang */}
                <div className="absolute top-[13px] left-6 right-6 h-[2px] bg-neutral-200 z-0" />

                <div className="grid grid-cols-6 gap-1 relative z-10">
                  {stepperNodes.map((node, index) => {
                    const isDone = node.done;
                    return (
                      <div
                        key={node.label}
                        className="flex flex-col items-center text-center"
                      >
                        {/* Circle Node */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            node.isSpecial
                              ? 'border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 font-bold text-[9px] ring-4 ring-white'
                              : isDone
                              ? 'bg-brand text-white shadow-2xs ring-4 ring-white'
                              : 'bg-white border border-neutral-300 text-neutral-400 ring-4 ring-white'
                          }`}
                        >
                          {node.isSpecial ? (
                            <span>...</span>
                          ) : isDone ? (
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <span className="text-[10px] font-semibold">{index + 1}</span>
                          )}
                        </div>

                        {/* Label Tahap */}
                        <span className="text-[10px] font-medium text-neutral-800 mt-1.5 leading-tight">
                          {node.label}
                        </span>

                        {/* Status Label */}
                        <span className="text-[9px] mt-0.5 leading-tight">
                          {node.isSpecial ? (
                            <span className="text-neutral-500 font-medium">
                              {node.statusText}
                            </span>
                          ) : isDone ? (
                            <span className="text-emerald-600 font-semibold">
                              Selesai
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-medium">
                              Belum
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Baris Ringkasan di Bawah Stepper */}
              <div className="mt-3.5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
                <span className="font-medium">
                  {completedProgressCount} dari 8 tahap selesai
                </span>
                {selectedBooking.siap_berangkat && (
                  <Badge variant="success">Siap Berangkat</Badge>
                )}
              </div>
            </Card>
          </Link>
        )}

        {/* 4. Card Dokumen */}
        <Link href="/portal/perjalanan" className="block">
          <Card className="p-4 hover:border-neutral-300 transition-colors">
            <div className="flex items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-2xl border text-brand flex items-center justify-center shrink-0 shadow-2xs"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--brand-primary, #990000) 8%, white)',
                  borderColor: 'color-mix(in srgb, var(--brand-primary, #990000) 25%, #e5e5e5)',
                }}
              >
                <svg
                  className="w-5 h-5 text-brand"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                    Kelengkapan Dokumen
                  </h3>
                  <span className="text-[11px] font-semibold text-brand">
                    {approvedDocsCount}/7
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {approvedDocsCount} dari 7 dokumen telah disetujui
                </p>
                <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ width: `${(approvedDocsCount / 7) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </Link>

        {/* 5. Card Pembayaran */}
        {selectedBooking && (
          <Link href="/portal/perjalanan" className="block">
            <Card className="p-4 hover:border-neutral-300 transition-colors">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-2xl border text-brand flex items-center justify-center shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--brand-primary, #990000) 8%, white)',
                    borderColor: 'color-mix(in srgb, var(--brand-primary, #990000) 25%, #e5e5e5)',
                  }}
                >
                  <svg
                    className="w-5 h-5 text-brand"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                    Status Pembayaran
                  </h3>
                  {sisaTagihan > 0 ? (
                    <p className="text-xs text-amber-700 font-medium mt-0.5">
                      Sisa tagihan {formatRupiah(sisaTagihan)}
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                      Pembayaran Lunas
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* 6. Banner Syiar (Solid Brand Color) */}
        <Link href="/portal/syiar" className="block">
          <div className="bg-brand text-white rounded-2xl p-4 flex items-center gap-3.5 hover:brightness-95 transition-all shadow-xs">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.3404 15.8398C9.65153 15.7803 8.95431 15.75 8.25 15.75H7.5C5.01472 15.75 3 13.7353 3 11.25C3 8.76472 5.01472 6.75 7.5 6.75H8.25C8.95431 6.75 9.65153 6.71966 10.3404 6.66022M10.3404 15.8398C10.5933 16.8015 10.9237 17.7317 11.3246 18.6234C11.5721 19.1738 11.3842 19.8328 10.8616 20.1345L10.2053 20.5134C9.6539 20.8318 8.9456 20.6306 8.67841 20.0527C8.0518 18.6973 7.56541 17.2639 7.23786 15.771M10.3404 15.8398C9.95517 14.3745 9.75 12.8362 9.75 11.25C9.75 9.66379 9.95518 8.1255 10.3404 6.66022M10.3404 15.8398C13.5 16.1124 16.4845 16.9972 19.1747 18.3749M10.3404 6.66022C13.5 6.3876 16.4845 5.50283 19.1747 4.12509M19.1747 4.12509C19.057 3.74595 18.9302 3.37083 18.7944 3M19.1747 4.12509C19.7097 5.84827 20.0557 7.65462 20.1886 9.51991M19.1747 18.3749C19.057 18.7541 18.9302 19.1292 18.7944 19.5M19.1747 18.3749C19.7097 16.6517 20.0557 14.8454 20.1886 12.9801M20.1886 9.51991C20.6844 9.93264 21 10.5545 21 11.25C21 11.9455 20.6844 12.5674 20.1886 12.9801M20.1886 9.51991C20.2293 10.0913 20.25 10.6682 20.25 11.25C20.25 11.8318 20.2293 12.4087 20.1886 12.9801"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Fitur Syiar segera hadir
              </h4>
              <p className="text-[11px] text-white/85">
                Referral, komisi & reward untuk agen jamaah.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
