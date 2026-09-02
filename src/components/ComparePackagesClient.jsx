'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

const formatRupiah = (value) => {
  if (value === null || value === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatDate = (value) => {
  if (!value) return '-';
  try {
    const d = new Date(value);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};

const getDurationDays = (schedule) => {
  if (!schedule?.berangkat_tanggal || !schedule?.pulang_tanggal) return 0;
  return Math.round((new Date(schedule.pulang_tanggal) - new Date(schedule.berangkat_tanggal)) / 86400000) + 1;
};

const renderStarRating = (starCount) => {
  const stars = parseInt(starCount, 10) || 0;
  if (stars <= 0) return null;
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {[...Array(Math.min(5, stars))].map((_, i) => (
        <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// Komponen Custom Dropdown Autocomplete (100% Sama dengan Input Field Form Login)
function PackageAutocompleteDropdown({
  label,
  schedules = [],
  selectedId,
  onSelect,
  disabledId,
  placeholder = 'Pilih Paket'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedSchedule = schedules.find((s) => String(s.id) === String(selectedId));

  // Filter paket berdasarkan kata kunci pencarian
  const filteredSchedules = useMemo(() => {
    if (!searchTerm.trim()) return schedules;
    const term = searchTerm.toLowerCase();
    return schedules.filter((s) => {
      const nameMatch = s.jadwal_nama?.toLowerCase().includes(term);
      const airlineMatch = s.maskapai?.name?.toLowerCase().includes(term);
      const dateMatch = formatDate(s.berangkat_tanggal)?.toLowerCase().includes(term);
      const hotelMatch = s.hotel_mekkah?.name?.toLowerCase().includes(term) || s.hotel_madinah?.name?.toLowerCase().includes(term);
      return nameMatch || airlineMatch || dateMatch || hotelMatch;
    });
  }, [schedules, searchTerm]);

  // Handle klik di luar popover untuk menutup dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemSelect = (id) => {
    onSelect(String(id));
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label mengikuti style form login */}
      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      {/* Tombol Pemicu Custom Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-xl border bg-white text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0 ${
          isOpen
            ? 'border-brand'
            : 'border-neutral-200 hover:border-brand focus:border-brand'
        }`}
      >
        <div className="min-w-0 flex-1">
          {selectedSchedule ? (
            <div>
              <p className="font-bold text-xs md:text-sm text-neutral-900 truncate leading-snug">
                {selectedSchedule.jadwal_nama}
              </p>
              <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                {formatDate(selectedSchedule.berangkat_tanggal)} • {selectedSchedule.maskapai?.name || 'Maskapai'} • {formatRupiah(selectedSchedule.harga_quad)}
              </p>
            </div>
          ) : (
            <span className="text-xs text-neutral-400 font-medium">{placeholder}</span>
          )}
        </div>

        <svg 
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel Floating Popover Dropdown Autocomplete */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-dropdown">
          {/* Kolom Pencarian Autocomplete */}
          <div className="p-3 border-b border-neutral-100 bg-neutral-50/60">
            <div className="relative flex items-center">
              <svg className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari paket, maskapai, tanggal..."
                className="w-full px-4 py-2.5 pl-10 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:outline-none focus:ring-0 focus:border-brand hover:border-brand transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 text-neutral-400 hover:text-neutral-600 text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* List Pilihan Paket yang Dapat Di-scroll */}
          <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 p-1.5">
            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((s) => {
                const isCurrent = String(s.id) === String(selectedId);
                const isDisabled = String(s.id) === String(disabledId);

                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleItemSelect(s.id)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors ${
                      isCurrent
                        ? 'bg-brand/10 text-neutral-900 font-bold'
                        : isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-neutral-50'
                        : 'hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-neutral-900 truncate">
                          {s.jadwal_nama}
                        </span>
                        {isDisabled && (
                          <span className="text-[9px] font-bold text-neutral-500 bg-neutral-200 px-1.5 py-0.2 rounded">
                            Sedang Dipilih
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                        <span>{formatDate(s.berangkat_tanggal)}</span>
                        <span>•</span>
                        <span>{s.maskapai?.name || 'Maskapai'}</span>
                        <span>•</span>
                        <span className="font-bold text-neutral-900">{formatRupiah(s.harga_quad)}</span>
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-neutral-400 italic">
                Tidak ada paket yang sesuai dengan pencarian
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Komponen Baris Perbandingan dengan highlight warna saja
function CompareRow({ label, left, right, isWinnerLeft = false, isWinnerRight = false }) {
  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <div className="bg-neutral-50/70 px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-t border-neutral-100 first:border-t-0">
        {label}
      </div>
      <div className="grid grid-cols-2 divide-x divide-neutral-200">
        <div className={`p-3.5 text-xs ${isWinnerLeft ? 'bg-emerald-50/70 text-emerald-950 font-medium' : 'text-neutral-700'}`}>
          <div>{left}</div>
        </div>
        <div className={`p-3.5 text-xs ${isWinnerRight ? 'bg-emerald-50/70 text-emerald-950 font-medium' : 'text-neutral-700'}`}>
          <div>{right}</div>
        </div>
      </div>
    </div>
  );
}

// Komponen Tampilan Maskapai
function AirlineDisplay({ schedule }) {
  if (!schedule) return '-';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const logoUrl = schedule?.maskapai?.logo_url 
    ? (schedule.maskapai.logo_url.startsWith('http') ? schedule.maskapai.logo_url : `${apiBaseUrl}${schedule.maskapai.logo_url}`)
    : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img src={logoUrl} alt={schedule.maskapai?.name} className="w-6 h-6 object-contain rounded-full border border-neutral-200" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.2 3c-.2.5.1 1 .6 1.2L9 13l-4 4-2.8-.9c-.5-.2-1 .2-1.1.7l-.4 1.4c-.1.5.2 1 .7 1.1l4 1.1 1.1 4c.1.5.6.8 1.1.7l1.4-.4c.5-.1.9-.6.7-1.1L8.8 20l4-4 1.9 5.9c.2.5.7.8 1.2.6l3-1.2c.5-.2.8-.6.7-1.1z"/>
            </svg>
          </div>
        )}
        <span className="font-bold text-neutral-900">{schedule.maskapai?.name || '-'}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200/80">
          {schedule.is_direct_flight ? 'Direct' : 'Transit'}
        </span>
        {schedule.is_ticket_confirmed && (
          <span className="text-[9px] font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded-full">
            Confirmed
          </span>
        )}
      </div>
    </div>
  );
}

// Komponen Tampilan Rute Penerbangan
function FlightRouteDisplay({ schedule, direction = 'departure' }) {
  const isDeparture = direction === 'departure';
  const origin = isDeparture ? schedule.berangkat_bandara_asal : schedule.pulang_bandara_asal;
  const destination = isDeparture ? schedule.berangkat_bandara_tujuan : schedule.pulang_bandara_tujuan;
  const flightCode = isDeparture ? schedule.berangkat_kode_penerbangan : schedule.pulang_kode_penerbangan;
  const transit = !schedule.is_direct_flight ? schedule.transit_bandara : '';

  if (!origin && !destination) return <span className="text-neutral-400">-</span>;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 font-bold text-neutral-900 flex-wrap">
        <span>{origin || '-'}</span>
        <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <span>{destination || '-'}</span>
      </div>
      {transit && (
        <span className="inline-block text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
          Transit {transit}
        </span>
      )}
      {flightCode && (
        <p className="text-[10px] text-neutral-500 font-mono">
          Kode: {flightCode}
        </p>
      )}
    </div>
  );
}

// Komponen Tampilan Hotel
function HotelCardDisplay({ hotel, city = 'Mekkah' }) {
  if (!hotel?.name) return <span className="text-neutral-400">Belum ditentukan</span>;

  return (
    <div className="space-y-1">
      <p className="font-bold text-neutral-900 leading-snug">{hotel.name}</p>
      {hotel.star_rating > 0 && renderStarRating(hotel.star_rating)}
      <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-0.5">
        <svg className="w-3 h-3 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{city} (±{hotel.distance_m || '500'}m)</span>
      </div>
    </div>
  );
}

// Komponen List Fasilitas
function FacilitiesList({ items = [], isIncluded = true }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    return <span className="text-neutral-400 text-xs italic">Belum tersedia data</span>;
  }

  return (
    <ul className="space-y-2">
      {list.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2">
          {isIncluded ? (
            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <span className={`text-xs ${isIncluded ? 'text-neutral-800 font-medium' : 'text-neutral-500'}`}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ComparePackagesClient({ 
  schedules = [], 
  initialPackageId = '', 
  initialOpponentId = '',
  brandWhatsapp = '6281234567890',
  brandName = 'Travel Umroh'
}) {
  // Paket A
  const [selectedIdA, setSelectedIdA] = useState(() => {
    const found = schedules.find((s) => String(s.id) === String(initialPackageId));
    return found ? String(found.id) : (schedules[0] ? String(schedules[0].id) : '');
  });

  // Paket B
  const [selectedIdB, setSelectedIdB] = useState(() => {
    const found = schedules.find((s) => String(s.id) === String(initialOpponentId) && String(s.id) !== String(initialPackageId));
    if (found) return String(found.id);
    const fallback = schedules.find((s) => String(s.id) !== String(initialPackageId));
    return fallback ? String(fallback.id) : '';
  });

  const packageA = schedules.find((s) => String(s.id) === String(selectedIdA)) || null;
  const packageB = schedules.find((s) => String(s.id) === String(selectedIdB)) || null;

  // Update URL parameters dynamically
  useEffect(() => {
    if (selectedIdA && selectedIdB) {
      const params = new URLSearchParams({ paket: selectedIdA, lawan: selectedIdB });
      window.history.replaceState(null, '', `/compare?${params.toString()}`);
    }
  }, [selectedIdA, selectedIdB]);

  // Swap handler
  const handleSwap = () => {
    const temp = selectedIdA;
    setSelectedIdA(selectedIdB);
    setSelectedIdB(temp);
  };

  const getWhatsAppUrl = (pkg) => {
    if (!pkg) return '#';
    const text = `Halo ${brandName}, saya tertarik untuk konsultasi paket *${pkg.jadwal_nama}* (Keberangkatan: ${formatDate(pkg.berangkat_tanggal)}). Mohon informasi ketersediaan kursi & pendaftarannya.`;
    return `https://wa.me/${brandWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  if (schedules.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center shadow-xs">
        <p className="font-bold text-neutral-800">Belum ada paket umroh yang tersedia untuk dibandingkan.</p>
        <Link href="/" className="inline-block mt-4 text-xs font-bold text-rose-600 hover:underline">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Perhitungan Keunggulan Komparatif (Hanya untuk flag boolean warna)
  const priceQuadA = Number(packageA?.harga_quad) || 0;
  const priceQuadB = Number(packageB?.harga_quad) || 0;
  const isQuadCheaperA = priceQuadA > 0 && priceQuadB > 0 && priceQuadA < priceQuadB;
  const isQuadCheaperB = priceQuadA > 0 && priceQuadB > 0 && priceQuadB < priceQuadA;

  const durationA = getDurationDays(packageA);
  const durationB = getDurationDays(packageB);

  return (
    <div className="space-y-5">
      {/* 1. SELEKTOR PAKET INSTAN DENGAN CUSTOM AUTOCOMPLETE DROPDOWN */}
      <section className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-4">
          {/* Custom Dropdown Paket A */}
          <PackageAutocompleteDropdown
            label="Paket Utama (A)"
            schedules={schedules}
            selectedId={selectedIdA}
            onSelect={(id) => setSelectedIdA(id)}
            disabledId={selectedIdB}
            placeholder="Pilih Paket Utama (A)"
          />

          {/* Tombol Swap VS Berwarna Brand */}
          <div className="flex justify-center md:pt-6">
            <button
              type="button"
              onClick={handleSwap}
              disabled={!selectedIdB}
              title="Tukar Posisi Paket (Swap A & B)"
              className="w-9 h-9 rounded-full bg-brand hover:brightness-95 active:scale-95 text-white font-black text-xs flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              VS
            </button>
          </div>

          {/* Custom Dropdown Paket B */}
          <PackageAutocompleteDropdown
            label="Lawan Banding (B)"
            schedules={schedules}
            selectedId={selectedIdB}
            onSelect={(id) => setSelectedIdB(id)}
            disabledId={selectedIdA}
            placeholder="Pilih Lawan Banding (B)"
          />
        </div>
      </section>

      {/* Jika Belum Ada Paket B yang Dipilih */}
      {!packageB && (
        <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="font-bold text-sm text-neutral-900">Pilih Paket Pembanding (B)</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Silakan pilih paket kedua pada dropdown autocomplete di atas untuk melihat perbandingan fasilitas, hotel, dan harga secara berdampingan.
          </p>
        </div>
      )}

      {/* HASIL PERBANDINGAN BERDAMPINGAN */}
      {packageA && packageB && (
        <div className="space-y-4">
          {/* 2. HERO COMPARISON SUMMARY CARDS DENGAN TOMBOL WARNA BRAND */}
          <section className="grid grid-cols-2 gap-3 md:gap-4">
            {/* Kartu Hero Paket A */}
            <div className={`rounded-2xl border p-4 md:p-5 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden transition-colors ${isQuadCheaperA ? 'bg-emerald-50/40 border-emerald-300/80' : 'bg-white border-neutral-200'}`}>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-white bg-neutral-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                  Paket A
                </span>
                <h3 className="font-bold text-sm md:text-base text-neutral-900 leading-snug line-clamp-2">
                  {packageA.jadwal_nama}
                </h3>
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Mulai Dari</span>
                  <p className={`text-base md:text-xl font-black font-sans tracking-tight ${isQuadCheaperA ? 'text-emerald-700' : 'text-neutral-900'}`}>
                    {formatRupiah(packageA.harga_quad)}
                  </p>
                </div>
              </div>

              {/* Tombol CTA Warna Brand */}
              <a
                href={getWhatsAppUrl(packageA)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-brand hover:brightness-95 active:brightness-90 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-xs text-center cursor-pointer"
              >
                <span>Pilih Paket A</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            {/* Kartu Hero Paket B */}
            <div className={`rounded-2xl border p-4 md:p-5 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden transition-colors ${isQuadCheaperB ? 'bg-emerald-50/40 border-emerald-300/80' : 'bg-white border-neutral-200'}`}>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-white bg-neutral-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                  Paket B
                </span>
                <h3 className="font-bold text-sm md:text-base text-neutral-900 leading-snug line-clamp-2">
                  {packageB.jadwal_nama}
                </h3>
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Mulai Dari</span>
                  <p className={`text-base md:text-xl font-black font-sans tracking-tight ${isQuadCheaperB ? 'text-emerald-700' : 'text-neutral-900'}`}>
                    {formatRupiah(packageB.harga_quad)}
                  </p>
                </div>
              </div>

              {/* Tombol CTA Warna Brand */}
              <a
                href={getWhatsAppUrl(packageB)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-brand hover:brightness-95 active:brightness-90 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-xs text-center cursor-pointer"
              >
                <span>Pilih Paket B</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </section>

          {/* 3. SEKSI 1: PENERBANGAN & JADWAL */}
          <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="bg-neutral-900 px-4 py-2.5 text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.2 3c-.2.5.1 1 .6 1.2L9 13l-4 4-2.8-.9c-.5-.2-1 .2-1.1.7l-.4 1.4c-.1.5.2 1 .7 1.1l4 1.1 1.1 4c.1.5.6.8 1.1.7l1.4-.4c.5-.1.9-.6.7-1.1L8.8 20l4-4 1.9 5.9c.2.5.7.8 1.2.6l3-1.2c.5-.2.8-.6.7-1.1z"/>
              </svg>
              <h4 className="font-bold text-xs uppercase tracking-wider">Jadwal & Penerbangan</h4>
            </div>

            <CompareRow 
              label="Durasi Perjalanan" 
              left={`${durationA} Hari`} 
              right={`${durationB} Hari`}
              isWinnerLeft={durationA > durationB}
              isWinnerRight={durationB > durationA}
            />
            <CompareRow 
              label="Tanggal Keberangkatan" 
              left={formatDate(packageA.berangkat_tanggal)} 
              right={formatDate(packageB.berangkat_tanggal)} 
            />
            <CompareRow 
              label="Tanggal Kepulangan" 
              left={formatDate(packageA.pulang_tanggal)} 
              right={formatDate(packageB.pulang_tanggal)} 
            />
            <CompareRow 
              label="Maskapai" 
              left={<AirlineDisplay schedule={packageA} />} 
              right={<AirlineDisplay schedule={packageB} />} 
              isWinnerLeft={packageA.is_direct_flight && !packageB.is_direct_flight}
              isWinnerRight={packageB.is_direct_flight && !packageA.is_direct_flight}
            />
            <CompareRow 
              label="Rute Berangkat" 
              left={<FlightRouteDisplay schedule={packageA} direction="departure" />} 
              right={<FlightRouteDisplay schedule={packageB} direction="departure" />} 
            />
            <CompareRow 
              label="Rute Pulang" 
              left={<FlightRouteDisplay schedule={packageA} direction="return" />} 
              right={<FlightRouteDisplay schedule={packageB} direction="return" />} 
            />
          </section>

          {/* 4. SEKSI 2: AKOMODASI HOTEL */}
          <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="bg-neutral-900 px-4 py-2.5 text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h4 className="font-bold text-xs uppercase tracking-wider">Akomodasi Hotel</h4>
            </div>

            <CompareRow 
              label="Hotel Mekkah" 
              left={<HotelCardDisplay hotel={packageA.hotel_mekkah} city="Mekkah" />} 
              right={<HotelCardDisplay hotel={packageB.hotel_mekkah} city="Mekkah" />}
              isWinnerLeft={Number(packageA.hotel_mekkah?.distance_m || 9999) < Number(packageB.hotel_mekkah?.distance_m || 9999)}
              isWinnerRight={Number(packageB.hotel_mekkah?.distance_m || 9999) < Number(packageA.hotel_mekkah?.distance_m || 9999)}
            />
            <CompareRow 
              label="Hotel Madinah" 
              left={<HotelCardDisplay hotel={packageA.hotel_madinah} city="Madinah" />} 
              right={<HotelCardDisplay hotel={packageB.hotel_madinah} city="Madinah" />}
              isWinnerLeft={Number(packageA.hotel_madinah?.distance_m || 9999) < Number(packageB.hotel_madinah?.distance_m || 9999)}
              isWinnerRight={Number(packageB.hotel_madinah?.distance_m || 9999) < Number(packageA.hotel_madinah?.distance_m || 9999)}
            />
          </section>

          {/* 5. SEKSI 3: HARGA & KUOTA */}
          <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="bg-neutral-900 px-4 py-2.5 text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-bold text-xs uppercase tracking-wider">Harga Kamar & Ketersediaan</h4>
            </div>

            <CompareRow 
              label="Sisa Kuota Kursi" 
              left={<span className="font-bold">{packageA.seat_sisa || 0} pax <span className="text-neutral-400 font-normal">dari {packageA.seat_total || 0}</span></span>} 
              right={<span className="font-bold">{packageB.seat_sisa || 0} pax <span className="text-neutral-400 font-normal">dari {packageB.seat_total || 0}</span></span>} 
            />
            <CompareRow 
              label="Harga Quad (Sekamar 4)" 
              left={<span className="font-extrabold text-sm">{formatRupiah(packageA.harga_quad)}</span>} 
              right={<span className="font-extrabold text-sm">{formatRupiah(packageB.harga_quad)}</span>} 
              isWinnerLeft={Number(packageA.harga_quad) < Number(packageB.harga_quad)}
              isWinnerRight={Number(packageB.harga_quad) < Number(packageA.harga_quad)}
            />
            <CompareRow 
              label="Harga Triple (Sekamar 3)" 
              left={<span className="font-extrabold text-sm">{formatRupiah(packageA.harga_triple)}</span>} 
              right={<span className="font-extrabold text-sm">{formatRupiah(packageB.harga_triple)}</span>} 
              isWinnerLeft={Number(packageA.harga_triple) < Number(packageB.harga_triple)}
              isWinnerRight={Number(packageB.harga_triple) < Number(packageA.harga_triple)}
            />
            <CompareRow 
              label="Harga Double (Sekamar 2)" 
              left={<span className="font-extrabold text-sm">{formatRupiah(packageA.harga_double)}</span>} 
              right={<span className="font-extrabold text-sm">{formatRupiah(packageB.harga_double)}</span>} 
              isWinnerLeft={Number(packageA.harga_double) < Number(packageB.harga_double)}
              isWinnerRight={Number(packageB.harga_double) < Number(packageA.harga_double)}
            />
          </section>

          {/* 6. SEKSI 4: FASILITAS SUDAH & BELUM TERMASUK */}
          <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="bg-neutral-900 px-4 py-2.5 text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-bold text-xs uppercase tracking-wider">Fasilitas Termasuk & Belum Termasuk</h4>
            </div>

            <CompareRow 
              label="Sudah Termasuk (Include)" 
              left={<FacilitiesList items={packageA.include_items} isIncluded={true} />} 
              right={<FacilitiesList items={packageB.include_items} isIncluded={true} />} 
            />
            <CompareRow 
              label="Belum Termasuk (Exclude)" 
              left={<FacilitiesList items={packageA.exclude_items} isIncluded={false} />} 
              right={<FacilitiesList items={packageB.exclude_items} isIncluded={false} />} 
            />
          </section>
        </div>
      )}
    </div>
  );
}
