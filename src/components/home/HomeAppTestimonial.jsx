'use client';

import React, { useState } from 'react';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'H. Bambang & Keluarga',
    meta: 'Umroh Saudia VIP • Surabaya',
    avatarLetter: 'B',
    avatarBg: 'bg-brand-light text-brand border border-brand/20',
    stars: 5,
    quote: 'Alhamdulillah pelayanan luar biasa amanah. Hotel beneran cuma 50 meter dari pelataran Masjidil Haram, sangat ramah untuk orang tua kami. Muthawwif membimbing setiap rukun umroh dengan sangat teliti.'
  },
  {
    id: 2,
    name: 'Hj. Siti Rahmah & Suami',
    meta: 'Umroh Plus Turki • Jakarta',
    avatarLetter: 'S',
    avatarBg: 'bg-neutral-200 text-neutral-800',
    stars: 5,
    quote: 'Awalnya sempat ragu pilih travel baru, tapi setelah dicek izin resmi Kemenag-nya aktif dan terverifikasi. Dari manasik sampai kepulangan semua terjadwal rapi dan makanan Indonesia selalu tersedia!'
  }
];

export default function HomeAppTestimonial({ brandName = 'Travel Umroh' }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = TESTIMONIALS[activeIdx];

  return (
    <div className="w-full px-4 flex flex-col gap-3">
      {/* ━━━ Header Row ━━━ */}
      <div className="w-full flex justify-between items-center">
        <h2 className="text-[15px] font-extrabold text-neutral-900 leading-tight">
          Kisah Jamaah Kami
        </h2>
        <div className="text-[11px] text-amber-500 font-bold flex items-center gap-1">
          <span>★ 4.9/5</span>
          <span className="text-neutral-400 font-normal">(1.2k+ Ulasan)</span>
        </div>
      </div>

      {/* ━━━ Seamless Testimoni View (No Boxy Card) ━━━ */}
      <div className="w-full flex flex-col gap-2.5 p-3.5 bg-neutral-50/80 border border-neutral-100 rounded-2xl">
        <p className="text-[12px] text-neutral-700 leading-relaxed italic">
          &ldquo;{current.quote.replace('pelayanan luar biasa', `pelayanan ${brandName} luar biasa`)}&rdquo;
        </p>

        <div className="w-full flex justify-between items-center pt-1 border-t border-neutral-200/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 flex justify-center items-center ${current.avatarBg} rounded-full font-black text-[12px] shrink-0`}>
              {current.avatarLetter}
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-neutral-900 leading-none">
                {current.name}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium leading-none mt-1">
                {current.meta}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                aria-label={`Pindah ke testimoni ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeIdx ? 'w-4 bg-brand' : 'w-1.5 bg-neutral-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
