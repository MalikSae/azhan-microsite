'use client';

import React, { useState } from 'react';
import Link from 'next/link';

function formatRupiah(number) {
  if (!number) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDateShort(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return dateString;
  }
}

export default function HomeAppCard({
  schedule,
  brandWhatsapp = '',
  brandName = 'Travel Umroh'
}) {
  const [airlineLogoError, setAirlineLogoError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!schedule) return null;

  const packageSlug = schedule.jadwal_nama
    ? `${schedule.id}-${schedule.jadwal_nama.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : schedule.id;

  const name = schedule.jadwal_nama || 'Umroh Reguler';
  const price = schedule.harga_quad || 0;
  const originalPrice = schedule.harga_coret;
  const today = new Date().toISOString().split('T')[0];
  const isPromoExpired = schedule.promo_until && schedule.promo_until < today;
  const isPromo = Boolean(schedule.is_promo && !isPromoExpired);
  const hasDiscount = Boolean(isPromo && originalPrice && originalPrice > price);

  const departureDateText = formatDateShort(schedule.berangkat_tanggal);

  let durationDays = 0;
  if (schedule.berangkat_tanggal && schedule.pulang_tanggal) {
    durationDays = Math.round((new Date(schedule.pulang_tanggal) - new Date(schedule.berangkat_tanggal)) / (1000 * 60 * 60 * 24)) + 1;
  }

  // Seat Calculations
  const seatTotal = schedule.seat_total || 45;
  const seatSisa = schedule.seat_sisa !== undefined ? schedule.seat_sisa : 10;
  const seatTerisi = Math.max(0, seatTotal - seatSisa);
  const seatPercentage = seatTotal > 0 ? Math.min(100, Math.round((seatTerisi / seatTotal) * 100)) : 0;
  const isSoldOut = seatSisa <= 0;
  const isScarcity = seatSisa <= 10 && seatSisa > 0;

  // Maskapai
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const airlineLogoUrl = schedule?.maskapai?.logo_url
    ? (schedule.maskapai.logo_url.startsWith('http') ? schedule.maskapai.logo_url : `${apiBaseUrl}${schedule.maskapai.logo_url}`)
    : null;
  const airlineName = schedule.maskapai?.name || 'Maskapai';
  const isDirect = Boolean(schedule.is_direct_flight);

  // Hotels (nested objects per AGENTS.md)
  const hotelMekkah = typeof schedule.hotel_mekkah === 'object' ? schedule.hotel_mekkah : null;
  const hotelMekkahName = hotelMekkah?.name || 'Hotel Makkah';
  const hotelMekkahStars = hotelMekkah?.star_rating || 0;
  const hotelMekkahDist = hotelMekkah?.distance_m;

  const hotelMadinah = typeof schedule.hotel_madinah === 'object' ? schedule.hotel_madinah : null;
  const hotelMadinahName = hotelMadinah?.name || 'Hotel Madinah';
  const hotelMadinahStars = hotelMadinah?.star_rating || 0;
  const hotelMadinahDist = hotelMadinah?.distance_m;

  // Image resolution fallback
  const getCardImage = () => {
    const rawUrl = schedule.brosur_thumb_url || schedule.brosur_url;
    if (rawUrl) {
      return rawUrl.startsWith('http') ? rawUrl : `${apiBaseUrl}${rawUrl}`;
    }
    const nameLower = (schedule.jadwal_nama || '').toLowerCase();
    if (nameLower.includes('turki') || nameLower.includes('plus')) {
      return 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';
    }
    if (nameLower.includes('haji') || nameLower.includes('furoda')) {
      return '/images/hero-makkah.jpg';
    }
    if (schedule.is_promo) {
      return '/images/bg-kaaba.webp';
    }
    return '/images/hero-makkah.jpg';
  };

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
  };

  return (
    <Link
      href={`/paket/${packageSlug}`}
      className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-brand/40 transition-all duration-300 flex flex-col justify-between group no-underline"
    >
      {/* ━━━ TOP SECTION: GAMBAR FULL WIDTH (RASIO 1:1) ━━━ */}
      <div className="relative w-full aspect-square overflow-hidden bg-neutral-900">
        <img
          src={getCardImage()}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15 pointer-events-none" />

        {/* Badge Promo (jika ada) */}
        {isPromo && (
          <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 bg-[#F43F5E] text-white text-[9px] font-bold rounded-full shadow-xs uppercase tracking-wider">
            PROMO
          </div>
        )}

        {/* Departure Date & Duration */}
        {departureDateText && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="bg-black/80 backdrop-blur-xs text-white text-[9.5px] font-bold px-2 py-0.5 rounded-[6px] flex items-center gap-1.5 border border-white/10 shadow-xs">
              <svg className="w-3 h-3 text-white/90 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{departureDateText}</span>
              {durationDays > 0 && <span className="text-white/70">• {durationDays}H</span>}
            </span>
          </div>
        )}
      </div>

      {/* ━━━ BODY SECTION (PADDING & DETAILS) ━━━ */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
        <div className="w-full flex flex-col gap-2">
          {/* ━━━ 2. JUDUL PAKET (SATU BARIS) ━━━ */}
          <h3 className="text-[13.5px] font-extrabold text-neutral-900 leading-snug truncate w-full group-hover:text-brand transition-colors" title={name}>
            {name}
          </h3>

          {/* ━━━ 3. MASKAPAI (SEAMLESS) ━━━ */}
          <div className="flex items-center justify-between gap-1 w-full">
            <div className="flex items-center gap-1.5 min-w-0">
              {airlineLogoUrl && !airlineLogoError ? (
                <img
                  src={airlineLogoUrl}
                  alt={airlineName}
                  className="w-4 h-4 object-contain shrink-0"
                  onError={() => setAirlineLogoError(true)}
                />
              ) : (
                <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              <span className="text-[11.5px] font-bold text-neutral-800 truncate">
                {airlineName}
              </span>
            </div>

            {/* Direct indicator */}
            {isDirect && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-light text-brand shrink-0">
                Direct
              </span>
            )}
          </div>

          {/* ━━━ 4. HOTEL BINTANG DAN JARAK (SEAMLESS) ━━━ */}
          <div className="flex flex-col gap-1 text-[11px]">
            {/* Mekkah */}
            <div className="flex items-center justify-between gap-1 leading-tight text-neutral-700">
              <span className="font-semibold text-neutral-800 truncate flex-1 pr-1" title={hotelMekkahName}>
                {hotelMekkahName}
              </span>
              {(hotelMekkahStars > 0 || hotelMekkahDist != null) && (
                <div className="flex items-center gap-1 shrink-0 text-[10px]">
                  {hotelMekkahStars > 0 && (
                    <span className="text-amber-500 font-bold">
                      ★{hotelMekkahStars}
                    </span>
                  )}
                  {hotelMekkahDist != null && (
                    <span className="font-medium text-neutral-400">
                      ±{hotelMekkahDist}m
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Madinah */}
            <div className="flex items-center justify-between gap-1 leading-tight text-neutral-700">
              <span className="font-semibold text-neutral-800 truncate flex-1 pr-1" title={hotelMadinahName}>
                {hotelMadinahName}
              </span>
              {(hotelMadinahStars > 0 || hotelMadinahDist != null) && (
                <div className="flex items-center gap-1 shrink-0 text-[10px]">
                  {hotelMadinahStars > 0 && (
                    <span className="text-amber-500 font-bold">
                      ★{hotelMadinahStars}
                    </span>
                  )}
                  {hotelMadinahDist != null && (
                    <span className="font-medium text-neutral-400">
                      ±{hotelMadinahDist}m
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ━━━ 5. KUOTA SEAT (SEAMLESS, NO NUMBERS IF ABUNDANT) ━━━ */}
          <div className="flex flex-col gap-1 pt-0.5">
            <div className="flex justify-between items-center text-[10.5px] leading-none">
              {isSoldOut ? (
                <span className="text-neutral-500 font-bold">Kuota Penuh</span>
              ) : isScarcity ? (
                <span className="text-amber-700 font-bold">
                  Sisa <strong className="font-black text-amber-900">{seatSisa}</strong> seat lagi
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Amankan Seat!
                </span>
              )}
            </div>

            {/* Progress Bar (Selalu tampil di semua kondisi) */}
            <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isSoldOut
                    ? 'bg-neutral-400 w-full'
                    : isScarcity
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                }`}
                style={{
                  width: isSoldOut
                    ? '100%'
                    : isScarcity
                    ? `${Math.max(65, seatPercentage)}%`
                    : `${Math.max(20, seatPercentage)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ━━━ BOTTOM SECTION (HARGA & INDIKATOR KLIK) ━━━ */}
        <div className="flex items-end justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-[9.5px] text-neutral-400 font-medium leading-none">
              Mulai dari
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-rose-500 line-through font-semibold leading-none mt-1">
                {formatRupiah(originalPrice)}
              </span>
            )}
            <div className="text-[15.5px] font-extrabold text-neutral-900 group-hover:text-brand tracking-tight leading-tight mt-0.5 transition-colors">
              {formatRupiah(price)}
            </div>
          </div>

          {/* Subtle arrow indicator (no heavy black button) */}
          <div className="w-6 h-6 rounded-full bg-neutral-50 group-hover:bg-brand-light flex items-center justify-center transition-colors">
            <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
