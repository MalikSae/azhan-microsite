'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAgenDashboard } from '@/lib/portalApi';
import { formatRupiah } from '@/lib/portalFormat';
import KomisiItem from './KomisiItem';

// Screen A3 — ringkasan agen aktif: saldo tersedia & tertahan dipisah (D6),
// kredit cashback terpisah karena hanya untuk potongan booking (D4).
export default function DashboardAgen() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAgenDashboard().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="text-xs text-danger-700">{error}</p>;
  }
  if (!data) {
    return <p className="text-xs text-neutral-500">Memuat ringkasan komisi...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-success-50 border border-success-200">
            <p className="text-[11px] text-success-700 font-semibold">Saldo tersedia</p>
            <p className="mt-0.5 text-sm sm:text-base font-bold text-neutral-900 font-mono">{formatRupiah(data.saldo_tersedia)}</p>
          </div>
          <div className="p-3 rounded-xl bg-warning-50 border border-warning-200">
            <p className="text-[11px] text-warning-800 font-semibold">Saldo tertahan</p>
            <p className="mt-0.5 text-sm sm:text-base font-bold text-neutral-900 font-mono">{formatRupiah(data.saldo_tertahan)}</p>
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 leading-relaxed">
          Komisi tertahan menjadi tersedia setelah jamaahnya berangkat.
        </p>
        {data.kredit_cashback > 0 && (
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-neutral-600 font-semibold">Kredit cashback</p>
              <p className="text-[11px] text-neutral-500">Hanya untuk potongan booking berikutnya</p>
            </div>
            <span className="text-sm font-bold text-neutral-900 font-mono">{formatRupiah(data.kredit_cashback)}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5 text-center">
          <div className="p-2.5 rounded-xl border border-neutral-200/80">
            <p className="text-base font-bold text-neutral-900">{data.jumlah_closing}</p>
            <p className="text-[11px] text-neutral-500">Jamaah saya</p>
          </div>
          <div className="p-2.5 rounded-xl border border-neutral-200/80">
            <p className="text-base font-bold text-neutral-900">{data.jumlah_downline}</p>
            <p className="text-[11px] text-neutral-500">Agen rekrutan</p>
          </div>
        </div>
        <Link
          href="/portal/syiar/booking-baru"
          className="block w-full py-2.5 px-4 rounded-xl bg-brand text-white text-sm font-bold text-center shadow-xs hover:opacity-95 transition-all"
        >
          Buat Booking untuk Jamaah
        </Link>
        <Link
          href="/portal/syiar/pencairan"
          className="block w-full py-2.5 px-4 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold text-center hover:bg-neutral-50 transition-all"
        >
          Tarik Saldo
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">Komisi terbaru</h2>
          <Link href="/portal/syiar/riwayat-komisi" className="text-xs font-semibold text-brand">
            Lihat semua
          </Link>
        </div>
        {data.komisi_terbaru.length === 0 ? (
          <p className="text-xs text-neutral-500">Belum ada komisi. Komisi tercatat saat booking jamaah Anda lunas.</p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {data.komisi_terbaru.map((k) => <KomisiItem key={k.id} item={k} />)}
          </div>
        )}
      </div>
    </div>
  );
}
