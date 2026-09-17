'use client';

import React from 'react';

const FEATURES = [
  {
    title: 'Berizin Resmi Kemenag',
    subtitle: 'Legalitas PPIU terdaftar',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] shrink-0 fill-none stroke-current" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Berpengalaman 10th+',
    subtitle: 'Terpercaya ribuan jamaah',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] shrink-0 fill-none stroke-current" strokeWidth="2">
        <circle cx="12" cy="8" r="6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.723.52L12 19.5l-4.269 2.436a.5.5 0 0 1-.723-.52l1.515-8.526" />
      </svg>
    ),
  },
  {
    title: '100% Pasti Berangkat',
    subtitle: 'Jadwal & tiket terjamin',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] shrink-0 fill-none stroke-current" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
  },
  {
    title: 'Pelayanan Terbukti',
    subtitle: 'Bimbingan sesuai sunnah',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] shrink-0 fill-none stroke-current" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

export default function HomeAppWhyChooseUs() {
  return (
    <div className="w-full px-4 flex flex-col gap-2.5">
      {/* ━━━ Header ━━━ */}
      <div className="flex flex-col">
        <h2 className="text-[15px] font-extrabold text-neutral-900 leading-tight">
          Kenapa Memilih Kami?
        </h2>
        <p className="text-[11.5px] text-neutral-500 font-medium leading-tight mt-1">
          Standar pelayanan ibadah dengan kepastian dan kenyamanan jamaah.
        </p>
      </div>

      {/* ━━━ Seamless 2-Column List (No Boxy Cards) ━━━ */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 w-full pt-1.5">
        {FEATURES.map((feat, idx) => (
          <div key={idx} className="flex items-start gap-2.5 min-w-0">
            <div className="w-[30px] h-[30px] rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0 border border-brand/20">
              {feat.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-bold text-neutral-900 leading-tight truncate">
                {feat.title}
              </span>
              <span className="text-[10.5px] text-neutral-500 leading-snug mt-0.5 line-clamp-2">
                {feat.subtitle}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
