'use client';

import React, { useState, useMemo } from 'react';
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

  const { bulan, harga, maskapai, promo } = filterParams;

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

  return (
    <div className="space-y-6">
      {/* Back to Home & Title Bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 px-3.5 py-2 rounded-xl shadow-2xs transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Beranda</span>
        </Link>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilter}
            className="text-xs sm:text-sm font-semibold text-danger-600 hover:text-danger-700 underline"
          >
            Hapus Semua Filter
          </button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="p-4 bg-white rounded-2xl md:rounded-3xl border border-neutral-200 shadow-2xs space-y-2.5">
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl md:rounded-3xl border border-neutral-200 shadow-xs">
        <div className="flex-1 max-w-md">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="w-full sm:w-auto flex items-center gap-2">
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      {/* Package Grid */}
      {filteredAndSortedSchedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {filteredAndSortedSchedules.map((schedule) => (
            <PackageCard
              key={schedule.id}
              schedule={schedule}
              brandWhatsapp={brandWhatsapp}
              brandName={brandName}
              brandLogoUrl={brandLogoUrl}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Paket Tidak Ditemukan"
          message="Tidak ada paket umroh yang sesuai dengan kriteria filter Anda. Silakan coba filter atau bulan lainnya."
        />
      )}
    </div>
  );
}