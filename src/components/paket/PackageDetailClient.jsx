'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import SeatProgressBar from '@/components/SeatProgressBar';

function formatRupiah(number) {
  if (!number) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getVideoEmbedUrl(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&controls=1`;
  }
  return null;
}

export default function PackageDetailClient({
  schedule = {},
  brandName = 'Travel Umroh',
  brandWhatsapp = '6281211829993',
  brandLegal = 'Izin Resmi PPIU Kemenag RI',
  brandPpiu = '',
  itinerary = null,
  canonicalUrl = '',
  isCutoff = false,
}) {
  const [activeRoom, setActiveRoom] = useState('quad');
  const [isItineraryExpanded, setIsItineraryExpanded] = useState(false);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [facilityTab, setFacilityTab] = useState('included');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFlightExpanded, setIsFlightExpanded] = useState(false);
  const [videoModal, setVideoModal] = useState({ isOpen: false, hotelName: '', videoUrl: '' });

  // Escape key & scroll lock for Video Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && videoModal.isOpen) {
        setVideoModal({ isOpen: false, hotelName: '', videoUrl: '' });
      }
    };
    if (videoModal.isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [videoModal.isOpen]);

  // Sync bookmark state with localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && schedule?.id) {
        const saved = localStorage.getItem(`azhan_bookmark_${schedule.id}`);
        if (saved === 'true') {
          setIsBookmarked(true);
        }
      }
    } catch {
      // ignore
    }
  }, [schedule?.id]);

  const toggleBookmark = () => {
    setIsBookmarked((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined' && schedule?.id) {
          if (next) {
            localStorage.setItem(`azhan_bookmark_${schedule.id}`, 'true');
          } else {
            localStorage.removeItem(`azhan_bookmark_${schedule.id}`);
          }
        }
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleShare = async () => {
    const shareUrl =
      canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const shareTitle = `${schedule.jadwal_nama || 'Paket Umroh'} - ${brandName}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share cancelled or unsupported
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const toggleDay = (idx) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Dynamic Facilities from Dashboard (include_items & exclude_items)
  const includeList = useMemo(() => {
    const raw = schedule?.include_items;
    if (Array.isArray(raw)) return raw.filter((item) => typeof item === 'string' && item.trim().length > 0);
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string' && item.trim().length > 0);
      } catch {
        return raw.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }, [schedule?.include_items]);

  const excludeList = useMemo(() => {
    const raw = schedule?.exclude_items;
    if (Array.isArray(raw)) return raw.filter((item) => typeof item === 'string' && item.trim().length > 0);
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string' && item.trim().length > 0);
      } catch {
        return raw.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }, [schedule?.exclude_items]);

  // Hero image from dashboard uploaded brochure
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const getFullImg = (url, fallback) => {
    if (!url || typeof url !== 'string' || !url.trim()) return fallback;
    return url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  };

  const heroImageUrl = useMemo(() => {
    const raw = schedule?.brosur_url || schedule?.brosur_thumb_url;
    return getFullImg(raw, '/images/hero-makkah.jpg');
  }, [schedule?.brosur_url, schedule?.brosur_thumb_url, apiBaseUrl]);

  // Hotel photo resolver with matching database logos fallback
  const getHotelPhoto = (hotel, fallback) => {
    if (hotel?.photo_url) return getFullImg(hotel.photo_url, fallback);
    const name = (hotel?.name || '').toLowerCase();
    if (name.includes('movenpick') || name.includes('mövenpick')) {
      return getFullImg('/uploads/hotel-logos/movenpick.png', fallback);
    }
    if (name.includes('hilton') || name.includes('doubletree')) {
      return getFullImg('/uploads/hotel-logos/doubletree.png', fallback);
    }
    if (name.includes('anjum')) {
      return getFullImg('/uploads/hotel-logos/anjum.png', fallback);
    }
    if (name.includes('fairmont')) {
      return getFullImg('/uploads/hotel-logos/fairmont.png', fallback);
    }
    if (name.includes('voco')) {
      return getFullImg('/uploads/hotel-logos/voco.png', fallback);
    }
    if (name.includes('dallah')) {
      return getFullImg('/uploads/hotel-logos/dallah-taibah.png', fallback);
    }
    return fallback;
  };

  // Extract clean PPIU Number from database (ppiu_number or legalitas)
  const ppiuNumber = useMemo(() => {
    if (brandPpiu && typeof brandPpiu === 'string' && brandPpiu.trim()) {
      return brandPpiu.trim().replace(/^No\.?\s*/i, '');
    }
    if (brandLegal && typeof brandLegal === 'string') {
      const match = brandLegal.match(/PPIU(?:.*?No\.?|\s+No\.?|:)?\s*([^\s|,]+)/i);
      if (match && match[1]) {
        return match[1].trim().replace(/^No\.?\s*/i, '');
      }
    }
    return '484/2020';
  }, [brandPpiu, brandLegal]);

  // Dates & Durations
  const departureStr = formatDate(schedule.berangkat_tanggal);
  const returnStr = formatDate(schedule.pulang_tanggal);
  let durationDays = 0;
  if (schedule.berangkat_tanggal && schedule.pulang_tanggal) {
    durationDays =
      Math.round(
        (new Date(schedule.pulang_tanggal) - new Date(schedule.berangkat_tanggal)) /
          (1000 * 60 * 60 * 24)
      ) + 1;
  }

  // Active Price based on selected room
  const activePrice = useMemo(() => {
    if (activeRoom === 'triple') return schedule.harga_triple || schedule.harga_quad;
    if (activeRoom === 'double') return schedule.harga_double || schedule.harga_quad;
    return schedule.harga_quad;
  }, [activeRoom, schedule]);

  const originalPrice = schedule.harga_coret;
  const isPromo = Boolean(schedule.is_promo);

  // Discount computation
  let discountBadge = null;
  if (isPromo && originalPrice && originalPrice > schedule.harga_quad) {
    const diff = originalPrice - schedule.harga_quad;
    if (diff >= 1000000) {
      const millions = diff / 1000000;
      const formatted = Number.isInteger(millions) ? millions.toString() : millions.toFixed(1).replace('.', ',');
      discountBadge = `HEMAT ${formatted} JUTA`;
    } else if (diff >= 1000) {
      discountBadge = `HEMAT ${Math.round(diff / 1000)} RB`;
    } else {
      discountBadge = `DISKON ${Math.round((diff / originalPrice) * 100)}%`;
    }
  }

  // Dynamic savings text for sticky bottom action bar (e.g. "Hemat 4,5 Juta!")
  const savingsText = useMemo(() => {
    if (!originalPrice) return null;
    const diff = originalPrice > activePrice 
      ? originalPrice - activePrice 
      : (originalPrice > (schedule.harga_quad || 0) ? originalPrice - (schedule.harga_quad || 0) : 0);

    if (diff <= 0) return null;

    if (diff >= 1000000) {
      const millions = diff / 1000000;
      const formatted = Number.isInteger(millions)
        ? millions.toString()
        : millions.toFixed(1).replace('.', ',');
      return `Hemat ${formatted} Juta!`;
    }
    if (diff >= 1000) {
      return `Hemat ${Math.round(diff / 1000)} Rb!`;
    }
    return null;
  }, [originalPrice, activePrice, schedule.harga_quad]);

  // Compact formatted original price for sticky bottom action bar (e.g. "29,5 Jt")
  const formattedOriginalPrice = useMemo(() => {
    if (!originalPrice || originalPrice <= activePrice) return null;
    if (originalPrice >= 1000000) {
      const millions = originalPrice / 1000000;
      const formatted = Number.isInteger(millions)
        ? millions.toString()
        : millions.toFixed(1).replace('.', ',');
      return `${formatted} Jt`;
    }
    if (originalPrice >= 1000) {
      return `${Math.round(originalPrice / 1000)} Rb`;
    }
    return formatRupiah(originalPrice);
  }, [originalPrice, activePrice]);

  // Seats
  const seatTotal = schedule.seat_total || 0;
  const seatSisa = schedule.seat_sisa !== undefined ? schedule.seat_sisa : 0;
  const seatTerisi = Math.max(0, seatTotal - seatSisa);

  // WhatsApp CTA Link
  const roomNameMap = {
    quad: 'Quad (Sekamar Ber-4)',
    triple: 'Triple (Sekamar Ber-3)',
    double: 'Double (Sekamar Ber-2)',
  };
  const waText = encodeURIComponent(
    `Halo ${brandName}, saya tertarik dengan Paket Umroh "${schedule.jadwal_nama}" (${formatRupiah(activePrice)}). Mohon info pendaftaran dan ketersediaan kursi terbaru. Terima kasih.`
  );
  const waLink = `https://wa.me/${brandWhatsapp.replace(/[^0-9]/g, '')}?text=${waText}`;

  return (
    <div className="w-full flex flex-col bg-white">
      {/* ━━━ 1. Full-width Native Top App Bar ━━━ */}
      <header className="w-full h-[54px] shrink-0 flex flex-row justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 border-b border-neutral-100 shadow-2xs">
        {/* Left: Back Button + Title & Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/paket"
            className="w-[34px] h-[34px] flex justify-center items-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors shrink-0 shadow-2xs"
            title="Kembali ke Daftar Paket"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[13px] font-bold text-neutral-900 leading-none truncate">{brandName}</span>
              <svg className="w-3.5 h-3.5 text-[#1877F2] shrink-0" viewBox="0 0 24 24" fill="currentColor" title="Terverifikasi Resmi">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-[11px] text-neutral-500 font-medium leading-tight mt-0.5">Detail Paket</span>
          </div>
        </div>

        {/* Right: Actions (Tandai & Share) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Tandai / Bookmark Button */}
          <button
            type="button"
            onClick={toggleBookmark}
            aria-label={isBookmarked ? 'Hapus tanda paket' : 'Tandai paket'}
            title={isBookmarked ? 'Tersimpan di bookmark' : 'Tandai paket ini'}
            className={`w-[34px] h-[34px] flex justify-center items-center rounded-full transition-all active:scale-90 shadow-2xs cursor-pointer ${
              isBookmarked
                ? 'bg-amber-50 text-amber-500 border border-amber-200/80'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <svg
              className="w-[17px] h-[17px]"
              viewBox="0 0 24 24"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Bagikan paket"
            title={copied ? 'Tautan tersalin!' : 'Bagikan paket'}
            className={`w-[34px] h-[34px] flex justify-center items-center rounded-full transition-all active:scale-90 shadow-2xs cursor-pointer relative ${
              copied
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            {copied ? (
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
            {copied && (
              <span className="absolute -bottom-7 right-0 text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded shadow-md whitespace-nowrap z-40">
                Tersalin!
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ━━━ 2. Hero Image - Seamless Full-Bleed (Rasio 1:1) ━━━ */}
      <div className="w-full aspect-square relative bg-neutral-100 overflow-hidden border-b border-neutral-100">
        <img
          src={heroImageUrl}
          alt={schedule.jadwal_nama || 'Paket Umroh'}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/hero-makkah.jpg';
          }}
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>

      {/* ━━━ 3. Header Info, Brand Subtitle & Title (Seamless) ━━━ */}
      <div className="w-full px-4 pt-4 pb-1">
        {/* Big Package Title */}
        <h1 className="text-[20px] font-extrabold text-neutral-900 leading-snug tracking-tight">
          {schedule.jadwal_nama}
        </h1>

        {/* Departure, Duration & Airport Details */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-neutral-600 font-medium mt-1.5">
          <div className="flex items-center gap-1 text-neutral-800 font-semibold">
            <svg className="w-[13px] h-[13px] text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{departureStr} - {returnStr}</span>
          </div>
          <span className="text-neutral-300">•</span>
          <span className="font-bold text-brand">{durationDays} Hari</span>
          {schedule.is_direct_flight && (
            <>
              <span className="text-neutral-300">•</span>
              <span className="text-neutral-600">Direct</span>
            </>
          )}
        </div>

        {/* Trust Badges: Izin PPIU & 100% Pasti Berangkat */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold shadow-2xs">
            <svg className="w-3.5 h-3.5 fill-emerald-600 shrink-0" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Izin PPIU No. {ppiuNumber}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold shadow-2xs">
            <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>100% Pasti Berangkat</span>
          </div>
        </div>
      </div>

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-4" />

      {/* ━━━ 4. Pricing, Urgency & Room Selector (Seamless) ━━━ */}
      <div className="w-full px-4 space-y-3">
        {/* Price & Seat Progress (Mengikuti logika http://hana.azhan.test/paket) */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            {originalPrice && originalPrice > activePrice && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] text-rose-500 line-through font-semibold">
                  {formatRupiah(originalPrice)}
                </span>
                {discountBadge && (
                  <span className="text-[9.5px] bg-rose-600 text-white font-black px-1.5 py-0.5 rounded shadow-2xs">
                    {discountBadge}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] font-black text-neutral-900 tracking-tight leading-none">
                {formatRupiah(activePrice)}
              </span>
              <span className="text-[11.5px] text-neutral-500 font-medium">/ jamaah</span>
            </div>
          </div>
        </div>

        {/* Seat Occupancy Progress Bar */}
        <div className="w-full pt-1">
          <SeatProgressBar
            totalSeat={seatTotal}
            bookedSeat={seatTerisi}
            seatTotal={seatTotal}
            seatTerisi={seatTerisi}
            seatSisa={seatSisa}
          />
        </div>

        {/* Compare Packages Action */}
        <div className="pt-0.5">
          <Link
            href={`/compare?paket=${schedule.id}`}
            className="w-full py-2.5 px-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-150 border border-neutral-200/80 text-neutral-700 hover:text-neutral-900 text-[12px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-2xs group"
          >
            <svg
              className="w-4 h-4 text-neutral-500 group-hover:text-brand transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Bandingkan dengan Paket Lain</span>
          </Link>
        </div>
      </div>

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-4" />

      {/* ━━━ 5. Fasilitas & Akomodasi (Editorial Seamless Flow) ━━━ */}
      <div className="w-full px-4">
        <h2 className="text-[15px] font-extrabold text-neutral-900 leading-tight">
          Hotel &amp; Penerbangan
        </h2>

        <div className="mt-2 divide-y divide-neutral-100">
          {/* Hotel Makkah */}
          <div className="py-3 flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-[52px] h-[52px] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shrink-0 shadow-2xs">
                <img
                  src={getHotelPhoto(schedule.hotel_mekkah, '/images/bg-kaaba.webp')}
                  alt={schedule.hotel_mekkah?.name || 'Hotel Mekkah'}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/bg-kaaba.webp';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Hotel Mekkah
                  </span>
                  {schedule.hotel_mekkah?.star_rating > 0 && (
                    <span className="text-[10.5px] font-bold text-amber-500 shrink-0">
                      ★ {schedule.hotel_mekkah.star_rating}
                    </span>
                  )}
                </div>
                <h3 className="text-[13.5px] font-extrabold text-neutral-900 leading-snug mt-0.5 truncate">
                  {schedule.hotel_mekkah?.name || 'Hotel Pilihan Mekkah'}
                </h3>
                <p className="text-[11.5px] text-neutral-500 flex items-center gap-1.5 mt-0.5 truncate">
                  <svg className="w-3.5 h-3.5 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <circle cx="12" cy="11" r="3" />
                  </svg>
                  <span className="truncate">
                    {schedule.hotel_mekkah?.distance_m
                      ? `± ${schedule.hotel_mekkah.distance_m}m ke Masjidil Haram`
                      : 'Dekat pelataran Masjidil Haram'}
                  </span>
                </p>
              </div>
            </div>

            {schedule.hotel_mekkah?.video_url && (
              <button
                type="button"
                onClick={() => setVideoModal({
                  isOpen: true,
                  hotelName: schedule.hotel_mekkah.name,
                  videoUrl: schedule.hotel_mekkah.video_url
                })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200/90 text-neutral-700 hover:text-neutral-900 text-[11px] font-bold border border-neutral-200/90 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ml-2 shadow-2xs"
                title={`Tonton Video ${schedule.hotel_mekkah.name}`}
              >
                <svg className="w-2.5 h-2.5 fill-current text-neutral-600 shrink-0" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Video</span>
              </button>
            )}
          </div>

          {/* Hotel Madinah */}
          <div className="py-3 flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-[52px] h-[52px] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shrink-0 shadow-2xs">
                <img
                  src={getHotelPhoto(schedule.hotel_madinah, '/images/bg-kaaba-2.webp')}
                  alt={schedule.hotel_madinah?.name || 'Hotel Madinah'}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/bg-kaaba-2.webp';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Hotel Madinah
                  </span>
                  {schedule.hotel_madinah?.star_rating > 0 && (
                    <span className="text-[10.5px] font-bold text-amber-500 shrink-0">
                      ★ {schedule.hotel_madinah.star_rating}
                    </span>
                  )}
                </div>
                <h3 className="text-[13.5px] font-extrabold text-neutral-900 leading-snug mt-0.5 truncate">
                  {schedule.hotel_madinah?.name || 'Hotel Pilihan Madinah'}
                </h3>
                <p className="text-[11.5px] text-neutral-500 flex items-center gap-1.5 mt-0.5 truncate">
                  <svg className="w-3.5 h-3.5 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <circle cx="12" cy="11" r="3" />
                  </svg>
                  <span className="truncate">
                    {schedule.hotel_madinah?.distance_m
                      ? `± ${schedule.hotel_madinah.distance_m}m ke Masjid Nabawi`
                      : 'Dekat pelataran Masjid Nabawi'}
                  </span>
                </p>
              </div>
            </div>

            {schedule.hotel_madinah?.video_url && (
              <button
                type="button"
                onClick={() => setVideoModal({
                  isOpen: true,
                  hotelName: schedule.hotel_madinah.name,
                  videoUrl: schedule.hotel_madinah.video_url
                })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200/90 text-neutral-700 hover:text-neutral-900 text-[11px] font-bold border border-neutral-200/90 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ml-2 shadow-2xs"
                title={`Tonton Video ${schedule.hotel_madinah.name}`}
              >
                <svg className="w-2.5 h-2.5 fill-current text-neutral-600 shrink-0" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Video</span>
              </button>
            )}
          </div>

          {/* Penerbangan */}
          <div className="py-3">
            <div className="flex items-center gap-3.5">
              <div className="w-[52px] h-[52px] rounded-xl overflow-hidden bg-white border border-neutral-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                {schedule.maskapai?.logo_url ? (
                  <img
                    src={getFullImg(schedule.maskapai.logo_url)}
                    alt={schedule.maskapai?.name || 'Maskapai Penerbangan'}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider truncate">
                    Penerbangan
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFlightExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline shrink-0 cursor-pointer"
                  >
                    <span>{isFlightExpanded ? 'Tutup Rute' : 'Lihat Rute'}</span>
                    <svg
                      className={`w-3 h-3 text-brand transition-transform duration-200 ${isFlightExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <h3 className="text-[13.5px] font-extrabold text-neutral-900 leading-snug mt-0.5 truncate">
                  {schedule.maskapai?.name || 'Airlines Resmi Terjadwal'}
                </h3>
                <p className="text-[11.5px] text-neutral-500 flex items-center gap-1.5 mt-0.5 truncate">
                  <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="truncate">
                    {schedule.berangkat_bandara_asal || 'CGK'} ➔ {schedule.berangkat_bandara_tujuan || 'JED'}
                    {schedule.berangkat_kode_penerbangan ? ` (${schedule.berangkat_kode_penerbangan})` : ''}
                  </span>
                </p>
              </div>
            </div>

            {/* Expand / Collapse: Detail Rute Lengkap & Waktu Penerbangan */}
            {isFlightExpanded && (
              <div className="mt-3 p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/70 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {/* 1. Rute Berangkat */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-neutral-800">
                        Penerbangan Berangkat (Pergi)
                      </span>
                    </div>
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {schedule.is_direct_flight
                        ? 'Direct Flight'
                        : (schedule.transit_bandara
                            ? `Transit ${schedule.transit_bandara.replace(/^Berangkat:\s*/i, '')}`
                            : '1x Transit')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-neutral-200/70 shadow-2xs">
                    {/* Asal */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[16px] font-black text-neutral-900 leading-none">
                        {schedule.berangkat_bandara_asal || 'CGK'}
                      </span>
                      {schedule.berangkat_jam && (
                        <span className="text-[11.5px] font-bold text-emerald-700 mt-1 leading-tight">
                          {schedule.berangkat_jam.slice(0, 5)} WIB
                        </span>
                      )}
                      {schedule.berangkat_tanggal && (
                        <span className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                          {formatDate(schedule.berangkat_tanggal)}
                        </span>
                      )}
                    </div>

                    {/* Flight Path Graphic */}
                    <div className="flex-1 px-2.5 flex flex-col items-center min-w-0">
                      {schedule.berangkat_kode_penerbangan && (
                        <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.2 rounded leading-none truncate max-w-[110px]">
                          {schedule.berangkat_kode_penerbangan}
                        </span>
                      )}
                      <div className="w-full flex items-center my-1">
                        <div className="h-px flex-1 bg-neutral-300"></div>
                        <svg className="w-3.5 h-3.5 text-brand mx-1 transform rotate-90 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        <div className="h-px flex-1 bg-neutral-300"></div>
                      </div>
                      <span className="text-[9.5px] text-neutral-500 font-medium truncate max-w-[120px]">
                        {schedule.maskapai?.name || 'Airlines'}
                      </span>
                    </div>

                    {/* Tujuan */}
                    <div className="flex flex-col items-end text-right min-w-0">
                      <span className="text-[16px] font-black text-neutral-900 leading-none">
                        {schedule.berangkat_bandara_tujuan || 'JED'}
                      </span>
                      <span className="text-[10.5px] font-medium text-neutral-500 mt-1 leading-tight">
                        Kedatangan
                      </span>
                      {schedule.berangkat_tanggal && (
                        <span className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                          {formatDate(schedule.berangkat_tanggal)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Rute Pulang */}
                {(schedule.pulang_tanggal || schedule.pulang_bandara_asal || schedule.pulang_kode_penerbangan) && (
                  <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-neutral-800">
                          Penerbangan Pulang (Kembali)
                        </span>
                      </div>
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Kepulangan
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-neutral-200/70 shadow-2xs">
                      {/* Asal */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[16px] font-black text-neutral-900 leading-none">
                          {schedule.pulang_bandara_asal || 'JED'}
                        </span>
                        {schedule.pulang_jam && (
                          <span className="text-[11.5px] font-bold text-blue-700 mt-1 leading-tight">
                            {schedule.pulang_jam.slice(0, 5)}
                          </span>
                        )}
                        {schedule.pulang_tanggal && (
                          <span className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                            {formatDate(schedule.pulang_tanggal)}
                          </span>
                        )}
                      </div>

                      {/* Flight Path Graphic */}
                      <div className="flex-1 px-2.5 flex flex-col items-center min-w-0">
                        {schedule.pulang_kode_penerbangan && (
                          <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.2 rounded leading-none truncate max-w-[110px]">
                            {schedule.pulang_kode_penerbangan}
                          </span>
                        )}
                        <div className="w-full flex items-center my-1">
                          <div className="h-px flex-1 bg-neutral-300"></div>
                          <svg className="w-3.5 h-3.5 text-brand mx-1 transform rotate-90 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                          <div className="h-px flex-1 bg-neutral-300"></div>
                        </div>
                        <span className="text-[9.5px] text-neutral-500 font-medium truncate max-w-[120px]">
                          {schedule.maskapai?.name || 'Airlines'}
                        </span>
                      </div>

                      {/* Tujuan */}
                      <div className="flex flex-col items-end text-right min-w-0">
                        <span className="text-[16px] font-black text-neutral-900 leading-none">
                          {schedule.pulang_bandara_tujuan || 'CGK'}
                        </span>
                        <span className="text-[10.5px] font-medium text-neutral-500 mt-1 leading-tight">
                          Kedatangan
                        </span>
                        {schedule.pulang_tanggal && (
                          <span className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                            {formatDate(schedule.pulang_tanggal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Info Hotel Transit bila ada */}
                {schedule.transit_hotels && schedule.transit_hotels.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200/60 flex items-center gap-2 text-[11px] text-neutral-700">
                    <span className="font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                      Hotel Transit
                    </span>
                    <span className="truncate font-semibold text-neutral-800">
                      {schedule.transit_hotels[0].nama} ({schedule.transit_hotels[0].kota})
                      {schedule.transit_hotels[0].star_rating > 0 ? ` • ★ ${schedule.transit_hotels[0].star_rating}` : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-4" />

      {/* ━━━ 6. Rencana Perjalanan Itinerary (Seamless Editorial Flow) ━━━ */}
      <div className="w-full px-4 space-y-2">
        <h2 className="text-[15px] font-extrabold text-neutral-900 leading-tight">
          Rencana Perjalanan
        </h2>

        {itinerary?.days && itinerary.days.length > 0 ? (
          (() => {
            const displayedDays = isItineraryExpanded
              ? itinerary.days
              : itinerary.days.slice(0, 4);

            return (
              <div className="divide-y divide-neutral-100">
                {displayedDays.map((day, idx) => {
                  const isDayExpanded = expandedDays.has(idx);
                  const hasActivities = day.activities && day.activities.length > 0;

                  return (
                    <div key={idx} className="py-2.5 first:pt-1 last:pb-1">
                      <div
                        onClick={() => hasActivities && toggleDay(idx)}
                        className={`flex items-start justify-between gap-3 ${hasActivities ? 'cursor-pointer select-none group' : ''}`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Sleek Minimal Day Badge */}
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[8px] font-bold text-neutral-400 uppercase leading-none">HARI</span>
                            <span className="text-[12px] font-black text-neutral-900 leading-none mt-0.5">{day.day_number || idx + 1}</span>
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-[13px] font-bold text-neutral-900 leading-snug group-hover:text-brand transition-colors">
                              {day.title}
                            </h3>
                            {day.location && (
                              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                                {day.location}
                              </p>
                            )}
                          </div>
                        </div>

                        {hasActivities && (
                          <button
                            type="button"
                            className="text-neutral-400 group-hover:text-brand p-1 transition-colors shrink-0"
                            aria-label="Toggle rincian agenda"
                          >
                            <svg
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${isDayExpanded ? 'rotate-180 text-brand' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2.2"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Collapsible Activities Agenda — Seamless list, NO card box */}
                      {isDayExpanded && hasActivities && (
                        <div className="mt-2.5 ml-4 pl-7 space-y-1.5 border-l-2 border-brand/20">
                          {day.activities.map((act, actIdx) => (
                            <div key={actIdx} className="flex items-start gap-2 text-[11.5px]">
                              <span className="font-bold text-brand shrink-0 text-[10.5px] min-w-[42px]">
                                {act.time || '•'}
                              </span>
                              <span className="text-neutral-600 leading-relaxed">
                                {act.text || act.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Seamless Inline Expand / Collapse Action (NO card button) */}
                {itinerary.days.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setIsItineraryExpanded(!isItineraryExpanded)}
                    className="w-full py-3 text-brand text-[12px] font-bold hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>
                      {isItineraryExpanded
                        ? 'Sembunyikan Sebagian'
                        : `Lihat Seluruh ${itinerary.days.length} Hari Perjalanan`}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isItineraryExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })()
        ) : (
          <div className="py-2 flex items-center justify-between gap-3 text-neutral-600">
            <div className="flex flex-col">
              <span className="text-[12.5px] font-bold text-neutral-900">
                Itinerary Lengkap Harian
              </span>
              <span className="text-[11px] text-neutral-500">
                Hubungi konsultan untuk rincian kegiatan
              </span>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-bold text-emerald-700 hover:underline shrink-0"
            >
              Minta via WA ➔
            </a>
          </div>
        )}
      </div>

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-4" />

      {/* ━━━ 7. Fasilitas Termasuk & Belum Termasuk (Seamless Minimalis) ━━━ */}
      <div className="w-full px-4 space-y-2.5">
        <h2 className="text-[15px] font-extrabold text-neutral-900 leading-tight">
          Fasilitas Paket
        </h2>

        {/* Seamless Minimalist Underline Tabs */}
        <div className="flex items-center gap-6 border-b border-neutral-100">
          <button
            type="button"
            onClick={() => setFacilityTab('included')}
            className={`pb-2.5 flex items-center gap-1.5 text-[13px] transition-all border-b-2 -mb-px cursor-pointer ${
              facilityTab === 'included'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 font-medium'
            }`}
          >
            <span>Sudah Termasuk</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                facilityTab === 'included'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              {includeList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFacilityTab('excluded')}
            className={`pb-2.5 flex items-center gap-1.5 text-[13px] transition-all border-b-2 -mb-px cursor-pointer ${
              facilityTab === 'excluded'
                ? 'border-neutral-800 text-neutral-900 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 font-medium'
            }`}
          >
            <span>Belum Termasuk</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                facilityTab === 'excluded'
                  ? 'bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              {excludeList.length}
            </span>
          </button>
        </div>

        {/* Tab Content (Seamless Minimalist List Flow) */}
        {facilityTab === 'included' ? (
          <div>
            {includeList.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {includeList.map((item, idx) => (
                  <div
                    key={`inc-${idx}`}
                    className="py-2.5 flex items-start gap-3 first:pt-1 last:pb-1"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[13px] text-neutral-800 font-medium leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-[12px] text-neutral-400">
                  Belum ada rincian fasilitas yang disertakan
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {excludeList.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {excludeList.map((item, idx) => (
                  <div
                    key={`exc-${idx}`}
                    className="py-2.5 flex items-start gap-3 first:pt-1 last:pb-1"
                  >
                    <div className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-[13px] text-neutral-500 font-medium leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-[12px] text-neutral-400">
                  Tidak ada biaya tambahan yang dikecualikan
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-4" />

      {/* ━━━ 8. Jaminan Kenyamanan Ibadah (Modern Fluid Card Style) ━━━ */}
      <div className="w-full px-4 pb-6 space-y-3">
        <h2 className="text-[15px] font-extrabold text-neutral-900 leading-tight">
          Jaminan Kenyamanan Ibadah
        </h2>

        <div className="grid grid-cols-3 gap-2.5 pt-0.5">
          {/* Card 1: Pasti Berangkat */}
          <div className="p-3 rounded-2xl bg-gradient-to-b from-emerald-50/70 via-emerald-50/30 to-white border border-emerald-100/80 flex flex-col items-center text-center shadow-2xs transition-transform hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-white text-emerald-600 shadow-xs border border-emerald-100/80 flex items-center justify-center mb-2 shrink-0">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
            <span className="text-[12px] font-extrabold text-neutral-900 leading-tight">Pasti Berangkat</span>
            <span className="text-[10px] font-medium text-neutral-500 mt-1 leading-tight">Tiket terbit resmi</span>
          </div>

          {/* Card 2: Hotel Terjamin */}
          <div className="p-3 rounded-2xl bg-gradient-to-b from-blue-50/70 via-blue-50/30 to-white border border-blue-100/80 flex flex-col items-center text-center shadow-2xs transition-transform hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-white text-blue-600 shadow-xs border border-blue-100/80 flex items-center justify-center mb-2 shrink-0">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-[12px] font-extrabold text-neutral-900 leading-tight">Hotel Terjamin</span>
            <span className="text-[10px] font-medium text-neutral-500 mt-1 leading-tight">Sesuai brosur</span>
          </div>

          {/* Card 3: Bimbingan Ibadah */}
          <div className="p-3 rounded-2xl bg-gradient-to-b from-amber-50/70 via-amber-50/30 to-white border border-amber-100/80 flex flex-col items-center text-center shadow-2xs transition-transform hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-white text-amber-600 shadow-xs border border-amber-100/80 flex items-center justify-center mb-2 shrink-0">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-[12px] font-extrabold text-neutral-900 leading-tight">Bimbingan Ibadah</span>
            <span className="text-[10px] font-medium text-neutral-500 mt-1 leading-tight">Muthawif terlatih</span>
          </div>
        </div>
      </div>

      {/* ━━━ 9. Sticky Bottom Action Bar (Locked to max-w-md) ━━━ */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 backdrop-blur-md border-t border-x border-neutral-100 px-4 py-3 shadow-lg shadow-neutral-950/5 flex items-center justify-between gap-3">
        {/* Left: Dynamic Price per Active Room */}
        <div className="flex flex-col min-w-0">
          {isPromo || (originalPrice && originalPrice > activePrice) ? (
            <div className="flex items-center gap-1 text-[10.5px] xs:text-[11px] font-black text-rose-600 tracking-tight leading-tight whitespace-nowrap">
              <span>Promo Segera Berakhir!</span>
              <span className="text-amber-500 text-[11px]">⚡</span>
            </div>
          ) : (
            <div className="text-[10px] text-neutral-500 font-medium tracking-wide truncate">
              Mulai Dari
            </div>
          )}
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[16.5px] xs:text-[17px] font-black text-neutral-900 leading-none tracking-tight whitespace-nowrap">
              {formatRupiah(activePrice)}
            </span>
            {formattedOriginalPrice && (
              <span className="text-[11px] xs:text-[11.5px] font-semibold text-neutral-400 line-through leading-none whitespace-nowrap">
                {formattedOriginalPrice}
              </span>
            )}
            {!formattedOriginalPrice && (
              <span className="text-[10px] text-neutral-500 font-medium leading-none">/pax</span>
            )}
          </div>
        </div>

        {/* Right: CTAs (Booking Button di kiri, Chat WA icon-only solid hijau di kanan) */}
        <div className="flex items-center gap-2 shrink-0">
          {isCutoff ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[40px] px-4 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition-all text-[12px] font-bold shadow-xs"
            >
              <span>Booking via WA</span>
            </a>
          ) : (
            <Link
              href={`/paket/${schedule.id}/book?room=${activeRoom}`}
              className="h-[40px] px-4 flex items-center justify-center gap-1.5 rounded-xl bg-brand text-white hover:brightness-110 active:scale-95 transition-all text-[12px] font-bold shadow-xs"
            >
              <span>Booking Sekarang</span>
              <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="h-[40px] w-[40px] flex items-center justify-center rounded-xl bg-[#25D366] text-white hover:bg-[#20bd5a] active:scale-95 transition-all shadow-xs shrink-0 animate-wa-attention origin-center"
            title="Chat via WhatsApp"
            aria-label="Chat WhatsApp"
          >
            <svg className="w-[20px] h-[20px] fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.086 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </a>
        </div>
      </div>

      {/* ━━━ Video Modal ━━━ */}
      {videoModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setVideoModal({ isOpen: false, hotelName: '', videoUrl: '' })}
        >
          <div 
            className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 border-b border-neutral-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0 border border-neutral-700">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <h4 className="text-sm md:text-base font-bold text-white truncate">
                  Video Hotel {videoModal.hotelName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setVideoModal({ isOpen: false, hotelName: '', videoUrl: '' })}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Tutup modal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video Player Container (16:9) */}
            <div className="relative w-full aspect-video bg-black overflow-hidden">
              {getVideoEmbedUrl(videoModal.videoUrl) ? (
                <>
                  {/* Transparent top shield to block clicking video title / channel link */}
                  <div
                    className="absolute top-0 left-0 right-0 h-14 z-10 pointer-events-auto cursor-default"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                  <iframe
                    src={getVideoEmbedUrl(videoModal.videoUrl)}
                    title={`Video ${videoModal.hotelName}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allowFullScreen
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
                  <p className="text-sm">Video tidak dapat dimuat atau format URL tidak valid.</p>
                  <button
                    type="button"
                    onClick={() => setVideoModal({ isOpen: false, hotelName: '', videoUrl: '' })}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-800 text-neutral-200 text-xs font-semibold hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-neutral-900 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800">
              <span className="truncate">Klik tombol silang atau area luar untuk menutup</span>
              <button
                type="button"
                onClick={() => setVideoModal({ isOpen: false, hotelName: '', videoUrl: '' })}
                className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-medium transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
