'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import HomeAppSlider from './HomeAppSlider';
import HomePackageSearch from './HomePackageSearch';
import HomeAppFlashSale from './HomeAppFlashSale';
import HomeAppWhyChooseUs from './HomeAppWhyChooseUs';
import HomeAppTestimonial from './HomeAppTestimonial';
import HomeAppWhatsAppCard from './HomeAppWhatsAppCard';
import HomeAppCard from './HomeAppCard';

export default function HomeAppClient({
  initialSchedules = [],
  brandName = 'Travel Umroh',
  brandWhatsapp = '',
  brandLogoUrl = '',
  brandLegal = 'Izin Resmi PPIU Kemenag RI'
}) {
  const rawList = initialSchedules || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [activeChip, setActiveChip] = useState('all');
  const packageSectionRef = useRef(null);

  // Available unique months from data
  const availableMonths = useMemo(() => {
    const map = new Map();
    rawList.forEach((s) => {
      if (s.berangkat_tanggal) {
        const d = new Date(s.berangkat_tanggal);
        const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        if (!map.has(id)) {
          map.set(id, { id, label, time: d.getTime() });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.time - b.time);
  }, [rawList]);

  const filteredSchedules = useMemo(() => {
    let result = [...rawList];

    // 1. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const nameMatch = s.jadwal_nama?.toLowerCase().includes(q);
        const airlineMatch = s.maskapai?.name?.toLowerCase().includes(q);
        const hotelMekkahMatch = s.hotel_mekkah?.name?.toLowerCase().includes(q);
        const hotelMadinahMatch = s.hotel_madinah?.name?.toLowerCase().includes(q);
        return nameMatch || airlineMatch || hotelMekkahMatch || hotelMadinahMatch;
      });
    }

    // 2. Month filter
    if (selectedMonth !== 'all') {
      result = result.filter((s) => {
        if (!s.berangkat_tanggal) return false;
        const d = new Date(s.berangkat_tanggal);
        const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return id === selectedMonth;
      });
    }

    // 3. Duration filter
    if (selectedDuration !== 'all') {
      result = result.filter((s) => {
        if (!s.berangkat_tanggal || !s.pulang_tanggal) return false;
        const days = Math.round((new Date(s.pulang_tanggal) - new Date(s.berangkat_tanggal)) / 86400000) + 1;
        if (selectedDuration === '9-10') return days >= 9 && days <= 10;
        if (selectedDuration === '11-13') return days >= 11 && days <= 13;
        if (selectedDuration === '14+') return days >= 14;
        return true;
      });
    }

    // 4. Price range filter
    if (selectedPriceRange !== 'all') {
      result = result.filter((s) => {
        const p = s.harga_quad || 0;
        if (selectedPriceRange === 'under_30') return p < 30000000;
        if (selectedPriceRange === '30_40') return p >= 30000000 && p <= 40000000;
        if (selectedPriceRange === 'above_40') return p > 40000000;
        return true;
      });
    }

    // 5. Quick filter chips
    if (activeChip === 'promo') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter((item) => {
        const isExpired = item.promo_until && item.promo_until < today;
        return item.is_promo === true && !isExpired;
      });
    } else if (activeChip === 'flash_sale') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter((item) => {
        return item.is_promo === true && (item.promo_until ? item.promo_until >= today : true);
      });
    } else if (activeChip === 'hampir_penuh') {
      result = result.filter((item) => item.seat_sisa > 0 && item.seat_sisa <= 10);
    } else if (activeChip === 'banyak_dicari') {
      result = [...result].sort((a, b) => {
        if (b.views !== undefined && a.views !== undefined && b.views !== a.views) {
          return b.views - a.views;
        }
        return (a.seat_sisa || 0) - (b.seat_sisa || 0);
      });
    }

    return result.slice(0, 8);
  }, [rawList, searchQuery, selectedMonth, selectedDuration, selectedPriceRange, activeChip]);

  const handleSearchSubmit = () => {
    if (packageSectionRef.current) {
      packageSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedMonth('all');
    setSelectedDuration('all');
    setSelectedPriceRange('all');
    setActiveChip('all');
  };

  const QUICK_FILTERS = [
    { id: 'all', label: 'Semua' },
    {
      id: 'promo',
      label: 'Promo',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      iconColor: 'text-amber-500'
    },
    {
      id: 'flash_sale',
      label: 'Flash Sale',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconColor: 'text-rose-600'
    },
    {
      id: 'hampir_penuh',
      label: 'Hampir Penuh',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
      iconColor: 'text-orange-500'
    },
    {
      id: 'banyak_dicari',
      label: 'Banyak Dicari',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      iconColor: 'text-neutral-700'
    },
  ];

  return (
    <div className="w-full flex flex-col bg-white pb-6">
      {/* ━━━ 1. Hero Slider Section ━━━ */}
      <HomeAppSlider brandWhatsapp={brandWhatsapp} />

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-3" />

      {/* ━━━ 2. Fitur Pencarian Paket (Seamless) ━━━ */}
      <HomePackageSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
        selectedPriceRange={selectedPriceRange}
        onPriceRangeChange={setSelectedPriceRange}
        availableCount={rawList.length}
        availableMonths={availableMonths}
        onSubmit={handleSearchSubmit}
      />

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-3" />

      {/* ━━━ 3. Daftar Paket Populer ━━━ */}
      <div className="w-full flex flex-col gap-3" ref={packageSectionRef}>
        {/* Section Header */}
        <div className="w-full px-4 flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-[15px] font-extrabold text-neutral-900 leading-tight">
              Pilihan Paket Populer
            </h2>
            <p className="text-[11px] text-neutral-500 font-medium leading-tight mt-0.5">
              Jadwal pasti dan fasilitas hotel dekat masjid
            </p>
          </div>
          <Link
            href="/paket"
            className="text-[11.5px] text-brand font-bold hover:underline flex items-center gap-0.5 shrink-0"
          >
            Lihat Semua &gt;
          </Link>
        </div>

        {/* Quick Filter Chips Row */}
        <div className="w-full px-4 flex flex-row gap-1.5 items-center overflow-x-auto no-scrollbar scrollbar-none scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
          {QUICK_FILTERS.map((chip) => {
            const isActive = activeChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveChip(chip.id)}
                className={`w-fit shrink-0 flex flex-row gap-1 px-3 py-1.5 justify-start items-center rounded-full text-[10.5px] transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand text-white border border-brand font-bold shadow-2xs'
                    : 'bg-neutral-50 border border-neutral-200/80 text-neutral-600 font-medium hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {chip.icon && (
                  <span className={isActive ? 'text-white' : chip.iconColor}>
                    {chip.icon}
                  </span>
                )}
                <span className={isActive ? 'font-bold' : 'font-medium'}>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Package Grid (2-Kolom Seamless) */}
        {filteredSchedules.length === 0 ? (
          <div className="mx-4 p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
            <svg className="w-8 h-8 text-neutral-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-neutral-500 font-medium">Tidak ada paket yang sesuai dengan filter pencarian.</p>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-bold text-brand hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 w-full px-4">
            {filteredSchedules.map((schedule) => (
              <HomeAppCard
                key={schedule.id}
                schedule={schedule}
                brandWhatsapp={brandWhatsapp}
                brandName={brandName}
              />
            ))}
          </div>
        )}
      </div>

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-4" />

      {/* ━━━ 4. Promo Spesial Banner ━━━ */}
      <HomeAppFlashSale
        brandWhatsapp={brandWhatsapp}
        promoSchedule={rawList.find((s) => s.is_promo) || null}
      />

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-4" />

      {/* ━━━ 5. Keunggulan Layanan (Seamless) ━━━ */}
      <HomeAppWhyChooseUs />

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-4" />

      {/* ━━━ 6. Kisah Jamaah Kami (Seamless) ━━━ */}
      <HomeAppTestimonial brandName={brandName} />

      {/* ━━━ Hairline Divider ━━━ */}
      <div className="border-t border-neutral-100 my-4" />

      {/* ━━━ 7. Konsultasi CS WhatsApp (Seamless) ━━━ */}
      <HomeAppWhatsAppCard brandWhatsapp={brandWhatsapp} brandName={brandName} />
    </div>
  );
}
