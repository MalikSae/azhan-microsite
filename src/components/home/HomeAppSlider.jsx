'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const DEFAULT_SLIDES = [
  {
    id: 1,
    badge: 'RESMI KEMENAG RI',
    headline: 'Umroh Nyaman & Pasti Berangkat',
    subtitle: 'Hotel Dekat Masjid • Maskapai Bintang 5 • Bimbingan Sunnah',
    ctaText: 'Pilih Paket Umroh',
    ctaHref: '/paket',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    alt: 'Ibadah Umroh di Depan Kaaba'
  },
  {
    id: 2,
    badge: 'PROMO AWAL MUSIM 1448 H',
    headline: 'Diskon Spesial Hingga Rp 2,5 Jt',
    subtitle: 'Tersedia Paket Reguler 9 & 12 Hari serta Umroh Plus Turki',
    ctaText: 'Lihat Promo Spesial',
    ctaHref: '/paket?promo=1',
    imageUrl: 'https://images.unsplash.com/photo-1758650442617-ce74d82cfd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    alt: 'Masjidil Haram Makkah'
  },
  {
    id: 3,
    badge: 'DIRECT SAUDIA & GARUDA',
    headline: 'Penerbangan Direct',
    subtitle: 'Fasilitas Kereta Cepat Haramain Makkah-Madinah 2 Jam',
    ctaText: 'Cek Jadwal & Kuota',
    ctaHref: '/paket',
    imageUrl: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    alt: 'Masjid Nabawi Madinah'
  }
];

export default function HomeAppSlider({ slides = DEFAULT_SLIDES, brandWhatsapp = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideList = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const timerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideList.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slideList.length, isPaused]);

  return (
    <div
      className="w-full px-4 pt-3 flex flex-col gap-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ━━━ Hero Banner Slider ━━━ */}
      <div className="w-full h-[180px] shrink-0 relative rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-100 shadow-2xs">
        <div
          className="flex w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slideList.map((slide, idx) => (
            <div key={slide.id || idx} className="w-full h-full shrink-0 relative flex flex-col justify-between p-[16px]">
              {/* Background Image with Deep Overlay for High Contrast Text */}
              <img
                src={slide.imageUrl}
                alt={slide.alt || `Promo Slide ${idx + 1}`}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/70 to-[#0A0D14]/40" />

              {/* Slide Content Layer */}
              <div className="relative z-10 w-full flex flex-col items-start gap-1">
                {/* Badge */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[8.5px] font-black text-white uppercase tracking-wider shadow-2xs">
                  {slide.badge}
                </div>

                {/* Headline */}
                <h2 className="text-[16px] font-black text-white leading-tight mt-1 max-w-[280px] drop-shadow-sm">
                  {slide.headline}
                </h2>

                {/* Subheadline */}
                <p className="text-[10px] text-[#E2E8F0] font-medium leading-relaxed max-w-[270px] drop-shadow-xs line-clamp-1">
                  {slide.subtitle}
                </p>
              </div>

              {/* CTA Row */}
              <div className="relative z-10 w-full flex justify-between items-center pt-1">
                <Link
                  href={slide.ctaHref || '/paket'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand text-white text-[10.5px] font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>{slide.ctaText}</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                <div className="text-[9px] text-white/70 font-medium">
                  {idx + 1} / {slideList.length}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━ Carousel Indicator Dots ━━━ */}
      <div className="box-border w-full h-fit shrink-0 flex flex-row gap-[5px] justify-center items-center">
        {slideList.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Pindah ke banner promosi ${idx + 1}`}
            className={`transition-all duration-300 rounded-full h-[5px] cursor-pointer ${
              idx === currentIndex
                ? 'w-[20px] bg-brand'
                : 'w-[5px] bg-[#D1D5DB] hover:bg-neutral-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
