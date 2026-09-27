'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { getAgenStatus } from '@/lib/portalApi';
import { getPublicSchedules, getPublicBankAccounts } from '@/lib/api';
import { formatRupiah } from '@/lib/portalFormat';
import BookingWizard from '@/components/booking/BookingWizard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';

// Booking online ditutup H-14 keberangkatan (sama dengan booking publik).
function lewatCutoff(tanggal) {
  if (!tanggal) return true;
  const dep = new Date(`${String(tanggal).slice(0, 10)}T00:00:00`).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((dep - today) / 86400000) < 14;
}

const formatTanggal = (tanggal) =>
  tanggal ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${String(tanggal).slice(0, 10)}T00:00:00`)) : '-';

// Screen A5 — agen membuat booking untuk jamaahnya (Jalur 1). Pilih jadwal,
// lalu isi manifest dengan BookingWizard mode agen.
export default function BookingAgenPage() {
  const router = useRouter();
  const { brandId, brandName, brandColor, brandWhatsapp } = useBrand();
  const { jamaah, isLoading } = usePortalAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    if (!isLoading && !jamaah) router.replace('/portal/login');
  }, [isLoading, jamaah, router]);

  useEffect(() => {
    if (!jamaah) return;
    getAgenStatus()
      .then((s) => {
        if (s.status_agen !== 'aktif') {
          router.replace('/portal/syiar');
          return;
        }
        return Promise.all([getPublicSchedules(brandId), getPublicBankAccounts(brandId)]).then(([list, banks]) => {
          setSchedules((list || []).filter((it) => !lewatCutoff(it.berangkat_tanggal) && it.seat_sisa > 0));
          setBankAccounts(banks || []);
          setReady(true);
        });
      })
      .catch((err) => setError(err.message));
  }, [jamaah, brandId, router]);

  const pilihJadwal = async (id) => {
    setLoadingSchedule(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/${id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal memuat detail paket');
      setSchedule(await res.json());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSchedule(false);
    }
  };

  if (isLoading || !jamaah || (!ready && !error)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-neutral-500 font-medium">
        Memuat...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3.5">
      <div className="flex items-center gap-2.5 pb-1">
        {schedule ? (
          <button
            type="button"
            onClick={() => setSchedule(null)}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors shrink-0 cursor-pointer"
            aria-label="Ganti paket"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <Link
            href="/portal/syiar"
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors shrink-0"
            aria-label="Kembali ke Syiar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <div>
          <h1 className="text-sm sm:text-base font-bold text-neutral-900">Buat Booking</h1>
          <p className="text-[11px] sm:text-xs text-neutral-500">{schedule ? schedule.jadwal_nama : 'Pilih paket untuk jamaah Anda'}</p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 text-xs sm:text-sm">{error}</div>
      )}

      {schedule ? (
        <BookingWizard
          schedule={schedule}
          brandName={brandName}
          brandColor={brandColor}
          brandId={Number(brandId)}
          brandWhatsapp={brandWhatsapp}
          initialBankAccounts={bankAccounts}
          travelAccounts={bankAccounts}
          agenMode
        />
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Booking dibuat atas nama jamaah (bukan Anda). Admin {brandName} menindaklanjuti pembayarannya, dan komisi masuk setelah booking lunas.
          </p>
          {schedules.length === 0 && (
            <div className="p-4 rounded-2xl border border-neutral-200 bg-white text-sm text-neutral-500 text-center">
              Belum ada paket yang bisa dibooking online saat ini.
            </div>
          )}
          {schedules.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={loadingSchedule}
              onClick={() => pilihJadwal(s.id)}
              className="w-full text-left bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 space-y-1.5 hover:border-neutral-300 transition-colors cursor-pointer disabled:opacity-60"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-neutral-900">{s.jadwal_nama}</span>
                <span className="text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full shrink-0">
                  {formatTanggal(s.berangkat_tanggal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-600">
                <span>Mulai {formatRupiah(s.harga_quad)}</span>
                <span>Sisa {s.seat_sisa} kursi</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
