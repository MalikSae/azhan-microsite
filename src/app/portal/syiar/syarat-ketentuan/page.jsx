'use client';

import React from 'react';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';

// Ringkasan ketentuan program berdasarkan agen-azhan.md. DRAF: teks resmi
// Syarat & Ketentuan Agen harus disediakan/ditinjau tim bisnis & legal.
export default function SyaratKetentuanAgenPage() {
  const { brandName } = useBrand();
  const poin = [
    'Pengajuan agen ditinjau dan disetujui oleh admin travel.',
    'Biaya pendaftaran agen (jika ada) tidak dapat dikembalikan, termasuk bila pengajuan tidak disetujui.',
    'Komisi dihitung per jamaah yang Anda ajak dan baru tercatat setelah pembayaran paketnya lunas.',
    'Komisi dapat dicairkan setelah tanggal keberangkatan paket sumbernya, dengan minimal pencairan Rp500.000.',
    'Selama akun agen dinonaktifkan, Anda tidak menerima komisi jenis apa pun dan komisi pada periode tersebut tidak dibayarkan kemudian.',
    'Komisi yang sudah tercatat tidak dibatalkan meskipun booking kemudian dibatalkan.',
  ];
  return (
    <div className="flex-1 flex flex-col p-4 space-y-3.5">
      <div className="flex items-center gap-2.5 pb-1">
        <Link
          href="/portal/syiar/kelengkapan-agen"
          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors shrink-0"
          aria-label="Kembali"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-sm sm:text-base font-bold text-neutral-900">Syarat & Ketentuan Agen</h1>
      </div>
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
        <p className="text-xs sm:text-sm text-neutral-600">Ketentuan utama program Agen Syiar {brandName}:</p>
        <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          {poin.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
