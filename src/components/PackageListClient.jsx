'use client';

import React, { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import SortDropdown from './SortDropdown';
import PackageCard from './PackageCard';
import EmptyState from './ui/EmptyState';

export default function PackageListClient({ initialSchedules = [], brandWhatsapp = '', brandName = '', brandLogoUrl = '' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('departure_asc');

  const filteredAndSortedSchedules = useMemo(() => {
    let result = [...initialSchedules];

    // Filter search
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
      // default: departure_asc
      const dateA = new Date(a.berangkat_tanggal || '9999-12-31').getTime();
      const dateB = new Date(b.berangkat_tanggal || '9999-12-31').getTime();
      return dateA - dateB;
    });

    return result;
  }, [initialSchedules, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="w-full sm:w-64 flex items-center gap-2">
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      {/* Result Count */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 text-xs text-neutral-500 font-medium px-1">
        <span>Menampilkan {filteredAndSortedSchedules.length} Paket Umroh</span>
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')} 
            className="text-neutral-600 underline hover:text-neutral-800"
          >
            Hapus Filter
          </button>
        )}
      </div>

      {/* Package Grid */}
      {filteredAndSortedSchedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
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
          title={searchQuery ? "Paket Tidak Ditemukan" : "Belum Ada Paket Tersedia"}
          message={searchQuery ? `Tidak ada paket yang cocok dengan "${searchQuery}". Coba kata kunci lain.` : "Belum ada paket umroh yang dipublikasikan saat ini."}
        />
      )}
    </div>
  );
}
