'use client';

import React, { useState, useMemo } from 'react';
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
  const hasFilters = Boolean(searchQuery || selectedMonth !== 'all' || selectedDuration !== 'all' || selectedPriceRange !== 'all' || activeChip !== 'all');

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

    return result.slice(0, 4);
  }, [rawList, searchQuery, selectedMonth, selectedDuration, selectedPriceRange, activeChip]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedMonth('all');
    setSelectedDuration('all');
    setSelectedPriceRange('all');
    setActiveChip('all');
  };

  return (
    <div className="w-full flex flex-col bg-white pb-6">
      {/* ━━━ 1. Hero Slider Section ━━━ */}
      <HomeAppSlider brandWhatsapp={brandWhatsapp} />

      <div className="mt-4 w-full flex flex-col gap-3">
        {/* Section Header */}
        <div className="w-full px-4 flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-[15px] font-extrabold text-neutral-900 leading-tight">
              Paket Umroh
            </h2>
          </div>
          <Link
            href="/paket"
            className="text-[11.5px] text-brand font-bold hover:underline flex items-center gap-0.5 shrink-0"
          >
            Lihat Semua &gt;
          </Link>
        </div>

{rawList.length > 0 && (      <HomePackageSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
        selectedPriceRange={selectedPriceRange}
        onPriceRangeChange={setSelectedPriceRange}
        availableMonths={availableMonths}
        activeChip={activeChip}
        onChipChange={setActiveChip}
        onReset={handleReset}
      />)}
        {/* Package Grid (2-Kolom Seamless) */}
        {filteredSchedules.length === 0 ? (
          <div className="mx-4 p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
            <svg className="w-8 h-8 text-neutral-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-neutral-500 font-medium">{rawList.length === 0 ? 'Jadwal paket sedang disiapkan.' : 'Tidak ada paket yang sesuai dengan pilihan Anda.'}</p>
            {rawList.length === 0 && <a href={`https://wa.me/${brandWhatsapp}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand">Tanya jadwal via WhatsApp</a>}
            {hasFilters && <button type="button" onClick={handleReset}
              className="text-xs font-bold text-brand hover:underline cursor-pointer"
            >
              Reset Filter
            </button>}
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
