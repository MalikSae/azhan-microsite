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

  const { bulan, harga, maskapai, promo } = filterParams;

  useEffect(() => {
    setVisibleCount(9);
  }, [bulan, harga, maskapai, promo, searchQuery, sortBy]);

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

    // Filter Promo
    if (promo === '1' || promo === 'true') {
      result = result.filter(item => item.is_promo === true);
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
  }, [initialSchedules, bulan, harga, maskapai, promo, searchQuery, sortBy]);

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

  const hasActiveFilters = Boolean(bulan || harga || maskapai || promo === '1' || promo === 'true' || searchQuery);

  const handleClearFilter = () => {
    setSearchQuery('');
    router.push('/paket');
  };

  const handleTogglePromo = () => {
    const params = new URLSearchParams();
    if (bulan) params.set('bulan', bulan);
    if (harga) params.set('harga', harga);
    if (maskapai) params.set('maskapai', maskapai);
    
    const isPromoActive = promo === '1' || promo === 'true';
    if (!isPromoActive) {
      params.set('promo', '1');
    }
    
    router.push(`/paket?${params.toString()}`);
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
            className="text-xs sm:text-sm font-semibold text-white/80 hover:text-white underline decoration-white/40 underline-offset-2 transition-colors"
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
            {(promo === '1' || promo === 'true') && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-warning-100 text-warning-800 border border-warning-200">
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span>Promo Spesial</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search & Sort Controls */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-neutral-100/90 shadow-md p-3 sm:p-4 md:p-5 ring-1 ring-black/5">
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











