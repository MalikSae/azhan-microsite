'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SeatProgressBar from './SeatProgressBar';

export default function PackageCard({ schedule, brandWhatsapp, brandName, brandLogoUrl, compact = false }) {
  const [airlineLogoError, setAirlineLogoError] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const airlineLogoUrl = schedule?.maskapai?.logo_url 
    ? (schedule.maskapai.logo_url.startsWith('http') ? schedule.maskapai.logo_url : `${apiBaseUrl}${schedule.maskapai.logo_url}`)
    : null;

  if (!schedule) return null;

  const packageSlug = schedule.jadwal_nama 
    ? `${schedule.id}-${schedule.jadwal_nama.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : schedule.id;

  const name = schedule.jadwal_nama;
  const price = schedule.harga_quad;
  const originalPrice = schedule.harga_coret;
  const today = new Date().toISOString().split('T')[0];
  const isPromoExpired = schedule.promo_until && schedule.promo_until < today;
  const isPromo = Boolean(schedule.is_promo && !isPromoExpired);

  const departureStr = formatDate(schedule.berangkat_tanggal);
  const returnStr = formatDate(schedule.pulang_tanggal);

  let durationDays = 0;
  if (schedule.berangkat_tanggal && schedule.pulang_tanggal) {
    durationDays = Math.round((new Date(schedule.pulang_tanggal) - new Date(schedule.berangkat_tanggal)) / (1000 * 60 * 60 * 24)) + 1;
  }

  const seatTotal = schedule.seat_total || 0;
  const seatSisa = schedule.seat_sisa || 0;
  const seatTerisi = Math.max(0, seatTotal - seatSisa);

  // Discount calc
  let discountText = null;
  if (isPromo && originalPrice && originalPrice > price) {
    const diff = originalPrice - price;
    if (diff >= 1000000) {
      const diffJt = diff / 1000000;
      discountText = `DISKON ${Math.round(diffJt)} JT`;
    } else if (diff >= 1000) {
      discountText = `DISKON ${Math.round(diff / 1000)} RB`;
    }
  }

  return (
    <div className={`block relative bg-white ${compact ? 'rounded-2xl' : 'rounded-3xl'} overflow-hidden shadow-xs border border-neutral-200/90 hover:shadow-md hover:border-neutral-300 transition-all duration-300 group`}>
      
      {isPromo && (
        <div className={`absolute top-0 right-0 overflow-hidden ${compact ? 'w-20 h-20' : 'w-24 h-24 xs:w-28 xs:h-28'} pointer-events-none z-10`}>
          <div className={`absolute transform rotate-45 bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 text-white font-black ${compact ? 'text-[8px] py-0.5 -right-8 top-3.5 w-24' : 'text-[9px] xs:text-[10px] tracking-widest py-0.5 xs:py-1 -right-9 top-4 xs:-right-8 xs:top-5 w-28 xs:w-32'} text-center shadow-md uppercase border-b border-white/20`}>
            PROMO
          </div>
        </div>
      )}

      {/* Konten Card Utama */}
      <div className={compact ? 'p-3.5 pb-2.5' : 'p-4 xs:p-5 md:p-6 pb-4'}>
        {/* Baris 1: Judul & Durasi */}
        <div className={`${compact ? 'mb-2' : 'mb-3 xs:mb-4'} ${isPromo ? (compact ? 'pr-7' : 'pr-8 xs:pr-12') : ''}`}>
          <h3 className={`${compact ? 'text-[13.5px] font-bold mb-1.5' : 'text-base xs:text-[17px] md:text-[19px] font-black mb-2'} text-neutral-900 leading-snug group-hover:text-brand transition-colors line-clamp-1`}>
            <Link href={`/paket/${packageSlug}`} className="focus:outline-none focus:ring-2 focus:ring-brand rounded">
              {name}
            </Link>
          </h3>
          
          <div className={`flex items-center ${compact ? 'gap-1 text-[10px] px-2 py-0.5' : 'gap-1.5 xs:gap-2.5 text-[11px] xs:text-xs px-2 xs:px-2.5 py-1 xs:py-1.5'} text-neutral-500 font-medium bg-neutral-50 inline-flex rounded-lg border border-neutral-100`}>
            <div className="flex items-center gap-1">
              <svg className={compact ? 'w-3 h-3 text-neutral-400' : 'w-3.5 h-3.5 text-neutral-400'} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{departureStr} {schedule.pulang_tanggal ? `- ${returnStr}` : ''}</span>
            </div>
            {durationDays > 0 && (
              <>
                <span className="text-neutral-300">•</span>
                <span className="font-bold text-neutral-700">{durationDays}H</span>
              </>
            )}
          </div>
        </div>

        {/* Baris 2: Fasilitas Utama (Maskapai & Hotel) */}
        <div className={`bg-neutral-50/50 ${compact ? 'rounded-xl p-2.5 mb-2.5 space-y-2' : 'rounded-2xl p-3 xs:p-3.5 mb-4 space-y-2.5 xs:space-y-3'} border border-neutral-100`}>
          {/* Maskapai */}
          <div className={`flex items-center justify-between gap-1.5 ${compact ? 'pb-2' : 'pb-2.5'} border-b border-neutral-200/60 flex-wrap xs:flex-nowrap`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`${compact ? 'w-5 h-5 rounded' : 'w-6 h-6 xs:w-7 xs:h-7 rounded-lg'} bg-white border border-neutral-200 flex items-center justify-center p-0.5 shrink-0 overflow-hidden`}>
                {airlineLogoUrl && !airlineLogoError ? (
                  <img 
                    src={airlineLogoUrl} 
                    alt={schedule.maskapai?.name || 'Maskapai'} 
                    className="w-full h-full object-contain"
                    onError={() => setAirlineLogoError(true)}
                  />
                ) : (
                  <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`${compact ? 'text-[8.5px]' : 'text-[9px] xs:text-[10px]'} text-neutral-400 font-medium uppercase tracking-wider leading-none mb-0.5`}>Penerbangan</span>
                <span className={`font-bold text-neutral-800 ${compact ? 'text-[11px]' : 'text-xs'} truncate`}>
                  {schedule.maskapai?.name || 'Maskapai'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {schedule.is_ticket_confirmed && (
                <span className={`${compact ? 'text-[7.5px] px-1 py-[1px]' : 'text-[8px] xs:text-[8.5px] px-1.5 py-[2px]'} font-bold text-white bg-emerald-500 rounded-full flex items-center gap-0.5 shadow-2xs tracking-tight`}>
                  <svg className="w-2 h-2" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.25 13.5l-4-4 1.5-1.5 2.5 2.5 5.5-5.5 1.5 1.5-7 7z" clipRule="evenodd"/></svg>
                  <span>{compact ? 'Confirmed' : 'Tiket Confirmed'}</span>
                </span>
              )}
              {schedule.is_direct_flight && (
                <span className={`${compact ? 'text-[7.5px] px-1 py-[1px]' : 'text-[8px] xs:text-[8.5px] px-1.5 py-[2px]'} font-bold text-white bg-orange-500 rounded-full flex items-center gap-0.5 shadow-2xs tracking-tight`}>
                  <svg className="w-2 h-2 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  <span>Direct</span>
                </span>
              )}
            </div>
          </div>

          {/* Hotels */}
          <div className="flex gap-2 relative">
            <div className="absolute left-1/2 top-1 bottom-1 w-px bg-neutral-200/60 -translate-x-1/2 hidden xs:block"></div>
            
            <div className="flex-1 min-w-0 flex items-start gap-1.5">
              <div className={`${compact ? 'w-5 h-5 rounded' : 'w-6 h-6 xs:w-7 xs:h-7 rounded-lg'} bg-brand-light text-brand flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`${compact ? 'text-[8.5px]' : 'text-[9px] xs:text-[10px]'} text-neutral-400 font-medium uppercase tracking-wider mb-0.5 truncate`}>
                  Mekkah
                </span>
                {schedule.hotel_mekkah?.name ? (
                  <>
                    <span className={`font-bold text-neutral-800 ${compact ? 'text-[11px] mb-0.5' : 'text-xs mb-1'} leading-tight truncate block`} title={schedule.hotel_mekkah.name}>
                      {schedule.hotel_mekkah.name}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {schedule.hotel_mekkah.star_rating > 0 && (
                        <div className="flex gap-0.5 shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-1.5 h-1.5 ${i < schedule.hotel_mekkah.star_rating ? 'text-amber-400' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </div>
                      )}
                      <span className="text-[8px] font-medium text-neutral-500 truncate">
                        (±{schedule.hotel_mekkah.distance_m || '500'}m)
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-neutral-400 italic">Menyusul</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 flex items-start gap-1.5">
              <div className={`${compact ? 'w-5 h-5 rounded' : 'w-6 h-6 xs:w-7 xs:h-7 rounded-lg'} bg-brand-light text-brand flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`${compact ? 'text-[8.5px]' : 'text-[9px] xs:text-[10px]'} text-neutral-400 font-medium uppercase tracking-wider mb-0.5 truncate`}>
                  Madinah
                </span>
                {schedule.hotel_madinah?.name ? (
                  <>
                    <span className={`font-bold text-neutral-800 ${compact ? 'text-[11px] mb-0.5' : 'text-xs mb-1'} leading-tight truncate block`} title={schedule.hotel_madinah.name}>
                      {schedule.hotel_madinah.name}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {schedule.hotel_madinah.star_rating > 0 && (
                        <div className="flex gap-0.5 shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-1.5 h-1.5 ${i < schedule.hotel_madinah.star_rating ? 'text-amber-400' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </div>
                      )}
                      <span className="text-[8px] font-medium text-neutral-500 truncate">
                        (±{schedule.hotel_madinah.distance_m || '350'}m)
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-neutral-400 italic">Menyusul</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Baris 3: Sisa Seat */}
        <div className={compact ? 'mb-1' : 'mb-2'}>
          <SeatProgressBar 
            totalSeat={seatTotal}
            bookedSeat={seatTerisi}
            seatTotal={seatTotal} 
            seatTerisi={seatTerisi} 
            seatSisa={seatSisa} 
          />
        </div>
      </div>

      {/* Baris 4: Footer Harga & Tombol Aksi */}
      <div className={`${compact ? 'p-3' : 'p-3.5 xs:p-4'} bg-neutral-50/60 border-t border-neutral-100 flex items-center justify-between gap-2`}>
        <div className="min-w-0">
          {isPromo && originalPrice > price && (
            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
              <span className="text-[10px] text-rose-500 font-medium line-through decoration-rose-500">
                {formatRupiah(originalPrice)}
              </span>
              {discountText && (
                <div 
                  className="relative inline-flex items-center bg-red-600 text-white font-black text-[7.5px] uppercase tracking-tight py-0.5 pl-1.5 pr-1 rounded-r shadow-2xs leading-none"
                  style={{
                    clipPath: 'polygon(4px 0%, 100% 0%, 100% 100%, 4px 100%, 0% 50%)'
                  }}
                >
                  <span>{discountText}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-1">
            <span className={`${compact ? 'text-[14.5px] sm:text-base' : 'text-base xs:text-lg md:text-xl'} font-black text-neutral-900 font-sans tracking-tight`}>
              {formatRupiah(price)}
            </span>
          </div>
        </div>

        {/* Tombol CTA -> Buka Halaman Detail */}
        <Link
          href={`/paket/${packageSlug}`}
          aria-label={`Lihat detail paket ${name}`}
          className={`inline-flex items-center justify-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold ${compact ? 'text-[11px] px-3 py-2 rounded-xl' : 'text-xs p-2.5 xs:px-4 xs:py-2.5 rounded-xl'} transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 shrink-0`}
        >
          <span>Lihat Detail</span>
          <svg 
            className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

    </div>
  );
}

function formatRupiah(number) {
  if (!number) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
