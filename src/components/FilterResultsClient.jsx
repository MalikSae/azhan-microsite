'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import SortDropdown from './SortDropdown';
import PackageCard from './PackageCard';
import EmptyState from './ui/EmptyState';

export default function FilterResultsClient({
  initialSchedules = [],
  filterParams = {},
  brandWhatsapp = '',
  brandName = '',
  brandLogoUrl = ''
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('departure_asc');
  const [visibleCount, setVisibleCount] = useState(9);
  const loaderRef = useRef(null);

  const { bulan, harga, maskapai, promo, flash_sale, hampir_penuh, banyak_dicari } = filterParams;

  useEffect(() => {
    setVisibleCount(9);
  }, [bulan, harga, maskapai, promo, flash_sale, hampir_penuh, banyak_dicari, searchQuery, sortBy]);

  // Filter and sort
  const filteredAndSortedSchedules = useMemo(() => {
    let result = [...initialSchedules];

    // Filter Bulan (YYYY-MM)
    if (bulan) {
      result = result.filter(item => {
        if (!item.berangkat_tanggal) return false;
        return item.berangkat_tanggal.startsWith(bulan);
      });
    }

    // Filter Rentang Harga
    if (harga) {
      result = result.filter(item => {
        const minPrice = Math.min(
          ...[item.harga_quad, item.harga_triple, item.harga_double].filter(p => p && p > 0)
        );
        if (!isFinite(minPrice)) return false;

        if (harga === 'under-30m') return minPrice < 30000000;
        if (harga === '30m-35m') return minPrice >= 30000000 && minPrice <= 35000000;
        if (harga === 'above-35m') return minPrice > 35000000;
        return true;
      });
    }

    // Filter Maskapai
    if (maskapai) {
      result = result.filter(item => {
        const airlineName = (item.maskapai?.name || '').toLowerCase();
        return airlineName.includes(maskapai.toLowerCase());
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Filter Promo (semua promo yang masih aktif)
    if (promo === '1' || promo === 'true') {
      result = result.filter(item => {
        const isExpired = item.promo_until && item.promo_until < today;
        return item.is_promo === true && !isExpired;
      });
    }

    // Filter Flash Sale (promo dengan batas waktu aktif)
    if (flash_sale === '1' || flash_sale === 'true') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(item => item.is_promo === true && item.promo_until && item.promo_until >= today);
    }

    // Filter Hampir Penuh (sisa <= 10 && sisa > 0)
    if (hampir_penuh === '1' || hampir_penuh === 'true') {
      result = result.filter(item => item.seat_sisa > 0 && item.seat_sisa <= 10);
    }

    // Filter Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        const name = (item.jadwal_nama || '').toLowerCase();
        const airline = (item.maskapai?.name || '').toLowerCase();
        const mekkah = (item.hotel_mekkah?.name || '').toLowerCase();
        const madinah = (item.hotel_madinah?.name || '').toLowerCase();
        return name.includes(q) || airline.includes(q) || mekkah.includes(q) || madinah.includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
      // Prioritize Banyak Dicari if active and default sort
      if ((banyak_dicari === '1' || banyak_dicari === 'true') && sortBy === 'departure_asc') {
        return (b.views || 0) - (a.views || 0);
      }

      if (sortBy === 'price_asc') {
        return (a.harga_quad || 0) - (b.harga_quad || 0);
      }
      if (sortBy === 'price_desc') {
        return (b.harga_quad || 0) - (a.harga_quad || 0);
      }
      if (sortBy === 'duration_asc' || sortBy === 'duration_desc') {
        const getDuration = (item) => {
          if (!item.berangkat_tanggal || !item.pulang_tanggal) return 0;
          return Math.round((new Date(item.pulang_tanggal) - new Date(item.berangkat_tanggal)) / (1000 * 60 * 60 * 24)) + 1;
        };
        const durA = getDuration(a);
        const durB = getDuration(b);
        return sortBy === 'duration_asc' ? durA - durB : durB - durA;
      }
      const dateA = new Date(a.berangkat_tanggal || '9999-12-31').getTime();
      const dateB = new Date(b.berangkat_tanggal || '9999-12-31').getTime();
      return dateA - dateB;
    });

    return result;
  }, [initialSchedules, bulan, harga, maskapai, promo, flash_sale, hampir_penuh, banyak_dicari, searchQuery, sortBy]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 9);
      }
    }, { rootMargin: '200px' });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => observer.disconnect();
  }, [filteredAndSortedSchedules.length, visibleCount]);

  // Format month label
  const monthLabel = useMemo(() => {
    if (!bulan) return null;
    try {
      const [y, m] = bulan.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
    } catch {
      return bulan;
    }
  }, [bulan]);

  // Format price label
  const priceLabel = useMemo(() => {
    if (harga === 'under-30m') return '< Rp 30 Jt';
    if (harga === '30m-35m') return 'Rp 30 - 35 Jt';
    if (harga === 'above-35m') return '> Rp 35 Jt';
    return null;
  }, [harga]);

  const isPromoActive = promo === '1' || promo === 'true';
  const isFlashSaleActive = flash_sale === '1' || flash_sale === 'true';
  const isHampirPenuhActive = hampir_penuh === '1' || hampir_penuh === 'true';
  const isBanyakDicariActive = banyak_dicari === '1' || banyak_dicari === 'true';

  const hasActiveFilters = Boolean(
    bulan || harga || maskapai || isPromoActive || isFlashSaleActive || isHampirPenuhActive || isBanyakDicariActive || searchQuery
  );

  const handleClearFilter = () => {
    setSearchQuery('');
    router.push('/paket');
  };

  // Single-select (eksklusif) untuk Quick Filter
  const handleToggleQuickFilter = (key) => {
    const params = new URLSearchParams();
    if (bulan) params.set('bulan', bulan);
    if (harga) params.set('harga', harga);
    if (maskapai) params.set('maskapai', maskapai);

    const currentVal = filterParams[key];
    const isCurrentlyActive = currentVal === '1' || currentVal === 'true';

    // Jika belum aktif, aktifkan HANYA filter ini (filter cepat lainnya otomatis ter-reset)
    if (!isCurrentlyActive) {
      params.set(key, '1');
    }

    const queryStr = params.toString();
    router.push(queryStr ? `/paket?${queryStr}` : '/paket');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Clear Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2 md:mb-4 px-1">
        <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium text-white/80">
          <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
          <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white font-semibold">Paket Umroh</span>
        </nav>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilter}
            className="text-xs sm:text-sm font-semibold text-white/80 hover:text-white underline decoration-white/40 underline-offset-2 transition-colors cursor-pointer"
          >
            Hapus Semua Filter
          </button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-neutral-800">
              Filter Pencarian Aktif:
            </span>
            <span className="text-xs text-neutral-500 font-medium">
              {filteredAndSortedSchedules.length} paket ditemukan
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {monthLabel && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                <span>Bulan: {monthLabel}</span>
              </span>
            )}
            {priceLabel && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                <span>Harga: {priceLabel}</span>
              </span>
            )}
            {maskapai && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                <span>Maskapai: {maskapai}</span>
              </span>
            )}
            {isPromoActive && (
              <button
                type="button"
                onClick={() => handleToggleQuickFilter('promo')}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Promo</span>
                <span className="text-amber-700 font-bold ml-0.5">×</span>
              </button>
            )}
            {isFlashSaleActive && (
              <button
                type="button"
                onClick={() => handleToggleQuickFilter('flash_sale')}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Flash Sale</span>
                <span className="text-rose-700 font-bold ml-0.5">×</span>
              </button>
            )}
            {isHampirPenuhActive && (
              <button
                type="button"
                onClick={() => handleToggleQuickFilter('hampir_penuh')}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-900 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
                <span>Hampir Penuh</span>
                <span className="text-orange-700 font-bold ml-0.5">×</span>
              </button>
            )}
            {isBanyakDicariActive && (
              <button
                type="button"
                onClick={() => handleToggleQuickFilter('banyak_dicari')}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-neutral-100 text-neutral-900 border border-neutral-300 hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-neutral-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Banyak Dicari</span>
                <span className="text-neutral-700 font-bold ml-0.5">×</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Sort Controls */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-neutral-100/90 shadow-md p-3 sm:p-4 md:p-5 ring-1 ring-black/5 space-y-3.5 sm:space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center border border-neutral-200/90 rounded-xl md:rounded-2xl bg-neutral-50/40 hover:bg-neutral-50/70 transition-colors divide-y md:divide-y-0 md:divide-x divide-neutral-200/90 shadow-2xs">
          <div className="flex-1 min-w-0">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery} 
              variant="borderless"
              className="py-3 px-4 rounded-t-xl md:rounded-none md:rounded-l-2xl"
            />
          </div>
          <div className="w-full md:w-[280px] shrink-0">
            <SortDropdown 
              value={sortBy} 
              onChange={setSortBy} 
              variant="borderless"
              className="py-3 px-4 rounded-b-xl md:rounded-none md:rounded-r-2xl"
            />
          </div>
        </div>

        {/* Quick Filter Pills (Single Select) */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-hide">
          {/* Promo */}
          <button
            onClick={() => handleToggleQuickFilter('promo')}
            type="button"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              isPromoActive
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40 border border-amber-600/30'
                : 'bg-neutral-100 text-neutral-700 border border-neutral-200/80 hover:bg-neutral-200/80 hover:text-neutral-900'
            }`}
          >
            <svg className={`w-4 h-4 shrink-0 ${isPromoActive ? 'text-white' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Promo
          </button>

          {/* Flash Sale */}
          <button
            onClick={() => handleToggleQuickFilter('flash_sale')}
            type="button"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              isFlashSaleActive
                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/40 border border-rose-700/30'
                : 'bg-neutral-100 text-neutral-700 border border-neutral-200/80 hover:bg-neutral-200/80 hover:text-neutral-900'
            }`}
          >
            <svg className={`w-4 h-4 shrink-0 ${isFlashSaleActive ? 'text-white' : 'text-rose-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Flash Sale
          </button>

          {/* Hampir Penuh */}
          <button
            onClick={() => handleToggleQuickFilter('hampir_penuh')}
            type="button"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              isHampirPenuhActive
                ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-400/40 border border-orange-600/30'
                : 'bg-neutral-100 text-neutral-700 border border-neutral-200/80 hover:bg-neutral-200/80 hover:text-neutral-900'
            }`}
          >
            <svg className={`w-4 h-4 shrink-0 ${isHampirPenuhActive ? 'text-white' : 'text-orange-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            Hampir Penuh
          </button>

          {/* Banyak Dicari */}
          <button
            onClick={() => handleToggleQuickFilter('banyak_dicari')}
            type="button"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              isBanyakDicariActive
                ? 'bg-neutral-900 text-white shadow-sm ring-2 ring-neutral-700/40 border border-neutral-950'
                : 'bg-neutral-100 text-neutral-700 border border-neutral-200/80 hover:bg-neutral-200/80 hover:text-neutral-900'
            }`}
          >
            <svg className={`w-4 h-4 shrink-0 ${isBanyakDicariActive ? 'text-white' : 'text-neutral-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Banyak Dicari
          </button>
        </div>
      </div>

      {/* Package Grid */}
      {filteredAndSortedSchedules.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {filteredAndSortedSchedules.slice(0, visibleCount).map((schedule) => (
              <PackageCard
                key={schedule.id}
                schedule={schedule}
                brandWhatsapp={brandWhatsapp}
                brandName={brandName}
                brandLogoUrl={brandLogoUrl}
              />
            ))}
          </div>
          {visibleCount < filteredAndSortedSchedules.length && (
            <div ref={loaderRef} className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-neutral-200 border-t-primary-500 animate-spin"></div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="Paket Tidak Ditemukan"
          message="Tidak ada paket umroh yang sesuai dengan kriteria filter Anda. Silakan coba filter atau bulan lainnya."
        />
      )}
    </div>
  );
}