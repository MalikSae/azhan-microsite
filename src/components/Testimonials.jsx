'use client';

import React, { useState, useEffect } from 'react';

export default function Testimonials({ brandName = 'Travel Umroh' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const reviews = [
    {
      name: 'H. Bambang S.',
      origin: 'Jakarta',
      text: 'Alhamdulillah perjalanan umroh sangat khusyuk. Muthawif ramah, sabar membimbing, dan hotel di Makkah benar-benar dekat ke pelataran Masjidil Haram sehingga ibadah terasa tenang.',
      package: 'Umroh 9 Hari Reguler',
      rating: 5,
      date: 'Jan 2026'
    },
    {
      name: 'Hj. Siti Rahmah',
      origin: 'Surabaya',
      text: 'Pelayanan tim sangat responsif dari mulai pendaftaran, kelengkapan dokumen, manasik, sampai kepulangan kembali ke tanah air. Semua fasilitas sesuai dengan yang dijanjikan.',
      package: 'Umroh Syawal Promo',
      rating: 5,
      date: 'Feb 2026'
    },
    {
      name: 'dr. H. Hendra W.',
      origin: 'Bandung',
      text: 'Pengalaman pertama umroh bersama keluarga besar sangat berkesan. Pembagian kamar hotel rapi, makanan katering cocok dengan lidah Indonesia, dan bus ziarah sangat nyaman.',
      package: 'Umroh VIP Plus Turki',
      rating: 5,
      date: 'Des 2025'
    },
    {
      name: 'Hj. Nurul Aisyah',
      origin: 'Medan',
      text: 'Bimbingan manasik sebelum berangkat sangat detail. Selama di Madinah dan Makkah selalu didampingi muthawif yang berilmu. Sangat direkomendasikan untuk orang tua.',
      package: 'Umroh 12 Hari Ramadhan',
      rating: 5,
      date: 'Mar 2026'
    },
    {
      name: 'H. Ahmad Fauzi',
      origin: 'Semarang',
      text: 'Keberangkatan tepat waktu, maskapai penerbangan langsung tanpa transit panjang. Hotel di Madinah sangat bersih dan hanya 3 menit jalan kaki ke Masjid Nabawi.',
      package: 'Umroh Direct Flight',
      rating: 5,
      date: 'Nov 2025'
    },
    {
      name: 'Hj. Rina Marlina',
      origin: 'Makassar',
      text: 'Fasilitas perlengkapan yang diberikan berkualitas bagus, koper kokoh dan seragam manasik nyaman. Pelayanan staf di bandara sangat sigap membantu bagasi jamaah.',
      package: 'Umroh Awal Musim',
      rating: 5,
      date: 'Jan 2026'
    }
  ];

  // Total slides count: on desktop shows 3 cards, so max index is reviews.length - 3
  const maxDesktopIndex = reviews.length - 3;

  // Auto carousel effect
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxDesktopIndex ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, maxDesktopIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxDesktopIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxDesktopIndex ? 0 : prev + 1));
  };

  return (
    <section className="py-14 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8 md:space-y-10">
        
        {/* Centered Header */}
        <div className="text-center md:max-w-2xl md:mx-auto space-y-1.5">
          <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-brand block">
            Pengalaman Jamaah
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-neutral-900 leading-snug">
            Apa Kata Jamaah {brandName}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-lg mx-auto">
            Kisah nyata dari para jamaah yang telah menunaikan ibadah ke Tanah Suci bersama kami.
          </p>
        </div>

        {/* 3-Column Sliding Carousel Viewport with Side Arrows */}
        <div
          className="relative group/carousel py-1"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            className="hidden md:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/90 items-center justify-center transition-all active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
            aria-label="Sebelumnya"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            className="hidden md:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/90 items-center justify-center transition-all active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
            aria-label="Berikutnya"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Sliding Track Viewport */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out -mx-2.5 sm:-mx-3"
              style={{
                transform: `translateX(-${currentIndex * (100 / 3)}%)`
              }}
            >
              {reviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="w-full sm:w-1/2 lg:w-1/3 shrink-0 px-2.5 sm:px-3"
                >
                  <div className="h-full p-6 bg-white rounded-2xl md:rounded-3xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
                    
                    <div className="space-y-3">
                      {/* Header: User Avatar + Name */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                            {rev.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold font-heading text-neutral-900 leading-tight truncate">
                              {rev.name}
                            </h3>
                            <span className="text-[11px] text-neutral-400 font-medium block truncate mt-0.5">
                              {rev.origin} • {rev.package}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div className="flex text-amber-400 text-xs gap-0.5">
                        {'★'.repeat(rev.rating)}
                      </div>

                      {/* Review Text */}
                      <p className="text-xs sm:text-sm text-neutral-600 italic leading-relaxed line-clamp-4">
                        "{rev.text}"
                      </p>
                    </div>

                    {/* Footer Badge */}
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>{rev.date}</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Verified</span>
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Centered Controls (Mobile Arrows + Dots) */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrev}
            className="md:hidden w-8 h-8 rounded-full bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center transition-all active:scale-95 shadow-2xs cursor-pointer"
            aria-label="Sebelumnya"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: maxDesktopIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx ? 'w-8 bg-brand' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="md:hidden w-8 h-8 rounded-full bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center transition-all active:scale-95 shadow-2xs cursor-pointer"
            aria-label="Berikutnya"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
}