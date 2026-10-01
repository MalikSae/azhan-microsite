'use client';
import { matchesCategory } from '@/lib/packagePolicy.mjs';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import HomeAppCard from '@/components/home/HomeAppCard';

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
    activeClass: 'bg-amber-500 text-white border-amber-600/30',
    iconColor: 'text-amber-500',
  },
  {
    id: 'flash_sale',
    label: 'Flash Sale',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    activeClass: 'bg-rose-600 text-white border-rose-700/30',
    iconColor: 'text-rose-600',
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
    activeClass: 'bg-orange-500 text-white border-orange-600/30',
    iconColor: 'text-orange-500',
  },
  {
    id: 'banyak_dicari',
    label: 'Banyak Dicari',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    activeClass: 'bg-neutral-900 text-white border-neutral-950',
    iconColor: 'text-neutral-700',
  },
];

const SORT_OPTIONS = [
  { id: 'departure_asc', label: 'Keberangkatan Terdekat' },
  { id: 'price_asc', label: 'Harga Termurah' },
  { id: 'price_desc', label: 'Harga Termahal' },
  { id: 'duration_asc', label: 'Durasi Terpendek' },
];

export default function PaketAppClient({
  initialSchedules = [],
  brandWhatsapp = '',
  brandName = '',
  initialCategory = 'all',
  initialChip = 'all',
  initialQuery = '',
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(() => {
    const category = initialSchedules.find(s => matchesCategory(s, initialCategory))?.category;
    return category && initialCategory !== 'all' && initialCategory !== 'promo'
      ? category.slug || String(category.id) : initialCategory;
  });
  const [activeChip, setActiveChip] = useState(initialChip);
  const [sortBy, setSortBy] = useState('departure_asc');
  const [showSort, setShowSort] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const loaderRef = useRef(null);
  const sortRef = useRef(null);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSort(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset visible count on filter change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, activeCategory, activeChip, sortBy]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let result = [...initialSchedules];

    // 1. Search Query filter
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

    result = result.filter((schedule) => matchesCategory(schedule, activeCategory));

    // 3. Quick Filter Chips
    if (activeChip === 'promo') {
      result = result.filter((s) => {
        const expired = s.promo_until && s.promo_until < today;
        return s.is_promo === true && !expired;
      });
    } else if (activeChip === 'flash_sale') {
      result = result.filter((s) => s.is_promo === true && (s.promo_until ? s.promo_until >= today : true));
    } else if (activeChip === 'hampir_penuh') {
      result = result.filter((s) => s.seat_sisa > 0 && s.seat_sisa <= 10);
    } else if (activeChip === 'banyak_dicari') {
      result = [...result].sort((a, b) => {
        if (b.views !== undefined && a.views !== undefined && b.views !== a.views) {
          return b.views - a.views;
        }
        return (a.seat_sisa || 0) - (b.seat_sisa || 0);
      });
    }

    // 4. Sort (jika bukan banyak_dicari)
    if (activeChip !== 'banyak_dicari') {
      result.sort((a, b) => {
        if (sortBy === 'price_asc') return (a.harga_quad || 0) - (b.harga_quad || 0);
        if (sortBy === 'price_desc') return (b.harga_quad || 0) - (a.harga_quad || 0);
        if (sortBy === 'duration_asc') {
          const dur = (s) =>
            s.berangkat_tanggal && s.pulang_tanggal
              ? Math.round((new Date(s.pulang_tanggal) - new Date(s.berangkat_tanggal)) / 86400000) + 1
              : 0;
          return dur(a) - dur(b);
        }
        // default: departure_asc
        const dateA = new Date(a.berangkat_tanggal || '9999-12-31').getTime();
        const dateB = new Date(b.berangkat_tanggal || '9999-12-31').getTime();
        return dateA - dateB;
      });
    }

    return result;
  }, [initialSchedules, searchQuery, activeCategory, activeChip, sortBy]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((p) => p + 12);
        }
      },
      { rootMargin: '200px' }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount]);

  const hasActiveFilter = activeCategory !== 'all' || activeChip !== 'all' || searchQuery.trim() !== '';

  const handleReset = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setActiveChip('all');
    setSortBy('departure_asc');
  };

  const currentSortObj = SORT_OPTIONS.find((o) => o.id === sortBy);

  // Dynamic Title
  const getSectionTitle = () => {
    if (searchQuery.trim()) return `Hasil "${searchQuery.trim()}"`;
    const category = initialSchedules.find(s => matchesCategory(s, activeCategory))?.category;
    if (activeCategory !== 'all' && activeCategory !== 'promo' && category) return category.name;
    if (activeCategory === 'promo' || activeChip === 'promo') return '🔥 Paket Promo';
    if (activeChip === 'flash_sale') return '⚡ Flash Sale';
    if (activeChip === 'hampir_penuh') return '🔔 Hampir Penuh';
    if (activeChip === 'banyak_dicari') return '📈 Banyak Dicari';
    return 'Semua Paket Populer';
  };

  return (
    <div className="w-full flex flex-col gap-[14px]">
      <label className="text-sm font-semibold">Kategori paket
        <select aria-label="Kategori paket" value={activeCategory} onChange={e => setActiveCategory(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm">
          <option value="all">Semua kategori</option>
          <option value="promo">Promo</option>
          {[...new Map(initialSchedules.filter(s => s.category).map(s => [String(s.category.id), s.category])).values()].map(c => <option key={c.id} value={c.slug || String(c.id)}>{c.name}</option>)}
        </select>
      </label>


      {/* ━━━ Search Bar (Mobile App Style - sama persis dengan Home) ━━━ */}
      <div className="box-border w-full h-11 shrink-0 flex flex-row gap-2.5 px-3 justify-between items-center bg-[#FFFFFF] border border-[#ECEEF5] rounded-xl shadow-2xs">
        <div className="flex items-center gap-[8px] flex-1 min-w-0">
          <svg
            viewBox="0 0 24 24"
            className="w-[14px] h-[14px] shrink-0 fill-none stroke-[#6B7280]"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari paket, maskapai, atau hotel"
            placeholder="Cari paket umroh, maskapai, hotel..."
            className="w-full bg-transparent text-sm text-[#1A1A2E] placeholder:text-[#6B7280] font-medium focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#9CA3AF] hover:text-[#1A1A2E] p-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort Trigger Button */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setShowSort((p) => !p)}
            className="box-border w-[26px] shrink-0 h-[26px] flex flex-row gap-0 justify-center items-center bg-brand-light text-brand rounded-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title={`Urutkan: ${currentSortObj?.label}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-[14px] h-[14px] shrink-0 fill-none stroke-current"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <line x1="12" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          {/* Sort Dropdown Panel */}
          {showSort && (
            <div className="absolute right-0 top-9 z-50 bg-white border border-[#ECEEF5] rounded-2xl shadow-xl py-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-1.5 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider border-b border-[#F4F4F8]">
                Urutkan Berdasarkan
              </div>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.id);
                    setShowSort(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-[11px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    sortBy === opt.id
                      ? 'text-brand font-bold bg-brand-light'
                      : 'text-[#1A1A2E] hover:bg-neutral-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && (
                    <svg className="w-3.5 h-3.5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* ━━━ Filter Chips Row (Quick Filter sama persis dengan Home) ━━━ */}
      <div className="box-border w-full h-fit shrink-0 flex flex-row gap-[6px] items-center overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
        {QUICK_FILTERS.map((chip) => {
          const isActive = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveChip(chip.id)}
              className={`box-border w-fit shrink-0 h-fit flex flex-row gap-[4px] p-[6px_12px] justify-start items-center rounded-full text-[10.5px] transition-all cursor-pointer border ${
                isActive
                  ? chip.activeClass || 'bg-brand text-white font-bold shadow-xs border-brand'
                  : 'bg-[#FFFFFF] border-[#ECEEF5] text-[#6B7280] font-medium hover:bg-neutral-50 hover:text-neutral-900'
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

      {/* ━━━ Section Header: Title & Count ━━━ */}
      <div className="box-border w-full h-fit shrink-0 flex flex-row gap-0 justify-between items-center pt-1">
        <div className="text-[15px] text-[#1A1A2E] font-extrabold text-left whitespace-nowrap">
          {getSectionTitle()}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#6B7280] font-medium">
            {filtered.length} paket
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-bold text-brand hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ━━━ Package Grid: 2-Kolom (sama persis dengan HomeAppCard) ━━━ */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#ECEEF5] space-y-2 w-full shadow-2xs">
          <svg className="w-8 h-8 text-neutral-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-[#6B7280] font-medium">Tidak ada paket yang sesuai dengan filter pencarian.</p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-bold text-brand hover:underline cursor-pointer"
            >
              Hapus Semua Filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-[10px] w-full">
            {filtered.slice(0, visibleCount).map((schedule) => (
              <HomeAppCard
                key={schedule.id}
                schedule={schedule}
                brandWhatsapp={brandWhatsapp}
                brandName={brandName}
              />
            ))}
          </div>

          {/* Infinite Scroll Loader */}
          {visibleCount < filtered.length && (
            <div ref={loaderRef} className="flex justify-center py-6">
              <div className="w-6 h-6 rounded-full border-2 border-[#ECEEF5] border-t-brand animate-spin" />
            </div>
          )}

          {/* All loaded notification */}
          {visibleCount >= filtered.length && filtered.length > 8 && (
            <div className="text-center py-3">
              <p className="text-[10px] text-[#9CA3AF] font-medium">
                Semua {filtered.length} paket telah ditampilkan
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
