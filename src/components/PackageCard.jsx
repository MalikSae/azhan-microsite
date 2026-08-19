'use client';

import React, { useState } from 'react';
import SeatProgressBar from './SeatProgressBar';
import WhatsAppButton from './WhatsAppButton';
import Badge from './ui/Badge';
import ItineraryModal from './ItineraryModal';

export default function PackageCard({ schedule, brandWhatsapp, brandName, brandLogoUrl }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
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

  const renderStars = (starCount) => {
    const stars = parseInt(starCount, 10) || 0;
    if (stars <= 0) return null;
    return (
      <span className="flex items-center text-amber-400 text-xs">
        {'★'.repeat(stars)}
      </span>
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

  const handleShare = () => {
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
  const discountPercent = (originalPrice && originalPrice > price) 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;
  const departureStr = formatDate(schedule.berangkat_tanggal);
  
  let durationDays = 0;
  if (schedule.berangkat_tanggal && schedule.pulang_tanggal) {
    durationDays = Math.round((new Date(schedule.pulang_tanggal) - new Date(schedule.berangkat_tanggal)) / (1000 * 60 * 60 * 24)) + 1;
  }

  const seatTotal = schedule.seat_total || 0;
  const seatSisa = schedule.seat_sisa || 0;
  const seatTerisi = Math.max(0, seatTotal - seatSisa);
  const seatPercentage = seatTotal > 0 ? Math.round((seatTerisi / seatTotal) * 100) : 0;
  


  return (
    <>
      <div 
        className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          {/* Header Image / Badge Banner */}
          <div className="p-5 border-b border-neutral-100 relative bg-neutral-50/50">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div className="flex-1 pr-2">
                <h3 className="font-bold text-base md:text-lg text-neutral-900 leading-snug mb-1">
                  {name}
                </h3>
                {durationDays > 0 && (
                  <span className="text-[11px] text-neutral-500 font-medium block">
                    Durasi {durationDays} Hari
                  </span>
                )}
              </div>

            </div>



            <div className="border-t border-neutral-100 pt-3 mt-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Berangkat */}
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">Berangkat</span>
                <div className="flex items-center gap-1.5 text-neutral-700 font-medium">
                  <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{departureStr}</span>
                </div>
                {(schedule.berangkat_jam || schedule.berangkat_kode_penerbangan) && (
                  <div className="mt-0.5 text-neutral-500 pl-5">
                    {schedule.berangkat_jam} {schedule.berangkat_kode_penerbangan && `• ${schedule.berangkat_kode_penerbangan}`}
                  </div>
                )}
              </div>
              {/* Pulang */}
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">Pulang</span>
                <div className="flex items-center gap-1.5 text-neutral-700 font-medium">
                  <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(schedule.pulang_tanggal)}</span>
                </div>
                {(schedule.pulang_jam || schedule.pulang_kode_penerbangan) && (
                  <div className="mt-0.5 text-neutral-500 pl-5">
                    {schedule.pulang_jam} {schedule.pulang_kode_penerbangan && `• ${schedule.pulang_kode_penerbangan}`}
                  </div>
                )}
              </div>
            </div>

            </div>
          </div>

          {/* Details: Airline & Hotel */}
          <div className="p-4 space-y-3 relative">
            {/* Maskapai */}
            {schedule.maskapai?.name && (
              <div className="flex items-center gap-2.5 text-xs text-neutral-700">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-neutral-500 shrink-0 border border-neutral-200 overflow-hidden shadow-sm">
                  {airlineLogoUrl && !airlineLogoError ? (
                    <img 
                      src={airlineLogoUrl} 
                      alt={schedule.maskapai.name}
                      className="w-full h-full object-contain rounded-full"
                      onError={() => setAirlineLogoError(true)}
                    />
                  ) : (
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.2 3c-.2.5.1 1 .6 1.2L9 13l-4 4-2.8-.9c-.5-.2-1 .2-1.1.7l-.4 1.4c-.1.5.2 1 .7 1.1l4 1.1 1.1 4c.1.5.6.8 1.1.7l1.4-.4c.5-.1.9-.6.7-1.1L8.8 20l4-4 1.9 5.9c.2.5.7.8 1.2.6l3-1.2c.5-.2.8-.6.7-1.1z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <span className="text-neutral-400 block text-xs">MASKAPAI</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{schedule.maskapai.name}</span>
                    {schedule.is_direct_flight && (
                      <Badge variant="success" className="!bg-success-600 !text-white !px-2 !py-0.5 !text-[10px] !rounded-md">
                        Direct Flight
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Hotel */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {schedule.hotel_mekkah?.name && (
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                  <span className="text-xs font-bold text-neutral-400 block uppercase">Mekkah</span>
                  <span className="font-medium text-neutral-800 line-clamp-1">
                    {schedule.hotel_mekkah.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {schedule.hotel_mekkah.star_rating > 0 && renderStars(schedule.hotel_mekkah.star_rating)}
                    <span className="text-xs text-neutral-500">
                      ±{schedule.hotel_mekkah.distance_m !== null ? `${schedule.hotel_mekkah.distance_m}m` : '-'}
                    </span>
                  </div>
                </div>
              )}
              {schedule.hotel_madinah?.name && (
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                  <span className="text-xs font-bold text-neutral-400 block uppercase">Madinah</span>
                  <span className="font-medium text-neutral-800 line-clamp-1">
                    {schedule.hotel_madinah.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {schedule.hotel_madinah.star_rating > 0 && renderStars(schedule.hotel_madinah.star_rating)}
                    <span className="text-xs text-neutral-500">
                      ±{schedule.hotel_madinah.distance_m !== null ? `${schedule.hotel_madinah.distance_m}m` : '-'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Kuota / Progress */}
            <SeatProgressBar 
              totalSeat={schedule.seat_total || 0}
              bookedSeat={(schedule.seat_total || 0) - (schedule.seat_sisa || 0)}
            />
          </div>
        </div>

        {/* Pricing & Expanded CTA */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/30">
          <div className="flex justify-between items-end mb-1.5">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-neutral-500 font-medium block">Harga Mulai Dari</span>
                {discountPercent > 0 && (
                  <span 
                    className="bg-danger-600 text-white text-[11px] font-bold pl-3 pr-2 py-0.5 rounded-r-sm leading-none flex items-center"
                    style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 6px 100%, 0 50%)' }}
                  >
                    Diskon {discountPercent}%
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg md:text-xl font-extrabold text-brand">
                  {formatRupiah(price)}
                </span>
                {originalPrice && originalPrice > price && (
                  <span className="text-[11px] md:text-xs text-neutral-400 line-through">
                    {formatRupiah(originalPrice)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-neutral-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Expanded Content Area */}
          {isExpanded && (
            <div 
              className="mt-4 space-y-4 pt-3 border-t border-neutral-200 animate-dropdown"
              onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking inside expanded area
            >
              {/* Grid 8 Tombol */}
              <div className="grid grid-cols-4 gap-2">
                {/* 1. Itinerary */}
                <button
                  onClick={() => setIsItineraryModalOpen(true)}
                  disabled={!schedule.itinerary_id}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-neutral-200 transition-colors ${!schedule.itinerary_id ? 'opacity-50 cursor-not-allowed bg-neutral-50' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}
                >
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  <span className="text-xs font-medium">Itinerary</span>
                </button>



                {/* 3. Fasilitas */}
                <button
                  title="Segera hadir"
                  disabled
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-neutral-200 transition-colors opacity-50 cursor-not-allowed bg-neutral-50"
                >
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span className="text-xs font-medium">Fasilitas</span>
                </button>



                {/* 7. Compare */}
                <button
                  title="Segera hadir"
                  disabled
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-neutral-200 transition-colors opacity-50 cursor-not-allowed bg-neutral-50"
                >
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  <span className="text-xs font-medium">Compare</span>
                </button>

                {/* 8. Bagikan */}
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  <span className="text-xs font-medium">Bagikan</span>
                </button>
              </div>

              {/* Rincian Biaya Paket */}
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200">
                  <h4 className="font-bold text-xs text-neutral-800">Rincian Biaya Paket</h4>
                </div>
                <div className="divide-y divide-neutral-100">
                  <div className="flex justify-between items-center px-3 py-2 text-xs">
                    <span className="text-neutral-600">Quad (Sekamar 4)</span>
                    <span className="font-semibold text-neutral-900">{formatRupiah(schedule.harga_quad)}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 text-xs">
                    <span className="text-neutral-600">Triple (Sekamar 3)</span>
                    <span className="font-semibold text-neutral-900">{formatRupiah(schedule.harga_triple)}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 text-xs">
                    <span className="text-neutral-600">Double (Sekamar 2)</span>
                    <span className="font-semibold text-neutral-900">{formatRupiah(schedule.harga_double)}</span>
                  </div>
                </div>
              </div>



              {/* Nego Section */}
              <div className="bg-warning-50 rounded-lg p-3 border border-warning-100 flex flex-col items-center text-center mb-4">
                <span className="text-sm font-bold text-warning-900 mb-1">Berangkat &gt; 1 Jamaah?</span>
                <span className="text-xs text-warning-700 mb-3">Dapatkan penawaran harga khusus untuk rombongan!</span>
                <a 
                  href={brandWhatsapp ? `https://wa.me/${brandWhatsapp.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Assalamu'alaikum, saya berencana mendaftar lebih dari 1 jamaah untuk paket *${name}*. Apakah ada penawaran harga khusus?`)}` : '#'}
                  target={brandWhatsapp ? "_blank" : ""}
                  rel="noopener noreferrer"
                  className="w-full py-2 px-4 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 shadow-sm bg-warning-500 hover:bg-warning-600 text-white active:scale-[0.99]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                  Ajukan Negosiasi
                </a>
              </div>

              {/* Brand Contact Box */}
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 flex flex-col items-center text-center">

                
                <div className="w-full">
                  <WhatsAppButton 
                    brandWhatsapp={brandWhatsapp}
                    packageName={name}
                  />
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      <ItineraryModal 
        itineraryId={schedule.itinerary_id}
        isOpen={isItineraryModalOpen}
        onClose={() => setIsItineraryModalOpen(false)}
      />
    </>
  );
}
