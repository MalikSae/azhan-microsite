'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomeAppFlashSale({ brandWhatsapp = '', promoSchedule = null }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 48,
    seconds: 35
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 2, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDigit = (num) => String(num).padStart(2, '0');

  const waTarget = brandWhatsapp
    ? `https://wa.me/${brandWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Assalamu\'alaikum, saya ingin klaim Diskon Early Bird Umroh. Mohon info kuota kursinya.')}`
    : '/paket?promo=1';

  return (
    <div className="w-full px-4">
      <div className="w-full p-4 rounded-2xl bg-brand-soft border border-brand/20 flex flex-col gap-2.5 relative overflow-hidden">
        {/* Header Row: Tag & Timer */}
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[9.5px] font-black uppercase tracking-wider shadow-2xs">
            <span>PROMO SPESIAL</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-white/90 border border-brand/20 px-2 py-0.5 rounded-lg tabular-nums">
            <span className="text-neutral-400 text-[9.5px]">Sisa:</span>
            <span>{formatDigit(timeLeft.hours)}j : {formatDigit(timeLeft.minutes)}m : {formatDigit(timeLeft.seconds)}d</span>
          </div>
        </div>

        {/* Content & CTA Row */}
        <div className="w-full flex justify-between items-center gap-3 pt-0.5">
          <div className="flex flex-col min-w-0 pr-1">
            <h3 className="text-[14px] text-neutral-900 font-extrabold leading-snug">
              Diskon Early Bird Musim 1448 H
            </h3>
            <p className="text-[11px] text-neutral-600 font-medium leading-tight mt-0.5">
              Potongan hingga <strong className="text-rose-600 font-extrabold">Rp 2.500.000</strong> / jamaah
            </p>
          </div>

          <Link
            href={waTarget}
            target={brandWhatsapp ? '_blank' : '_self'}
            rel={brandWhatsapp ? 'noopener noreferrer' : undefined}
            className="shrink-0 px-3.5 py-2 bg-brand hover:brightness-105 active:scale-95 text-white rounded-xl font-bold text-[11.5px] transition-all shadow-2xs"
          >
            Klaim WA
          </Link>
        </div>
      </div>
    </div>
  );
}
