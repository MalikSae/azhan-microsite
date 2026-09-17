'use client';

import React from 'react';

export default function HomePackageSearch({
  searchQuery = '',
  onSearchChange,
  selectedMonth = 'all',
  onMonthChange,
  selectedDuration = 'all',
  onDurationChange,
  selectedPriceRange = 'all',
  onPriceRangeChange,
  availableCount = 0,
  availableMonths = [],
  onSubmit,
}) {
  const DURATION_OPTIONS = [
    { id: 'all', label: 'Semua' },
    { id: '9-10', label: '9–10 hari' },
    { id: '11-13', label: '11–13 hari' },
    { id: '14+', label: '> 13 hari' },
  ];

  const PRICE_OPTIONS = [
    { id: 'all', label: 'Semua' },
    { id: 'under_30', label: '< 30 jt' },
    { id: '30_40', label: 'Rp30–40 jt' },
    { id: 'above_40', label: '> 40 jt' },
  ];

  const currentMonthLabel = availableMonths.find((m) => m.id === selectedMonth)?.label || 'Semua';
  const currentDurationLabel = DURATION_OPTIONS.find((d) => d.id === selectedDuration)?.label || 'Semua';
  const currentPriceLabel = PRICE_OPTIONS.find((p) => p.id === selectedPriceRange)?.label || 'Semua';

  return (
    <div className="w-full px-4 pt-1 pb-1 flex flex-col gap-3">
      {/* ━━━ Header Row: Title & Total Count ━━━ */}
      <div className="w-full flex justify-between items-start gap-2">
        <div className="flex flex-col">
          <h3 className="text-[15px] font-extrabold text-neutral-900 leading-tight">
            Cari paket sesuai rencana Anda
          </h3>
          <p className="text-[11.5px] text-neutral-500 font-medium leading-tight mt-1">
            Bandingkan jadwal dan harga dalam sekali pencarian.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-light border border-brand/20 text-brand text-[10.5px] font-bold shrink-0 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
          <span>{availableCount} tersedia</span>
        </div>
      </div>

      {/* ━━━ Search Text Input ━━━ */}
      <div className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl focus-within:bg-white focus-within:border-brand focus-within:ring-1 focus-within:ring-brand hover:border-brand/40 transition-all">
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 text-neutral-400 shrink-0"
          fill="none"
          stroke="currentColor"
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
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="Cari nama paket, maskapai, atau hotel"
          className="w-full bg-transparent text-[12px] text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange && onSearchChange('')}
            className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ━━━ 3 Filter Dropdown Boxes ━━━ */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {/* 1. Bulan Berangkat */}
        <div className="relative flex flex-col justify-between p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl hover:border-brand/40 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-colors">
          <div className="flex items-center gap-1 text-[9px] text-neutral-400 font-bold uppercase tracking-wider leading-none">
            <svg className="w-2.5 h-2.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="truncate">Bulan</span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11.5px] font-bold text-neutral-900 leading-none">
            <span className="truncate">{currentMonthLabel}</span>
            <svg className="w-3 h-3 text-neutral-400 shrink-0 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange && onMonthChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          >
            <option value="all">Semua Bulan</option>
            {availableMonths.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Durasi */}
        <div className="relative flex flex-col justify-between p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl hover:border-brand/40 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-colors">
          <div className="flex items-center gap-1 text-[9px] text-neutral-400 font-bold uppercase tracking-wider leading-none">
            <svg className="w-2.5 h-2.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="truncate">Durasi</span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11.5px] font-bold text-neutral-900 leading-none">
            <span className="truncate">{currentDurationLabel}</span>
            <svg className="w-3 h-3 text-neutral-400 shrink-0 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <select
            value={selectedDuration}
            onChange={(e) => onDurationChange && onDurationChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Range Harga */}
        <div className="relative flex flex-col justify-between p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl hover:border-brand/40 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-colors">
          <div className="flex items-center gap-1 text-[9px] text-neutral-400 font-bold uppercase tracking-wider leading-none">
            <svg className="w-2.5 h-2.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span className="truncate">Harga</span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11.5px] font-bold text-neutral-900 leading-none">
            <span className="truncate">{currentPriceLabel}</span>
            <svg className="w-3 h-3 text-neutral-400 shrink-0 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <select
            value={selectedPriceRange}
            onChange={(e) => onPriceRangeChange && onPriceRangeChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          >
            {PRICE_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ━━━ Submit Button ━━━ */}
      <button
        type="button"
        onClick={onSubmit}
        className="w-full py-2.5 px-4 bg-brand hover:brightness-105 active:scale-[0.99] text-white font-bold text-[12px] rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 text-white shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>Cari Paket yang Sesuai</span>
      </button>
    </div>
  );
}
