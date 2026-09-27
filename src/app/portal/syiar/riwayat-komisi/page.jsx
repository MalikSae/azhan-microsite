'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { listKomisiAgen } from '@/lib/portalApi';
import KomisiItem from '../KomisiItem';

const PAGE = 30;

// Screen A6 — riwayat transaksi komisi milik agen (read-only).
export default function RiwayatKomisiPage() {
  const router = useRouter();
  const { jamaah, isLoading } = usePortalAuth();
  const [items, setItems] = useState([]);
  const [habis, setHabis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading && !jamaah) router.replace('/portal/login');
  }, [isLoading, jamaah, router]);

  const muat = useCallback(async (offset) => {
    setLoading(true);
    try {
      const data = await listKomisiAgen({ limit: PAGE, offset });
      setItems((prev) => (offset === 0 ? data : [...prev, ...data]));
      setHabis(data.length < PAGE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (jamaah) muat(0);
  }, [jamaah, muat]);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3.5">
      <div className="flex items-center gap-2.5 pb-1">
        <Link
          href="/portal/syiar"
          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors shrink-0"
          aria-label="Kembali ke Syiar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-neutral-900">Riwayat Komisi</h1>
          <p className="text-[11px] sm:text-xs text-neutral-500">Komisi tercatat saat booking jamaah lunas</p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 text-xs sm:text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs px-4 sm:px-5 py-1.5">
        {items.length === 0 && !loading && !error && (
          <p className="py-4 text-xs text-neutral-500 text-center">Belum ada komisi.</p>
        )}
        <div className="divide-y divide-neutral-100">
          {items.map((k) => <KomisiItem key={k.id} item={k} />)}
        </div>
        {loading && <p className="py-3 text-xs text-neutral-500 text-center">Memuat...</p>}
      </div>

      {!habis && !loading && items.length > 0 && (
        <button
          type="button"
          onClick={() => muat(items.length)}
          className="w-full py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 cursor-pointer"
        >
          Muat lebih banyak
        </button>
      )}
    </div>
  );
}
