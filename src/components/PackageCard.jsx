'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SeatProgressBar from './SeatProgressBar';
import Badge from './ui/Badge';

export default function PackageCard({ schedule, brandWhatsapp, brandName, brandLogoUrl }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [airlineLogoError, setAirlineLogoError] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const airlineLogoUrl = schedule?.maskapai?.logo_url 
    ? (schedule.maskapai.logo_url.startsWith('http') ? schedule.maskapai.logo_url : `${apiBaseUrl}${schedule.maskapai.logo_url}`)
    : null;

  if (!schedule) return null;

  const packageSlug = schedule.jadwal_nama 
    ? `${schedule.id}-${schedule.jadwal_nama.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : schedule.id;

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/paket/${packageSlug}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const name = schedule.jadwal_nama;
  const price = schedule.harga_quad;
  const originalPrice = schedule.harga_coret;
  const isPromo = schedule.is_promo || (originalPrice && originalPrice > price);

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
    <div className="block relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100/80 hover:shadow-xl hover:border-neutral-200 transition-all duration-300 group">
      
      {/* Promo & Share Button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button 
          onClick={handleShare}
          className="bg-white/90 backdrop-blur border border-white shadow-sm p-2 rounded-full text-neutral-600 hover:text-brand hover:scale-105 transition-all"
          aria-label="Bagikan"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </div>

      {isPromo && (
        <div className="absolute top-0 right-0 overflow-hidden w-28 h-28 pointer-events-none z-10">
          <div className="absolute transform rotate-45 bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 text-white font-black text-[10px] tracking-widest py-1 -right-8 top-5 w-32 text-center shadow-md uppercase border-b border-white/20">
            PROMO
          </div>
        </div>
      )}

      {/* Konten Card Utama */}
      <div className="p-5 md:p-6 pb-4">
        {/* Baris 1: Judul & Durasi */}
        <div className="mb-4 pr-12">
          <h3 className="text-[17px] md:text-[19px] font-black text-neutral-900 leading-snug mb-2 group-hover:text-brand transition-colors line-clamp-2">
            <Link href={`/paket/${packageSlug}`} className="focus:outline-none focus:ring-2 focus:ring-brand rounded">
              {name}
            </Link>
          </h3>
          
          <div className="flex items-center gap-2.5 text-xs text-neutral-500 font-medium bg-neutral-50 inline-flex px-2.5 py-1.5 rounded-lg border border-neutral-100">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{departureStr} {schedule.pulang_tanggal ? `- ${returnStr}` : ''}</span>
            </div>
            {durationDays > 0 && (
              <>
                <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
                <span className="font-bold text-neutral-600">{durationDays} Hari</span>
              </>
            )}
          </div>
        </div>

        {/* Baris 2: Info Penerbangan & Hotel */}
        <div className="bg-neutral-50/50 rounded-2xl border border-neutral-100 p-3 mb-5 space-y-3">
          {/* Flight */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100/80">
            <div className="flex items-center gap-2.5">
              {airlineLogoUrl && !airlineLogoError ? (
                <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-neutral-100 p-1 flex items-center justify-center shrink-0">
                  <img 
                    src={airlineLogoUrl}
                    alt={schedule.maskapai?.name || 'Maskapai'}
                    className="w-full h-full object-contain"
                    onError={() => setAirlineLogoError(true)}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Penerbangan</span>
                <span className="font-bold text-neutral-800 text-xs">
                  {schedule.maskapai?.name || 'Maskapai'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-1.5">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-600">
                {schedule.is_direct_flight ? 'Direct' : 'Transit'}
              </span>
              {schedule.is_ticket_confirmed && (
                <Badge variant="success" size="sm" className="!text-[9px] !px-2 !py-0.5">
                  Confirmed
                </Badge>
              )}
            </div>
          </div>

          {/* Hotels */}
          <div className="flex gap-3 relative">
            <div className="absolute left-1/2 top-1 bottom-1 w-px bg-neutral-200/60 -translate-x-1/2 hidden xs:block"></div>
            
            <div className="flex-1 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider mb-0.5">Hotel Mekkah</span>
                {schedule.hotel_mekkah?.name ? (
                  <>
                    <span className="font-bold text-neutral-800 text-xs leading-tight mb-1">
                      {schedule.hotel_mekkah.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {schedule.hotel_mekkah.star_rating > 0 && (
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-2 h-2 ${i < schedule.hotel_mekkah.star_rating ? 'text-amber-400' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </div>
                      )}
                      <span className="text-[9px] font-medium text-neutral-500">
                        (±{schedule.hotel_mekkah.distance_m || '500'}m)
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-neutral-400 italic">Menyusul</span>
                )}
              </div>
            </div>

            <div className="flex-1 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider mb-0.5">Hotel Madinah</span>
                {schedule.hotel_madinah?.name ? (
                  <>
                    <span className="font-bold text-neutral-800 text-xs leading-tight mb-1">
                      {schedule.hotel_madinah.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {schedule.hotel_madinah.star_rating > 0 && (
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-2 h-2 ${i < schedule.hotel_madinah.star_rating ? 'text-amber-400' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </div>
                      )}
                      <span className="text-[9px] font-medium text-neutral-500">
                        (±{schedule.hotel_madinah.distance_m || '350'}m)
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-neutral-400 italic">Menyusul</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Baris 3: Sisa Seat */}
        <div className="mb-2">
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
      <div className="p-4 bg-neutral-50/60 border-t border-neutral-100 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Mulai Dari
            </span>
            {discountText && (
              <div 
                className="relative inline-flex items-center bg-red-600 text-white font-black text-[9px] uppercase tracking-tight py-0.5 pl-2.5 pr-2 rounded-r shadow-2xs leading-none"
                style={{
                  clipPath: 'polygon(5px 0%, 100% 0%, 100% 100%, 5px 100%, 0% 50%)'
                }}
              >
                <span>{discountText}</span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-lg md:text-xl font-black text-neutral-900 font-sans tracking-tight">
              {formatRupiah(price)}
            </span>
            {isPromo && originalPrice > price && (
              <span className="text-xs text-rose-500 font-medium line-through decoration-rose-500">
                {formatRupiah(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Tombol CTA -> Buka Halaman Detail */}
        <Link
          href={`/paket/${packageSlug}`}
          className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-95 shrink-0"
        >
          <span>Lihat Detail</span>
          <svg 
            className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" 
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