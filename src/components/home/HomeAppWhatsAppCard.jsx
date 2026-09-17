'use client';

import React from 'react';
import Link from 'next/link';

export default function HomeAppWhatsAppCard({
  brandWhatsapp = '',
  brandName = 'Travel Umroh'
}) {
  const cleanNumber = brandWhatsapp ? brandWhatsapp.replace(/[^0-9]/g, '') : '';
  const waTarget = cleanNumber
    ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Assalamu'alaikum, saya ingin konsultasi rekomendasi paket umroh terbaik di ${brandName}.`)}`
    : '#';

  return (
    <div className="w-full px-4">
      <div className="w-full p-4 bg-neutral-50 border border-neutral-200/70 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider">Konsultan Online</span>
          </div>
          <h3 className="text-[14px] text-neutral-900 font-extrabold leading-snug">
            Butuh Rekomendasi Paket?
          </h3>
          <p className="text-[11px] text-neutral-500 font-medium leading-relaxed mt-0.5">
            Konsultasi gratis jadwal, hotel &amp; biaya via WhatsApp.
          </p>
        </div>

        <Link
          href={waTarget}
          target={cleanNumber ? '_blank' : '_self'}
          rel={cleanNumber ? 'noopener noreferrer' : undefined}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-[11.5px] transition-all shadow-2xs"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 fill-current shrink-0"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.08L2 22l5.08-1.34C8.52 21.52 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm.08 17.5c-1.5 0-2.92-.4-4.14-1.12l-.3-.18-3.04.8.81-2.96-.2-.31C4.46 14.52 4 13.3 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-7.92 8z" />
          </svg>
          <span className="whitespace-nowrap">Chat WA</span>
        </Link>
      </div>
    </div>
  );
}
