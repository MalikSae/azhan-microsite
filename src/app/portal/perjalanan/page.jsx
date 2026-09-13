'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { listMyBookings, listMyDokumen, uploadMyDokumen, getMyBooking } from '@/lib/portalApi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ItineraryModal from '@/components/ItineraryModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';

const DOKUMEN_ITEMS = [
  {
    jenis: 'ktp',
    label: 'KTP',
    desc: 'Foto e-KTP asli yang jelas',
    required: true,
  },
  {
    jenis: 'paspor',
    label: 'Paspor',
    desc: 'Halaman identitas, masa berlaku min. 7 bulan',
    required: true,
  },
  {
    jenis: 'kk',
    label: 'Kartu Keluarga',
    desc: 'Foto atau scan Kartu Keluarga',
    required: true,
  },
  {
    jenis: 'pas_foto',
    label: 'Pas Foto',
    desc: 'Latar belakang putih, tampak wajah jelas',
    required: true,
  },
  {
    jenis: 'vaksin_meningitis',
    label: 'Vaksin Meningitis',
    desc: 'Sertifikat resmi atau buku kuning',
    required: true,
  },
  {
    jenis: 'buku_nikah',
    label: 'Buku Nikah',
    desc: 'Khusus bagi jamaah suami-istri',
    required: false,
  },
  {
    jenis: 'akte_lahir',
    label: 'Akta Kelahiran',
    desc: 'Khusus bagi jamaah anak atau balita',
    required: false,
  },
];

function formatTanggalIndo(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${day} ${months[monthIdx]} ${year}`;
  }
  return dateStr;
}

function PerjalananContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { jamaah, isLoading: authLoading } = usePortalAuth();

  const [activeTab, setActiveTab] = useState('dokumen');
  const [dokumenList, setDokumenList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingJenis, setUploadingJenis] = useState(null);
  const [notification, setNotification] = useState(null);
  const [detailedBooking, setDetailedBooking] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRefs = useRef({});

  // Sinkronkan tab awal dari searchParams (?tab=keberangkatan atau ?tab=dokumen)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'keberangkatan' || tabParam === 'dokumen') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !jamaah) {
      router.replace('/portal/login');
    }
  }, [authLoading, jamaah, router]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [docsRes, bookingsRes] = await Promise.all([
        listMyDokumen().catch(() => []),
        listMyBookings().catch(() => []),
      ]);
      setDokumenList(Array.isArray(docsRes) ? docsRes : []);

      const rawBookings = Array.isArray(bookingsRes) ? bookingsRes : [];
      const activeBookings = rawBookings.filter(
        (b) => b.status !== 'batal' && b.status !== 'cancelled' && b.status !== 'draft'
      );
      setBookingsList(activeBookings);

      const bookingParam = searchParams.get('booking');
      let current = null;
      if (bookingParam) {
        current = activeBookings.find((b) => String(b.id) === String(bookingParam));
      }
      if (!current && activeBookings.length > 0) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = activeBookings.filter((b) => {
          if (!b.berangkat_tanggal) return false;
          const [y, m, d] = b.berangkat_tanggal.split('-').map(Number);
          return new Date(y, m - 1, d) >= now;
        });
        if (upcoming.length > 0) {
          upcoming.sort((a, b) => (a.berangkat_tanggal || '').localeCompare(b.berangkat_tanggal || ''));
          current = upcoming[0];
        } else {
          current = activeBookings[0];
        }
      }
      setBooking(current || null);
    } catch (err) {
      console.error('Gagal memuat data perjalanan:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (jamaah) {
      loadData();
    }
  }, [jamaah]);

  useEffect(() => {
    let isMounted = true;
    if (booking?.id) {
      setLoadingDetail(true);
      getMyBooking(booking.id)
        .then((res) => {
          if (isMounted) setDetailedBooking(res);
        })
        .catch((err) => {
          console.error('Gagal mengambil detail rombongan:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingDetail(false);
        });
    } else {
      setDetailedBooking(null);
    }
    return () => {
      isMounted = false;
    };
  }, [booking?.id]);

  const handleFileChange = async (jenis, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    // Validasi ukuran maks 5MB
    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', text: 'Ukuran file maksimal 5MB' });
      return;
    }

    try {
      setUploadingJenis(jenis);
      setNotification(null);
      await uploadMyDokumen(jenis, file);
      setNotification({ type: 'success', text: 'Dokumen berhasil diunggah' });
      await loadData();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Gagal mengunggah dokumen' });
    } finally {
      setUploadingJenis(null);
    }
  };

  if (authLoading || !jamaah) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-neutral-500 text-sm">
        Memuat...
      </div>
    );
  }

  // Hitung statistik dokumen
  const approvedDocsCount = dokumenList.filter(
    (d) => d.status === 'approved' && DOKUMEN_ITEMS.some((i) => i.jenis === d.jenis)
  ).length;

  // Hitung kesiapan keberangkatan travel
  const travelTasks = [
    {
      id: 'tiket',
      label: 'Tiket Pesawat',
      sub: booking?.maskapai_nama ? `${booking.maskapai_nama} PP terkonfirmasi` : 'Penerbangan PP terkonfirmasi',
      done: Boolean(booking?.progress_tiket),
    },
    {
      id: 'hotel',
      label: 'Hotel Makkah & Madinah',
      sub: booking?.hotel_mekkah_nama
        ? `${booking.hotel_mekkah_nama} & ${booking?.hotel_madinah_nama || 'Madinah'}`
        : 'Akomodasi hotel terkonfirmasi',
      done: Boolean(booking?.progress_hotel),
    },
    {
      id: 'visa',
      label: 'Visa Umroh',
      sub: 'Visa resmi Kementerian Haji Arab Saudi',
      done: Boolean(booking?.progress_visa),
    },
    {
      id: 'la',
      label: 'Transportasi & Ziarah',
      sub: 'Bus AC, muthawwif, dan izin (tasreh) Raudhah',
      done: Boolean(booking?.progress_land_arrangement),
    },
    {
      id: 'siskopatuh',
      label: 'Pendaftaran Kemenag',
      sub: 'Data terdaftar resmi di sistem Kemenag RI',
      done: Boolean(booking?.progress_siskopatuh),
    },
    {
      id: 'manasik',
      label: 'Bimbingan Manasik',
      sub: 'Pembekalan ibadah sebelum keberangkatan',
      done: Boolean(booking?.progress_manasik),
    },
  ];

  const travelDoneCount = travelTasks.filter((t) => t.done).length;
  const itineraryId = detailedBooking?.itinerary_id || booking?.itinerary_id;
  const paxList = (detailedBooking?.pax || []).filter((p) => p.pax_status !== 'batal');

  return (
    <div className="flex-1 pb-16">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link
            href="/portal"
            className="w-9 h-9 rounded-xl border border-neutral-200/80 bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-neutral-900 leading-tight">
              Kesiapan Perjalanan
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 truncate flex-wrap">
              <span>{booking?.jadwal_nama || booking?.paket_nama || 'Kelengkapan ibadah Anda'}</span>
              {booking?.berangkat_tanggal && (
                <span>• {formatTanggalIndo(booking.berangkat_tanggal)}</span>
              )}
              {itineraryId && (
                <button
                  type="button"
                  onClick={() => setIsItineraryOpen(true)}
                  className="text-brand font-semibold hover:underline inline-flex items-center gap-0.5 text-xs ml-1"
                >
                  <span>Lihat Itinerary</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Notifikasi / Feedback Banner */}
        {notification && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
              notification.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span>{notification.text}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2 Segmented Tabs */}
        <div className="bg-neutral-100 p-1 rounded-2xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('dokumen')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'dokumen'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>Dokumen Syarat</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'dokumen' ? 'bg-brand text-white' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {approvedDocsCount}/7
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keberangkatan')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'keberangkatan'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>Keberangkatan</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'keberangkatan' ? 'bg-brand text-white' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {travelDoneCount}/6
            </span>
          </button>
        </div>

        {/* TAB 1: DOKUMEN PERSYARATAN (Upload & Verifikasi Berkas) */}
        {activeTab === 'dokumen' && (
          <div className="space-y-2.5">

            {/* List 7 Dokumen Items */}
            <div className="space-y-2.5">
              {DOKUMEN_ITEMS.map((item) => {
                const doc = dokumenList.find((d) => d.jenis === item.jenis);
                const isApproved = doc?.status === 'approved';
                const isSubmitted = doc?.status === 'submitted';
                const isRejected = doc?.status === 'rejected';
                const isUploading = uploadingJenis === item.jenis;

                const fileFullUrl = doc?.file_url
                  ? doc.file_url.startsWith('http')
                    ? doc.file_url
                    : `${API_BASE_URL}${doc.file_url}`
                  : null;

                return (
                  <Card
                    key={item.jenis}
                    className="p-3.5 transition-all hover:border-neutral-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
                            {item.label}
                          </h2>
                          {item.required ? (
                            <span className="text-[10px] text-brand font-medium">
                              Wajib
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-400 font-medium">
                              Opsional
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1 leading-normal">
                          {item.desc}
                        </p>

                        {/* Status Badge */}
                        <div className="mt-2.5 flex items-center gap-2">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Disetujui
                            </span>
                          ) : isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <svg className="w-3 h-3 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" strokeOpacity="0.3" strokeWidth="3" />
                                <path strokeLinecap="round" d="M12 3a9 9 0 019 9" strokeWidth="3" />
                              </svg>
                              Menunggu Verifikasi
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              Perlu Diperbaiki
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-500">
                              Belum Diunggah
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tombol Aksi Upload / Ganti / Lihat */}
                      <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                        {/* Hidden input file */}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          ref={(el) => (fileInputRefs.current[item.jenis] = el)}
                          className="hidden"
                          onChange={(e) => handleFileChange(item.jenis, e)}
                        />

                        {fileFullUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewUrl(fileFullUrl)}
                            className="p-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900 transition-colors"
                            title="Lihat Berkas"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        )}

                        <Button
                          type="button"
                          variant={doc ? 'secondary' : 'primary'}
                          size="sm"
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[item.jenis]?.click()}
                          className="text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          {isUploading ? (
                            <span>Mengunggah...</span>
                          ) : doc ? (
                            <span>Ganti</span>
                          ) : (
                            <span>Upload</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: KESIAPAN KEBERANGKATAN */}
        {activeTab === 'keberangkatan' && (
          <div className="space-y-3">
            {/* Pemilih Jadwal jika jamaah punya > 1 booking */}
            {bookingsList.length > 1 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-neutral-500 block px-0.5">
                  Pilih Jadwal Keberangkatan:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                  {bookingsList.map((b) => {
                    const isSelected = booking?.id === b.id;
                    const dateFormatted = formatTanggalIndo(b.berangkat_tanggal);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBooking(b)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span>{b.jadwal_nama || b.paket_nama || `Booking #${b.id}`}</span>
                        {dateFormatted && (
                          <span
                            className={`text-[10px] font-normal ${
                              isSelected ? 'text-neutral-300' : 'text-neutral-400'
                            }`}
                          >
                            • {dateFormatted}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Card Itinerary / Rundown */}
            <div className="flex items-center justify-between p-3.5 bg-brand-light/30 border border-brand/20 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
                    Itinerary Perjalanan
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                    {itineraryId ? 'Rundown kegiatan hari demi hari' : 'Sedang disiapkan oleh pihak travel'}
                  </p>
                </div>
              </div>
              {itineraryId ? (
                <button
                  type="button"
                  onClick={() => setIsItineraryOpen(true)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:opacity-95 transition-all shadow-2xs"
                >
                  Lihat Rundown
                </button>
              ) : (
                <span className="shrink-0 text-[10px] px-2 py-1 rounded-full font-medium bg-neutral-100 text-neutral-500">
                  Belum Tersedia
                </span>
              )}
            </div>

            {/* List Kesiapan Operasional */}
            <div className="space-y-2.5">
              {travelTasks.map((task, idx) => (
                <Card key={task.id} className="p-3.5">
                  <div className="flex items-start gap-3">
                    {/* Status Circle */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                        task.done
                          ? 'bg-brand text-white shadow-2xs'
                          : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                      }`}
                    >
                      {task.done ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Konten */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
                          {task.label}
                        </h2>
                        {task.done ? (
                          <span className="text-[10px] font-semibold text-emerald-600 shrink-0">
                            Selesai
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-neutral-400 shrink-0">
                            Diproses
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-normal">
                        {task.sub}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Card Perlengkapan Tambahan */}
              <Card className="p-3.5">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                      booking?.perlengkapan_status === 'lengkap'
                        ? 'bg-brand text-white shadow-2xs'
                        : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                    }`}
                  >
                    {booking?.perlengkapan_status === 'lengkap' ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>7</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
                        Perlengkapan Ibadah
                      </h2>
                      <span className="text-[10px] font-semibold capitalize shrink-0 text-neutral-700">
                        {booking?.perlengkapan_status || 'Belum Diambil'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-normal">
                      Koper, kain ihram/mukena, tas, dan seragam
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Card Daftar Rombongan Jamaah */}
            {paxList.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between px-0.5">
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                    Daftar Rombongan ({paxList.length} Jamaah)
                  </h3>
                  {booking?.id_booking && (
                    <span className="text-[10px] font-mono text-neutral-400">
                      {booking.id_booking}
                    </span>
                  )}
                </div>

                <Card className="divide-y divide-neutral-100 overflow-hidden">
                  {paxList.map((pax, idx) => (
                    <div key={pax.id || idx} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                            {pax.nama_jamaah || pax.nama_lengkap || 'Jamaah'}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-500">
                            <span className="capitalize">{pax.pax_type || 'Dewasa'}</span>
                            {pax.room_type && (
                              <>
                                <span>•</span>
                                <span className="capitalize">Kamar {pax.room_type}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Terdaftar
                      </span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Preview File */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3.5 border-b border-neutral-100 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900">
                Pratinjau Dokumen
              </span>
              <button
                onClick={() => setPreviewUrl(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-neutral-50">
              {previewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-96 rounded-xl border border-neutral-200" title="Dokumen PDF" />
              ) : (
                <img src={previewUrl} alt="Dokumen" className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-xs" />
              )}
            </div>
            <div className="p-3 bg-white border-t border-neutral-100 flex justify-end gap-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Buka Tab Baru
              </a>
              <Button size="sm" variant="primary" onClick={() => setPreviewUrl(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Itinerary */}
      <ItineraryModal
        itineraryId={itineraryId}
        isOpen={isItineraryOpen}
        onClose={() => setIsItineraryOpen(false)}
      />
    </div>
  );
}

export default function PortalPerjalananPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 text-neutral-500 text-sm">
          Memuat...
        </div>
      }
    >
      <PerjalananContent />
    </Suspense>
  );
}
