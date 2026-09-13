'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { useBrand } from '@/context/BrandContext';
import {
  listMyBookings,
  listMyPayments,
  listPaymentAccounts,
  uploadPortalMedia,
  submitPaymentConfirmation,
} from '@/lib/portalApi';
import { formatRupiah, formatTanggalIndo } from '@/lib/portalFormat';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import CustomDropdown from '@/components/ui/CustomDropdown';

export default function PortalPembayaranPage() {
  const router = useRouter();
  const { jamaah, isLoading: isAuthLoading } = usePortalAuth();
  const { brandName, brandColor, brandWhatsapp } = useBrand();

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';

  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);

  // Modal Konfirmasi Pembayaran State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    bankAccountId: '',
    jumlah: '',
    senderName: '',
    senderBank: '',
    notes: '',
  });
  const [fileBukti, setFileBukti] = useState(null);
  const [previewBukti, setPreviewBukti] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !jamaah) {
      router.replace('/portal/login');
    }
  }, [isAuthLoading, jamaah, router]);

  const loadData = async () => {
    if (!jamaah) return;
    setLoading(true);
    setHasError(false);

    try {
      const [bookingsRes, accountsRes] = await Promise.all([
        listMyBookings(),
        listPaymentAccounts().catch(() => []),
      ]);

      const bookings = Array.isArray(bookingsRes) ? bookingsRes : [];
      const activeBookings = bookings.filter(
        (b) => b.status !== 'batal' && b.status !== 'cancelled' && b.status !== 'draft'
      );

      const currentBooking = activeBookings[0] || null;
      setSelectedBooking(currentBooking);
      setBankAccounts(Array.isArray(accountsRes) ? accountsRes : []);

      if (currentBooking && currentBooking.id) {
        try {
          const paymentsRes = await listMyPayments(currentBooking.id);
          setPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
        } catch (e) {
          console.error('Gagal memuat payments:', e);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data pembayaran portal:', err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [jamaah]);

  const handleCopy = (text, key) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Ukuran file maksimal 5MB');
        return;
      }
      setFileBukti(file);
      setSubmitError(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewBukti(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = () => {
    setModalForm({
      bankAccountId: bankAccounts[0]?.id ? String(bankAccounts[0].id) : '',
      jumlah: sisaTagihan > 0 ? String(sisaTagihan) : '',
      senderName: jamaah?.nama_lengkap || '',
      senderBank: '',
      notes: '',
    });
    setFileBukti(null);
    setPreviewBukti(null);
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsModalOpen(true);
  };

  // Perhitungan Keuangan
  const totalHarga = Number(selectedBooking?.total_harga) || 0;
  const totalDibayar = payments
    .filter((p) => p.status === 'confirmed' || p.status === 'verified')
    .reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const pendingBayar = payments
    .filter((p) => p.status === 'pending')
    .reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const sisaTagihan = Math.max(0, totalHarga - totalDibayar);
  const percentPaid = totalHarga > 0 ? Math.min(100, Math.round((totalDibayar / totalHarga) * 100)) : 0;

  const isLunas = sisaTagihan === 0 && totalHarga > 0;
  const isDPTerkonfirmasi = totalDibayar > 0 && !isLunas;
  const isMenungguDP = totalDibayar === 0 && !isLunas;

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedBooking?.id) return;
    if (!modalForm.bankAccountId) {
      setSubmitError('Pilih rekening tujuan transfer');
      return;
    }
    const cleanJumlah = Number(String(modalForm.jumlah).replace(/\D/g, ''));
    if (!cleanJumlah || cleanJumlah <= 0) {
      setSubmitError('Nominal pembayaran wajib diisi');
      return;
    }
    if (sisaTagihan > 0 && cleanJumlah > sisaTagihan) {
      setSubmitError(`Nominal pembayaran tidak boleh melebihi sisa tagihan (${formatRupiah(sisaTagihan)})`);
      return;
    }
    if (!modalForm.senderName.trim()) {
      setSubmitError('Nama pemilik rekening pengirim wajib diisi');
      return;
    }
    if (!fileBukti) {
      setSubmitError('Wajib mengunggah foto / file bukti transfer');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const uploadedUrl = await uploadPortalMedia(fileBukti);
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        bank_account_id: Number(modalForm.bankAccountId),
        jumlah: cleanJumlah,
        sender_name: modalForm.senderName.trim(),
        sender_bank: modalForm.senderBank.trim() || undefined,
        bukti_url: uploadedUrl,
        tanggal: today,
        metode: 'transfer',
        notes: modalForm.notes.trim() || undefined,
      };

      await submitPaymentConfirmation(selectedBooking.id, payload);
      setSubmitSuccess(true);
      await loadData();
    } catch (err) {
      setSubmitError(err.message || 'Gagal mengirim konfirmasi pembayaran. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-neutral-500 font-medium">
        Memuat data pembayaran...
      </div>
    );
  }

  if (hasError || !selectedBooking) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <Link
            href="/portal"
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-neutral-900">Status Pembayaran</h1>
        </div>
        <EmptyState
          title="Belum Ada Tagihan Aktif"
          description="Anda belum memiliki pendaftaran paket umroh yang aktif saat ini."
          actionText="Kembali ke Beranda"
          onAction={() => router.push('/portal')}
        />
      </div>
    );
  }

  const bookingCode = selectedBooking.id_booking || selectedBooking.booking_code || '';

  // WhatsApp template link
  const waNomor = (brandWhatsapp || '').replace(/[^0-9]/g, '');
  const waText = encodeURIComponent(
    `Halo Admin ${brandName}, saya ingin konfirmasi pembayaran untuk:\n` +
      `• Kode Booking: ${bookingCode || '-'}\n` +
      `• Paket: ${selectedBooking.jadwal_nama || selectedBooking.schedule_name || '-'}\n` +
      `• Nama Jamaah: ${jamaah?.nama_lengkap || '-'}\n` +
      `• Sisa Tagihan: ${formatRupiah(sisaTagihan)}\n\n` +
      `Mohon bantuannya untuk verifikasi pembayaran. Terima kasih.`
  );
  const waUrl = waNomor ? `https://wa.me/${waNomor}?text=${waText}` : null;

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3.5">
      {/* 1. Header Topbar Mobile */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/portal"
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors shrink-0"
            title="Kembali ke Beranda Portal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">
              Status Pembayaran
            </h1>
            {bookingCode && (
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                Kode Booking: <span className="font-mono font-semibold text-neutral-700">#{bookingCode}</span>
              </p>
            )}
          </div>
        </div>

        <div>
          {isLunas ? (
            <Badge variant="success">Lunas</Badge>
          ) : isDPTerkonfirmasi ? (
            <Badge variant="neutral">DP Terkonfirmasi</Badge>
          ) : (
            <Badge variant="warning">Menunggu DP</Badge>
          )}
        </div>
      </div>

      {/* 2. Unified Statement Sheet (Satu Lembar Tagihan Terpadu) */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
        {/* Section A: Sisa Tagihan & Progress */}
        <div className="p-4 sm:p-5 space-y-3 bg-gradient-to-b from-neutral-50/70 to-white">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Sisa Tagihan
              </span>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-0.5">
                {formatRupiah(sisaTagihan)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Progress
              </span>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                {percentPaid}% Terbayar
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${percentPaid}%` }}
            />
          </div>

          {/* Breakdown Ringkas */}
          <div className="flex justify-between items-center text-xs text-neutral-600 pt-0.5">
            <span>
              Total: <strong className="text-neutral-900 font-mono font-semibold">{formatRupiah(totalHarga)}</strong>
            </span>
            <span>
              Telah Diverifikasi: <strong className="text-emerald-700 font-mono font-bold">{formatRupiah(totalDibayar)}</strong>
            </span>
          </div>

          {/* Pending Bayar Notice */}
          {pendingBayar > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2 text-xs text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>
                Sedang memproses verifikasi sebesar <strong>{formatRupiah(pendingBayar)}</strong>.
              </span>
            </div>
          )}

          {isLunas && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-800">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Alhamdulillah! Seluruh tagihan paket Anda telah lunas.</span>
            </div>
          )}
        </div>

        {/* Garis Pembatas Halus Seperti Slip Tagihan */}
        <div className="px-4 py-0.5 bg-white">
          <div className="w-full border-t border-dashed border-neutral-200" />
        </div>

        {/* Section B: Rekening Transfer Resmi (Flat List Rapi, Tanpa Kotak Border) */}
        <div className="p-4 sm:p-5 pt-3 pb-3 space-y-2 bg-white">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
              Rekening Resmi Pembayaran
            </span>
          </div>

          <div className="divide-y divide-neutral-100">
            {bankAccounts && bankAccounts.length > 0 ? (
              bankAccounts.map((acc, i) => {
                const accLogo = acc.logo_url
                  ? (acc.logo_url.startsWith('http') ? acc.logo_url : `${apiBaseUrl}${acc.logo_url}`)
                  : null;

                return (
                  <div
                    key={acc.id || i}
                    className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {accLogo ? (
                        <div className="w-12 h-7 sm:w-14 sm:h-8 bg-white border border-neutral-200/80 rounded-lg p-1 flex items-center justify-center shrink-0 shadow-2xs">
                          <img
                            src={accLogo}
                            alt={acc.bank_name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white text-[9px] font-bold uppercase tracking-wider shrink-0">
                          {acc.bank_name}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-mono font-bold text-sm sm:text-base text-neutral-900 tracking-wide select-all truncate block leading-tight">
                          {acc.account_number}
                        </span>
                        <p className="text-[11px] text-neutral-500 font-medium mt-0.5 truncate leading-tight">
                          a.n. {acc.account_holder}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(acc.account_number, `acc-${i}`)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10.5px] font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      {copiedKey === `acc-${i}` ? (
                        <span className="text-emerald-700 font-bold">Tersalin!</span>
                      ) : (
                        <span>Salin</span>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-2 text-xs text-neutral-400 text-center">
                Rekening resmi travel belum diatur.
              </div>
            )}
          </div>
        </div>

        {/* Section C: Aksi Pembayaran Langsung di dalam Sheet */}
        <div className="p-4 sm:p-5 pt-3 pb-4 bg-neutral-50/70 border-t border-neutral-100 space-y-2">
          {!isLunas && (
            <button
              type="button"
              onClick={handleOpenModal}
              className="w-full py-2.5 px-4 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Konfirmasi Pembayaran Mandiri</span>
            </button>
          )}

          <div className="flex gap-2">
            {waUrl && !isLunas && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl border border-emerald-600/30 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold text-center transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span>Konfirmasi via WA</span>
              </a>
            )}

            <Link
              href={bookingCode ? `/invoice/${bookingCode}` : '#'}
              className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Invoice Resmi</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Riwayat Transaksi Pembayaran (Flat Activity List, Ringan & Tanpa Kotak Bertumpuk) */}
      <div className="space-y-1.5 pt-1 px-1">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Riwayat Transaksi
          </h2>
          <span className="text-[11px] font-medium text-neutral-400">
            {payments.length} transaksi
          </span>
        </div>

        {payments.length > 0 ? (
          <div className="divide-y divide-neutral-100 bg-white rounded-2xl border border-neutral-200/80 px-3.5 py-1 shadow-2xs">
            {payments.map((p, idx) => {
              const isConfirmed = p.status === 'confirmed' || p.status === 'verified';
              const isPending = p.status === 'pending';
              const isRejected = p.status === 'rejected';

              return (
                <div key={p.id || idx} className="py-2.5 first:pt-2 last:pb-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-neutral-900 font-mono">
                      {formatRupiah(p.jumlah)}
                    </span>
                    <div>
                      {isConfirmed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          Terverifikasi
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                          Menunggu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                          Ditolak
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>
                      {p.tanggal ? formatTanggalIndo(p.tanggal) : (p.created_at ? formatTanggalIndo(p.created_at) : '-')}
                      {p.metode ? ` • ${p.metode.toUpperCase()}` : ''}
                    </span>
                    {p.sender_name && (
                      <span className="text-neutral-500 font-medium">dari {p.sender_name}</span>
                    )}
                  </div>

                  {isRejected && p.rejection_reason && (
                    <div className="p-2 rounded-lg bg-rose-50 text-[11px] text-rose-700 border border-rose-200/70 mt-1">
                      <strong>Alasan penolakan:</strong> {p.rejection_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-2.5 text-center text-xs text-neutral-400">
            Belum ada catatan transaksi pembayaran.
          </div>
        )}
      </div>

      {/* 4. Modal Konfirmasi Pembayaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4.5 space-y-3.5 shadow-2xl border border-neutral-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">
                Konfirmasi Pembayaran
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-neutral-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-900">Bukti Berhasil Dikirim</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Pembayaran Anda sedang dalam antrean verifikasi tim finance. Status akan diperbarui dalam 1x24 jam.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2 px-4 rounded-xl bg-neutral-900 text-white text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-3 text-xs">
                {submitError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-[11.5px]">
                    {submitError}
                  </div>
                )}

                {/* Pilih Rekening Tujuan */}
                <CustomDropdown
                  label="Rekening Tujuan"
                  required
                  placeholder="Pilih Rekening Travel"
                  value={modalForm.bankAccountId}
                  onChange={(val) => setModalForm({ ...modalForm, bankAccountId: val })}
                  options={bankAccounts.map((b) => ({
                    value: b.id,
                    label: `${b.bank_name} - ${b.account_number}`,
                    sublabel: `a.n. ${b.account_holder}`,
                    logoUrl: b.logo_url
                      ? b.logo_url.startsWith('http')
                        ? b.logo_url
                        : `${apiBaseUrl}${b.logo_url}`
                      : null,
                  }))}
                />

                {/* Nominal */}
                {(() => {
                  const cleanModalJumlah = Number(String(modalForm.jumlah || '').replace(/\D/g, ''));
                  const isOverpaid = sisaTagihan > 0 && cleanModalJumlah > sisaTagihan;
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-neutral-700 block">
                          Nominal *
                        </label>
                        {sisaTagihan > 0 && (
                          <button
                            type="button"
                            onClick={() => setModalForm({ ...modalForm, jumlah: String(sisaTagihan) })}
                            className="text-[11px] font-semibold text-neutral-600 hover:text-brand px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            Bayar Penuh
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={modalForm.jumlah ? formatRupiah(modalForm.jumlah) : ''}
                        onChange={(e) => {
                          const num = e.target.value.replace(/\D/g, '');
                          setModalForm({ ...modalForm, jumlah: num });
                        }}
                        placeholder="Rp 0"
                        className={`w-full px-3 py-2 rounded-xl border font-mono font-semibold focus:outline-hidden transition-colors ${
                          isOverpaid
                            ? 'border-red-500 bg-red-50/40 text-red-900 focus:border-red-500'
                            : 'border-neutral-300 text-neutral-900 focus:border-brand'
                        }`}
                        required
                      />
                      {isOverpaid && (
                        <p className="text-[11px] font-semibold text-red-600 mt-1">
                          Maks. {formatRupiah(sisaTagihan)}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Nama Pengirim */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">
                    Nama Pengirim *
                  </label>
                  <input
                    type="text"
                    value={modalForm.senderName}
                    onChange={(e) => setModalForm({ ...modalForm, senderName: e.target.value })}
                    placeholder="Nama pemilik rekening"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-hidden focus:border-brand"
                    required
                  />
                </div>

                {/* Bank Pengirim */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">
                    Bank Pengirim (Opsional)
                  </label>
                  <input
                    type="text"
                    value={modalForm.senderBank}
                    onChange={(e) => setModalForm({ ...modalForm, senderBank: e.target.value })}
                    placeholder="BCA / Mandiri / BSI / Lainnya"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-hidden focus:border-brand"
                  />
                </div>

                {/* Upload Bukti */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">
                    Bukti Transfer *
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="w-full text-[11px] text-neutral-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer"
                    required
                  />
                  {previewBukti && (
                    <div className="mt-2 relative rounded-lg overflow-hidden border border-neutral-200 max-h-32 flex items-center justify-center bg-neutral-50">
                      <img src={previewBukti} alt="Preview Bukti" className="object-contain max-h-32" />
                    </div>
                  )}
                </div>

                {/* Tombol Simpan */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  {(() => {
                    const cleanModalJumlah = Number(String(modalForm.jumlah || '').replace(/\D/g, ''));
                    const isOverpaid = sisaTagihan > 0 && cleanModalJumlah > sisaTagihan;
                    return (
                      <button
                        type="submit"
                        disabled={submitting || isOverpaid || cleanModalJumlah <= 0}
                        className={`flex-1 py-2 rounded-xl bg-brand text-white font-bold transition-all ${
                          submitting || isOverpaid || cleanModalJumlah <= 0
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:opacity-90 cursor-pointer'
                        }`}
                      >
                        {submitting ? 'Mengunggah...' : 'Kirim Bukti'}
                      </button>
                    );
                  })()}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
