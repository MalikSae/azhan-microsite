'use client';

import React, { useState } from 'react';
import SeatProgressBar from './SeatProgressBar';
import WhatsAppButton from './WhatsAppButton';
import Badge from './ui/Badge';
import ItineraryModal from './ItineraryModal';
import FacilitiesModal from './FacilitiesModal';

export default function PackageCard({ schedule, brandWhatsapp, brandName, brandLogoUrl }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isFacilitiesModalOpen, setIsFacilitiesModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [airlineLogoError, setAirlineLogoError] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const airlineLogoUrl = schedule?.maskapai?.logo_url 
    ? (schedule.maskapai.logo_url.startsWith('http') ? schedule.maskapai.logo_url : `${apiBaseUrl}${schedule.maskapai.logo_url}`)
    : null;

  if (!schedule) return null;

  const formatRupiah = (val) => {
    if (val === null || val === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDiscount = (val) => {
    if (!val || val <= 0) return '';
    if (val >= 1000000) {
      const jt = Math.round((val / 1000000) * 10) / 10;
      const str = jt % 1 === 0 ? jt.toString() : jt.toFixed(1).replace('.', ',');
      return `Diskon ${str} Jt`;
    }
    if (val >= 1000) {
      return `Diskon ${Math.round(val / 1000)} Rb`;
    }
    return `Diskon ${formatRupiah(val)}`;
  };

  const renderStars = (starCount) => {
    const stars = parseInt(starCount, 10) || 0;
    if (stars <= 0) return null;
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[...Array(Math.min(5, stars))].map((_, i) => (
          <svg key={i} className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?paket=${schedule.id}`;
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && navigator.share) {
      const url = `${window.location.origin}${window.location.pathname}?paket=${schedule.id}`;
      navigator.share({
        title: name,
        url: url,
      }).catch(console.error);
    } else {
      handleCopyLink();
    }
  };

  const name = schedule.jadwal_nama;
  const price = schedule.harga_quad;
  const originalPrice = schedule.harga_coret;
  const isPromo = schedule.is_promo || (originalPrice && originalPrice > price);
  const discountAmount = (originalPrice && originalPrice > price) ? (originalPrice - price) : 0;
  const discountText = formatDiscount(discountAmount);
  
  const departureStr = formatDate(schedule.berangkat_tanggal);
  const returnStr = formatDate(schedule.pulang_tanggal);
  
  let durationDays = 0;
  if (schedule.berangkat_tanggal && schedule.pulang_tanggal) {
    durationDays = Math.round((new Date(schedule.pulang_tanggal) - new Date(schedule.berangkat_tanggal)) / (1000 * 60 * 60 * 24)) + 1;
  }

  const seatTotal = schedule.seat_total || 0;
  const seatSisa = schedule.seat_sisa || 0;
  const seatTerisi = Math.max(0, seatTotal - seatSisa);

  return (
    <>
      <div 
        className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md hover:border-neutral-300 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Pita Ribbon PROMO Sudut Kanan Atas */}
        {isPromo && (
          <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none z-10">
            <div className="absolute transform rotate-45 bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 text-white font-black text-[9px] tracking-widest py-1 -right-7 top-4 w-28 text-center shadow-sm uppercase border-b border-white/20">
              PROMO
            </div>
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Baris 1: Header Judul & Tanggal */}
          <div className={isPromo ? "pr-12" : ""}>
            <h3 className="font-bold text-base md:text-lg text-neutral-900 leading-snug">
              {name}
            </h3>

            {/* Jadwal Tanggal & Periode Durasi di Samping Tanggal */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1 flex-wrap">
              <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-neutral-700">
                {departureStr} {schedule.pulang_tanggal ? `– ${returnStr}` : ''}
              </span>
              {durationDays > 0 && (
                <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full leading-none">
                  {durationDays} Hari
                </span>
              )}
            </div>
          </div>

          {/* Baris 2: Pilar Fasilitas Utama (Clean OTA List) */}
          <div className="bg-neutral-50/80 rounded-xl p-3.5 border border-neutral-100 space-y-2.5">
            {/* 1. Penerbangan */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-neutral-500 shrink-0 border border-neutral-200/80 overflow-hidden shadow-2xs">
                {airlineLogoUrl && !airlineLogoError ? (
                  <img 
                    src={airlineLogoUrl} 
                    alt={schedule.maskapai?.name || 'Maskapai'}
                    className="w-full h-full object-contain rounded-full"
                    onError={() => setAirlineLogoError(true)}
                  />
                ) : (
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.2 3c-.2.5.1 1 .6 1.2L9 13l-4 4-2.8-.9c-.5-.2-1 .2-1.1.7l-.4 1.4c-.1.5.2 1 .7 1.1l4 1.1 1.1 4c.1.5.6.8 1.1.7l1.4-.4c.5-.1.9-.6.7-1.1L8.8 20l4-4 1.9 5.9c.2.5.7.8 1.2.6l3-1.2c.5-.2.8-.6.7-1.1z"/>
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs text-neutral-900">
                    {schedule.maskapai?.name || 'Maskapai'}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-600 bg-white px-2 py-0.5 rounded-full border border-neutral-200 leading-none">
                    {schedule.is_direct_flight ? 'Direct' : 'Transit'}
                  </span>
                  {schedule.is_ticket_confirmed && (
                    <span 
                      className="inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded-full shadow-2xs leading-none"
                      title="Tiket Penerbangan Sudah Terbit"
                    >
                      <svg className="w-2.5 h-2.5 text-emerald-100 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      <span>Confirmed</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Hotel Mekkah & Madinah (Jarak di bawah bintang) */}
            <div className="pt-2 border-t border-neutral-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {schedule.hotel_mekkah?.name && (
                <div className="flex items-start gap-1.5">
                  <div className="w-4 h-4 rounded bg-neutral-200/60 flex items-center justify-center text-neutral-600 shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate leading-tight">
                      {schedule.hotel_mekkah.name}
                    </p>
                    {schedule.hotel_mekkah.star_rating > 0 && (
                      <div className="mt-0.5">
                        {renderStars(schedule.hotel_mekkah.star_rating)}
                      </div>
                    )}
                    <span className="text-[10px] text-neutral-500 block mt-0.5 leading-tight">
                      Mekkah (±{schedule.hotel_mekkah.distance_m || '500'}m)
                    </span>
                  </div>
                </div>
              )}

              {schedule.hotel_madinah?.name && (
                <div className="flex items-start gap-1.5">
                  <div className="w-4 h-4 rounded bg-neutral-200/60 flex items-center justify-center text-neutral-600 shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate leading-tight">
                      {schedule.hotel_madinah.name}
                    </p>
                    {schedule.hotel_madinah.star_rating > 0 && (
                      <div className="mt-0.5">
                        {renderStars(schedule.hotel_madinah.star_rating)}
                      </div>
                    )}
                    <span className="text-[10px] text-neutral-500 block mt-0.5 leading-tight">
                      Madinah (±{schedule.hotel_madinah.distance_m || '350'}m)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Baris 3: Ketersediaan Kursi (Seat Progress Bar) */}
          <div className="pt-1">
            <SeatProgressBar 
              totalSeat={seatTotal}
              bookedSeat={seatTerisi}
              seatTotal={seatTotal} 
              seatTerisi={seatTerisi} 
              seatSisa={seatSisa} 
            />
          </div>
        </div>

        {/* Baris 4: Footer Harga & Tombol Aksi (High Conversion CTA) */}
        <div className="p-4 bg-neutral-50/60 border-t border-neutral-100 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Mulai Dari
              </span>
              {discountText && (
                <div 
                  className="relative inline-flex items-center bg-rose-600 text-white font-black text-[9px] uppercase tracking-tight py-0.5 pl-2.5 pr-2 rounded-r shadow-2xs leading-none"
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

          {/* Tombol CTA Jelas */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-95 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <span>{isExpanded ? 'Tutup' : 'Lihat Detail'}</span>
            <svg 
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Expanded Content Area */}
        {isExpanded && (
          <div 
            className="p-4 pt-3 border-t border-neutral-200/70 bg-white space-y-4 animate-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grid Tombol Aksi Cepat */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setIsItineraryModalOpen(true)}
                disabled={!schedule.itinerary_id}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-neutral-200 transition-colors ${!schedule.itinerary_id ? 'opacity-50 cursor-not-allowed bg-neutral-50' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}
              >
                <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                <span className="text-[11px] font-medium">Itinerary</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFacilitiesModalOpen(true)}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors"
              >
                <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <span className="text-[11px] font-medium">Fasilitas</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.assign(`/compare?paket=${schedule.id}`)}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors"
              >
                <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                <span className="text-[11px] font-medium">Compare</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors"
              >
                <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                <span className="text-[11px] font-medium">{linkCopied ? 'Tersalin!' : 'Bagikan'}</span>
              </button>
            </div>

            {/* Rincian Tipe Kamar */}
            <div className="bg-neutral-50 rounded-xl border border-neutral-200/80 overflow-hidden">
              <div className="bg-neutral-100/70 px-3 py-1.5 border-b border-neutral-200/80">
                <h4 className="font-bold text-xs text-neutral-800">Pilihan Tipe Kamar</h4>
              </div>
              <div className="divide-y divide-neutral-200/60">
                <div className="flex justify-between items-center px-3 py-2 text-xs">
                  <span className="text-neutral-600 font-medium">Quad (Sekamar 4)</span>
                  <span className="font-bold text-neutral-900">{formatRupiah(schedule.harga_quad)}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 text-xs">
                  <span className="text-neutral-600 font-medium">Triple (Sekamar 3)</span>
                  <span className="font-bold text-neutral-900">{formatRupiah(schedule.harga_triple)}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 text-xs">
                  <span className="text-neutral-600 font-medium">Double (Sekamar 2)</span>
                  <span className="font-bold text-neutral-900">{formatRupiah(schedule.harga_double)}</span>
                </div>
              </div>
            </div>

            {/* Hubungi WhatsApp Konsultasi */}
            <div className="pt-1">
              <WhatsAppButton 
                brandWhatsapp={brandWhatsapp}
                packageName={name}
              />
            </div>
          </div>
        )}
      </div>

      <ItineraryModal 
        itineraryId={schedule.itinerary_id}
        isOpen={isItineraryModalOpen}
        onClose={() => setIsItineraryModalOpen(false)}
      />
      <FacilitiesModal
        packageName={name}
        includeItems={schedule.include_items}
        excludeItems={schedule.exclude_items}
        isOpen={isFacilitiesModalOpen}
        onClose={() => setIsFacilitiesModalOpen(false)}
      />
    </>
  );
}
