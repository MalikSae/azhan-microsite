import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import SeatProgressBar from '@/components/SeatProgressBar';
import ShareButton from '@/components/ShareButton';

async function getSchedule(id) {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) return null;
  const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const res = await fetch(`${baseUrl}/api/schedules/${numericId}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Gagal memuat detail paket: ' + res.status + ' ' + res.statusText + ' URL: ' + baseUrl + '/api/schedules/' + numericId);
  }
  return res.json();
}

async function getItinerary(itineraryId) {
  if (!itineraryId) return null;
  const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const res = await fetch(`${baseUrl}/api/itineraries/${itineraryId}`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const schedule = await getSchedule(resolvedParams.id);
  if (!schedule) return { title: 'Paket Tidak Ditemukan' };

  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Azhan Travel';
  const domain = headerList.get('host') || 'azhan.test';
  
  // Format SLUG for Canonical
  const slug = `${schedule.id}-${schedule.jadwal_nama.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const url = `https://${domain}/paket/${slug}`;

  // Geo / Destinasi
  const kotaBerangkat = schedule.berangkat_bandara_asal || 'Jakarta';
  const dest1 = schedule.hotel_mekkah?.name ? 'Makkah' : '';
  const dest2 = schedule.hotel_madinah?.name ? 'Madinah' : '';
  const dest3 = schedule.transit_hotels?.length > 0 ? (schedule.transit_hotels[0].kota || 'Dubai') : '';
  const destinations = [dest1, dest2, dest3].filter(Boolean).join(', ');

  const title = `Paket Umroh ${schedule.jadwal_nama} | ${brandName}`;
  const description = `Paket Umroh ${schedule.jadwal_nama} bersama ${brandName}. Keberangkatan dari ${kotaBerangkat} menuju ${destinations}. Mulai dari Rp ${(schedule.harga_quad || 0).toLocaleString('id-ID')}. Pesan sekarang kursi terbatas!`;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const ogImageUrl = schedule.brosur_thumb_url ? (schedule.brosur_thumb_url.startsWith('http') ? schedule.brosur_thumb_url : `${apiBaseUrl}${schedule.brosur_thumb_url}`) : '/default-og-image.jpg';

  return {
    title,
    description,
    keywords: `Paket Umroh ${brandName}, Umroh ${schedule.jadwal_nama}, Umroh dari ${kotaBerangkat}, Umroh ${destinations}, Travel Umroh Terbaik`,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: brandName,
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 800,
          alt: `Brosur Paket Umroh ${schedule.jadwal_nama}`,
        },
      ],
      locale: 'id_ID',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
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

function renderStars(count) {
  return (
    <div className="flex gap-0.5 mt-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`w-2.5 h-2.5 ${i < count ? 'text-amber-400' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default async function PackageDetailPage({ params }) {
  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Azhan Travel';
  const brandId = headerList.get('x-brand-id') || 'default';
  const brandColor = headerList.get('x-brand-color') || '#3b82f6';
  const brandIcon = `/brand-icon?brand=${encodeURIComponent(brandId)}`;

  const resolvedParams = await params;
  const schedule = await getSchedule(resolvedParams.id);
  
  if (!schedule) {
    notFound();
  }

  const itinerary = await getItinerary(schedule.itinerary_id);
  
  // Calculate durations and states
  const departureStr = formatDate(schedule.berangkat_tanggal);
  const returnStr = formatDate(schedule.pulang_tanggal);
  let durationDays = 0;
  if (schedule.berangkat_tanggal && schedule.pulang_tanggal) {
    durationDays = Math.round((new Date(schedule.pulang_tanggal) - new Date(schedule.berangkat_tanggal)) / (1000 * 60 * 60 * 24)) + 1;
  }
  
  const price = schedule.harga_quad;
  const originalPrice = schedule.harga_coret;
  const isPromo = schedule.is_promo || (originalPrice && originalPrice > price);

  const seatTotal = schedule.seat_total || 0;
  const seatSisa = schedule.seat_sisa || 0;
  const seatTerisi = Math.max(0, seatTotal - seatSisa);

  // Discount calc
  let discountBadge = null;
  if (isPromo && originalPrice && originalPrice > price) {
    const diff = originalPrice - price;
    if (diff >= 1000000) {
      const diffJt = diff / 1000000;
      discountBadge = `DISKON ${Math.round(diffJt)} JUTA`;
    } else if (diff >= 1000) {
      discountBadge = `DISKON ${Math.round(diff / 1000)} RIBU`;
    } else {
      const percentage = Math.round((diff / originalPrice) * 100);
      discountBadge = `${percentage}%`;
    }
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const airlineLogoUrl = schedule?.maskapai?.logo_url 
    ? (schedule.maskapai.logo_url.startsWith('http') ? schedule.maskapai.logo_url : `${apiBaseUrl}${schedule.maskapai.logo_url}`)
    : null;

  const getHotelPhotoUrl = (hotel, defaultImg) => {
    if (!hotel?.photo_url) return defaultImg;
    return hotel.photo_url.startsWith('http') ? hotel.photo_url : `${apiBaseUrl}${hotel.photo_url}`;
  };

  const hotelMekkahPhotoUrl = getHotelPhotoUrl(schedule?.hotel_mekkah, null);
  const hotelMadinahPhotoUrl = getHotelPhotoUrl(schedule?.hotel_madinah, null);

  const waLink = `https://wa.me/6281234567890?text=Halo%20${encodeURIComponent(brandName)},%20saya%20tertarik%20dengan%20Paket%20Umroh%20${encodeURIComponent(schedule.jadwal_nama)}%20(ID:%20${schedule.id}).%20Mohon%20info%20lebih%20lanjut.`;

  // Structured Data (JSON-LD)
  const canonicalUrl = `https://${headerList.get('host') || 'azhan.test'}/paket/${schedule.id}-${schedule.jadwal_nama.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Paket Umroh ${schedule.jadwal_nama}`,
    image: schedule.brosur_thumb_url ? (schedule.brosur_thumb_url.startsWith('http') ? schedule.brosur_thumb_url : `${apiBaseUrl}${schedule.brosur_thumb_url}`) : undefined,
    description: `Paket Umroh ${schedule.jadwal_nama} bersama ${brandName}. Keberangkatan dari ${schedule.berangkat_bandara_asal || 'Jakarta'}.`,
    brand: {
      '@type': 'Brand',
      name: brandName
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'IDR',
      price: schedule.harga_quad || 0,
      availability: seatTerisi < seatTotal ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      seller: {
        '@type': 'Organization',
        name: brandName
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] pb-24 md:pb-12 font-sans text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navbar / Header Simple */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-3">
            <Link href="/paket" className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="h-5 w-px bg-neutral-200 mx-1"></div>
            <div className="flex items-center gap-2">
               <img src={brandIcon} alt={brandName} className="w-7 h-7 object-contain rounded" />
               <span className="font-bold text-neutral-900 text-[13px]">{brandName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden sm:block">
              <span className="font-medium text-neutral-500 text-xs truncate max-w-[200px] block text-right pr-2">
                {schedule.jadwal_nama}
              </span>
            </div>
            <Link 
              href={`/compare?paket=${schedule.id}`} 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
              title="Bandingkan Paket"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </Link>
            <ShareButton url={canonicalUrl} title={`Paket Umroh ${schedule.jadwal_nama}`} />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl md:mt-6 md:px-4">
        {/* === FIX: Removed items-start so children can stretch, or use relative flex items === */}
        <div className="flex flex-col md:flex-row gap-5 md:gap-6 relative">
          
          {/* ======================================= */}
          {/* KOLOM KIRI (KONTEN UTAMA - 65%)         */}
          {/* ======================================= */}
          <div className="w-full md:w-[65%] bg-white flex flex-col md:rounded-2xl shadow-sm border-y md:border border-neutral-100 overflow-hidden">
            
            {/* Section 1: HERO SECTION */}
            <div className="p-4 md:p-5 relative border-b border-neutral-100">

              
              <h1 className="text-lg md:text-xl font-bold text-neutral-900 leading-snug mb-3 sm:pr-16">
                {schedule.jadwal_nama}
              </h1>
              
              <div className="flex items-center gap-2 text-[12px] text-neutral-500 font-medium">
                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{departureStr} - {returnStr}</span>
                <span className="text-neutral-300">|</span>
                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{durationDays} Hari</span>
              </div>


            </div>

            {/* MOBILE ONLY: PROMO & SEAT ALERT (CRO) */}
            <div className="md:hidden p-4 md:p-5 border-b border-neutral-100 bg-orange-50/50">
              <div className="flex items-center gap-2 mb-1">
                {isPromo && originalPrice > price && (
                  <>
                    <span className="text-xs text-red-500 font-medium line-through decoration-red-500/50">{formatRupiah(originalPrice)}</span>
                    {discountBadge && (
                      <div 
                        className="relative inline-flex items-center bg-red-600 text-white font-black text-[10px] uppercase tracking-tight py-0.5 pl-2.5 pr-2 rounded-r shadow-sm leading-none"
                        style={{ clipPath: 'polygon(5px 0%, 100% 0%, 100% 100%, 5px 100%, 0% 50%)' }}
                      >
                        <span>{discountBadge}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold text-neutral-900 leading-none tracking-tight">{formatRupiah(price)}</span>
                <span className="text-[12px] text-neutral-500 font-medium">/ pax</span>
              </div>
              
              <SeatProgressBar 
                totalSeat={seatTotal}
                bookedSeat={seatTerisi}
                seatTotal={seatTotal} 
                seatTerisi={seatTerisi} 
                seatSisa={seatSisa} 
              />
            </div>

            {/* Section 2: DETAIL PENERBANGAN */}
            <div className="p-4 md:p-5 border-b border-neutral-100">
              
              {/* Accordion Flight Details */}
              <details className="group bg-white overflow-hidden [&_summary::-webkit-details-marker]:hidden" open>
                
                <summary className="flex items-center justify-between py-2 cursor-pointer select-none">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-white shadow-sm border border-neutral-100 flex items-center justify-center p-2 shrink-0">
                      {airlineLogoUrl ? (
                        <img src={airlineLogoUrl} alt={schedule.maskapai?.name} className="w-full h-full object-contain" />
                      ) : (
                        <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Maskapai Penerbangan</span>
                      <h3 className="font-bold text-neutral-900 text-[15px] sm:text-[16px] leading-tight max-w-[180px] sm:max-w-none break-words">
                        {schedule.maskapai?.name || 'Menyusul'}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {schedule.is_ticket_confirmed && (
                          <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm tracking-wide">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.25 13.5l-4-4 1.5-1.5 2.5 2.5 5.5-5.5 1.5 1.5-7 7z" clipRule="evenodd"/></svg>
                            Tiket Confirmed
                          </span>
                        )}
                        {schedule.is_direct_flight && (
                          <span className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm tracking-wide">
                            <svg className="w-3 h-3 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            Direct
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Chevron icon */}
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </summary>

                <div className="pt-4 sm:pt-5 mt-2 border-t border-neutral-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 sm:divide-x sm:divide-neutral-100">
                {/* Keberangkatan */}
                <div className="flex flex-col relative sm:pr-8">
                  {/* Content */}
                  <div className="flex flex-col mb-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-bold text-neutral-900">{formatDate(schedule.berangkat_tanggal)}</p>
                      {schedule.berangkat_kode_penerbangan && (
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide">
                          {schedule.berangkat_kode_penerbangan}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-neutral-500 mt-0.5">{schedule.berangkat_jam || 'Menyusul'} Waktu Lokal</p>
                  </div>
                  
                  {/* Route */}
                  {(schedule.berangkat_bandara_asal || schedule.berangkat_bandara_tujuan) && (
                    <div className="mt-auto flex items-center gap-3 text-[14px] font-bold text-neutral-800">
                      <span>{schedule.berangkat_bandara_asal || '???'}</span>
                      <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      {schedule.transit_bandara && (
                        <>
                          <span className="text-neutral-500 font-semibold">{schedule.transit_bandara.replace(/(Berangkat:\s*|Pulang:\s*)/gi, '')}</span>
                          <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </>
                      )}
                      <span>{schedule.berangkat_bandara_tujuan || '???'}</span>
                    </div>
                  )}
                </div>

                {/* Kepulangan */}
                <div className="flex flex-col sm:pl-8">
                  {/* Content */}
                  <div className="flex flex-col mb-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-bold text-neutral-900">{schedule.pulang_tanggal ? formatDate(schedule.pulang_tanggal) : 'Menyusul'}</p>
                      {schedule.pulang_kode_penerbangan && (
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide">
                          {schedule.pulang_kode_penerbangan}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-neutral-500 mt-0.5">{schedule.pulang_jam || 'Menyusul'} Waktu Lokal</p>
                  </div>
                  
                  {/* Route */}
                  {(schedule.pulang_bandara_asal || schedule.pulang_bandara_tujuan) && (
                    <div className="mt-auto flex items-center gap-3 text-[14px] font-bold text-neutral-800">
                      <span>{schedule.pulang_bandara_asal || '???'}</span>
                      <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      <span>{schedule.pulang_bandara_tujuan || '???'}</span>
                    </div>
                  )}
                </div>
              </div>
                </div>
              </details>
            </div>

            {/* Section 3: AKOMODASI */}
            <div className="p-4 md:p-5 border-b border-neutral-100">
              
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Mekkah */}
                <div className="flex flex-col gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl w-[75%] sm:w-[240px] shrink-0 snap-start">
                  <div className="w-full h-32 sm:h-36 rounded-lg overflow-hidden shrink-0 shadow-sm border border-black/5 bg-slate-100 flex items-center justify-center">
                    {hotelMekkahPhotoUrl ? (
                      <img src={hotelMekkahPhotoUrl} alt={schedule.hotel_mekkah?.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-slate-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
                        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
                        <path d="M12 4v6" />
                        <path d="M2 18h20" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Makkah</span>
                      {schedule.hotel_mekkah?.name && (
                        <span className="text-[11px] text-neutral-500 font-medium whitespace-nowrap">
                          ±{schedule.hotel_mekkah.distance_m || '500'}m
                        </span>
                      )}
                    </div>
                    <span className="text-[14px] font-bold text-neutral-900 truncate">{schedule.hotel_mekkah?.name || 'Menyusul'}</span>
                    {schedule.hotel_mekkah?.star_rating > 0 && (
                      <div className="mt-1">{renderStars(schedule.hotel_mekkah.star_rating)}</div>
                    )}
                  </div>
                </div>
                
                {/* Madinah */}
                <div className="flex flex-col gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl w-[75%] sm:w-[240px] shrink-0 snap-start">
                  <div className="w-full h-32 sm:h-36 rounded-lg overflow-hidden shrink-0 shadow-sm border border-black/5 bg-slate-100 flex items-center justify-center">
                    {hotelMadinahPhotoUrl ? (
                      <img src={hotelMadinahPhotoUrl} alt={schedule.hotel_madinah?.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-slate-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
                        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
                        <path d="M12 4v6" />
                        <path d="M2 18h20" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Madinah</span>
                      {schedule.hotel_madinah?.name && (
                        <span className="text-[11px] text-neutral-500 font-medium whitespace-nowrap">
                          ±{schedule.hotel_madinah.distance_m || '350'}m
                        </span>
                      )}
                    </div>
                    <span className="text-[14px] font-bold text-neutral-900 truncate">{schedule.hotel_madinah?.name || 'Menyusul'}</span>
                    {schedule.hotel_madinah?.star_rating > 0 && (
                      <div className="mt-1">{renderStars(schedule.hotel_madinah.star_rating)}</div>
                    )}
                  </div>
                </div>
                
                {/* Transit Hotels */}
                {schedule.transit_hotels?.map((hotel, idx) => {
                  const hotelPhotoUrl = getHotelPhotoUrl(hotel, null);
                  return (
                    <div key={`transit-${idx}`} className="flex flex-col gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl w-[75%] sm:w-[240px] shrink-0 snap-start">
                      <div className="w-full h-32 sm:h-36 rounded-lg overflow-hidden shrink-0 shadow-sm border border-black/5 bg-slate-100 flex items-center justify-center">
                        {hotelPhotoUrl ? (
                          <img src={hotelPhotoUrl} alt={hotel.nama || hotel.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-10 h-10 text-slate-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
                            <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
                            <path d="M12 4v6" />
                            <path d="M2 18h20" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{hotel.kota || 'Transit'}</span>
                          {hotel.distance_m != null && (
                            <span className="text-[11px] text-neutral-500 font-medium whitespace-nowrap">
                              ±{hotel.distance_m}m
                            </span>
                          )}
                        </div>
                        <span className="text-[14px] font-bold text-neutral-900 truncate">{hotel.nama || hotel.name || 'Menyusul'}</span>
                        {hotel.star_rating > 0 && (
                          <div className="mt-1">{renderStars(hotel.star_rating)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: FASILITAS */}
            <div className="p-4 md:p-5 border-b border-neutral-100">
              <div className="mb-5">
                <h2 className="font-bold text-neutral-900 text-[16px]">Fasilitas Paket</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Termasuk */}
                <div>
                  <h3 className="text-[13px] font-bold text-neutral-800 mb-3 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    Sudah Termasuk
                  </h3>
                  <ul className="space-y-2.5">
                    {schedule.include_items?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[13px] text-neutral-600">
                        <span className="text-emerald-500 mt-2 rounded-full w-1 h-1 bg-emerald-500 shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Tidak Termasuk */}
                <div>
                  <h3 className="text-[13px] font-bold text-neutral-800 mb-3 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                    Belum Termasuk
                  </h3>
                  <ul className="space-y-2.5">
                    {schedule.exclude_items?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[13px] text-neutral-500">
                        <span className="text-neutral-300 mt-2 rounded-full w-1 h-1 bg-neutral-300 shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 5: ITINERARY */}
            <div className="p-4 md:p-5">
              <div className="mb-5">
                <h2 className="font-bold text-neutral-900 text-[16px]">Itinerary</h2>
              </div>
              
              {!itinerary ? (
                <p className="text-[14px] text-neutral-500 bg-neutral-50 p-4 rounded-xl border border-neutral-100">Jadwal harian detail belum tersedia untuk paket ini.</p>
              ) : (
                <div className="space-y-0">
                  {itinerary.days?.map((day, idx) => (
                    <div key={idx} className="relative pl-7 pb-6 last:pb-0">
                      {/* Timeline Line */}
                      {idx !== itinerary.days.length - 1 && (
                        <div className="absolute left-[9px] top-7 bottom-0 w-px bg-slate-200"></div>
                      )}
                      
                      {/* Timeline Dot */}
                      <div className="absolute left-[5.5px] top-2 w-2 h-2 rounded-full border-2 bg-white ring-4 ring-white z-10" style={{ borderColor: brandColor }}></div>
                      
                      <div className="flex flex-col mb-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <h4 className="font-bold text-neutral-900 text-[13px]">
                          Hari {day.day_number}: {day.title}
                        </h4>
                        {day.location && (
                          <span className="text-[12px] font-medium mt-0.5" style={{ color: brandColor }}>
                            {day.location}
                          </span>
                        )}
                      </div>
                      
                      {day.activities && day.activities.length > 0 ? (
                        <div className="space-y-3 pl-3">
                          {day.activities.map((act, i) => (
                            <div key={i} className="flex items-start gap-3 text-[13px]">
                              <span className="w-12 shrink-0 font-medium text-[12px] mt-0.5 opacity-80" style={{ color: brandColor }}>
                                {act.time || '-'}
                              </span>
                              <p className="text-neutral-600 leading-relaxed">{act.text || act.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[13px] text-neutral-400 italic pl-3">Acara bebas / perjalanan.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ======================================= */}
          {/* KOLOM KANAN (STICKY CHECKOUT - 35%)     */}
          {/* ======================================= */}
          <div className="w-full md:w-[35%] md:sticky md:top-[88px] flex flex-col gap-4 self-start z-10 px-4 md:px-0 pb-6 md:pb-0">
              
            {/* PRICING CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 md:p-5">
              
              {/* Harga Top Section */}
              <div className="mb-5 pb-5 border-b border-neutral-100">
                <div className="flex items-center gap-2 mb-1">
                  {isPromo && originalPrice > price && (
                    <>
                      <span className="text-xs text-red-500 font-medium line-through decoration-red-500/50">{formatRupiah(originalPrice)}</span>
                      {discountBadge && (
                        <div 
                          className="relative inline-flex items-center bg-red-600 text-white font-black text-[10px] uppercase tracking-tight py-0.5 pl-2.5 pr-2 rounded-r shadow-sm leading-none"
                          style={{ clipPath: 'polygon(5px 0%, 100% 0%, 100% 100%, 5px 100%, 0% 50%)' }}
                        >
                          <span>{discountBadge}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-neutral-900 leading-none tracking-tight">{formatRupiah(price)}</span>
                  <span className="text-[12px] text-neutral-500 font-medium">/ pax</span>
                </div>
                
                {/* Progress Bar Kuota */}
                <div className="mt-5">
                  <SeatProgressBar 
                    totalSeat={seatTotal}
                    bookedSeat={seatTerisi}
                    seatTotal={seatTotal} 
                    seatTerisi={seatTerisi} 
                    seatSisa={seatSisa} 
                  />
                </div>
              </div>

              {/* Harga Tipe Kamar Desktop */}
              <div className="mb-6 bg-slate-50/50 rounded-xl p-4 border border-slate-100/50">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Opsi Tipe Kamar</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-slate-600 font-medium">Quad <span className="text-slate-400 font-normal">(Sekamar Ber-4)</span></span>
                    <span className="text-[13px] font-bold text-neutral-900">{formatRupiah(schedule.harga_quad)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-slate-600 font-medium">Triple <span className="text-slate-400 font-normal">(Sekamar Ber-3)</span></span>
                    <span className="text-[13px] font-medium text-slate-700">{formatRupiah(schedule.harga_triple)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-slate-600 font-medium">Double <span className="text-slate-400 font-normal">(Sekamar Ber-2)</span></span>
                    <span className="text-[13px] font-medium text-slate-700">{formatRupiah(schedule.harga_double)}</span>
                  </div>
                </div>
              </div>

              {/* CTA Desktop */}
              <a 
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.086 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                Tanya via WA
              </a>
            </div>

            {/* Value Stack Desktop */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 md:p-5 hidden md:block">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-neutral-800">Pasti Berangkat</span>
                    <span className="text-[12px] text-neutral-500 mt-0.5 leading-relaxed">Jadwal dan tiket pesawat sudah dikonfirmasi maskapai.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-neutral-800">Akomodasi Premium</span>
                    <span className="text-[12px] text-neutral-500 mt-0.5 leading-relaxed">Menginap di hotel pilihan terdekat dengan masjid.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-neutral-800">All-In Services</span>
                    <span className="text-[12px] text-neutral-500 mt-0.5 leading-relaxed">Tidak ada biaya tersembunyi. Semua layanan ibadah dicakup.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* STICKY BOTTOM CTA - HANYA MUNCUL DI MOBILE (md:hidden) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-50 md:hidden">
        <div className="container mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5">
              {isPromo && originalPrice > price && (
                <>
                  <span className="text-[11px] text-red-500 font-medium line-through decoration-red-500/50">{formatRupiah(originalPrice)}</span>
                  {discountBadge && (
                    <div 
                      className="relative inline-flex items-center bg-red-600 text-white font-black text-[9px] uppercase tracking-tight py-0.5 pl-2.5 pr-2 rounded-r shadow-sm leading-none"
                      style={{ clipPath: 'polygon(5px 0%, 100% 0%, 100% 100%, 5px 100%, 0% 50%)' }}
                    >
                      <span>{discountBadge}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-neutral-900 leading-none">{formatRupiah(price)}</span>
              <span className="text-[10px] text-neutral-500 font-medium">/ pax</span>
            </div>
          </div>
          
          <a 
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors text-sm whitespace-nowrap"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.086 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
            Tanya
          </a>
        </div>
      </div>
    </div>
  );
}
