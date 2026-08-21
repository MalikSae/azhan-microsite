'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CustomSelect from './ui/CustomSelect';

export default function HeroSearchFilter({ schedules = [], brandName = 'Travel' }) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedAirline, setSelectedAirline] = useState('');

  // Derive unique months from schedules
  const availableMonths = useMemo(() => {
    const map = new Map();
    schedules.forEach(s => {
      if (s.berangkat_tanggal) {
        const d = new Date(s.berangkat_tanggal);
        if (!isNaN(d.getTime())) {
          const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const formatter = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
          const label = formatter.format(d);
          map.set(val, label);
        }
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, label]) => ({ value, label }));
  }, [schedules]);

  // Derive unique airlines from schedules
  const availableAirlines = useMemo(() => {
    const map = new Map();
    schedules.forEach(s => {
      if (s.maskapai?.name) {
        map.set(s.maskapai.name, s.maskapai.name);
      }
    });
    return Array.from(map.values()).sort().map(a => ({ value: a, label: a }));
  }, [schedules]);

  const monthOptions = useMemo(() => [
    { value: '', label: 'Semua Bulan' },
    ...availableMonths
  ], [availableMonths]);

  const priceOptions = useMemo(() => [
    { value: '', label: 'Semua Rentang Harga' },
    { value: 'under-30m', label: '< Rp 30 Juta' },
    { value: '30m-35m', label: 'Rp 30 Jt - Rp 35 Juta' },
    { value: 'above-35m', label: '> Rp 35 Juta' }
  ], []);

  const airlineOptions = useMemo(() => [
    { value: '', label: 'Semua Maskapai' },
    ...availableAirlines
  ], [availableAirlines]);

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (selectedMonth) params.set('bulan', selectedMonth);
    if (selectedPrice) params.set('harga', selectedPrice);
    if (selectedAirline) params.set('maskapai', selectedAirline);

    router.push(`/paket?${params.toString()}`);
  };

  const handleQuickSearch = (type, val) => {
    const params = new URLSearchParams();
    if (type === 'bulan') params.set('bulan', val);
    if (type === 'promo') params.set('promo', '1');
    if (type === 'harga') params.set('harga', val);
    router.push(`/paket?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Floating Filter Card dengan Shadow Lebih Halus */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-neutral-100/90 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.18)] p-4 sm:p-5 md:p-6 text-neutral-900 ring-1 ring-black/5">
        
        {/* Card Header dengan Status Badge Seimbang */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold font-heading text-neutral-900 leading-none">
                Cari Jadwal & Paket Umroh
              </h2>
              <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
                Temukan jadwal dan akomodasi terbaik sesuai rencana ibadah Anda
              </p>
            </div>
          </div>

          {/* Right Status Badge */}
          {schedules.length > 0 && (
            <div className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{schedules.length} Jadwal Tersedia</span>
            </div>
          )}
        </div>

        {/* Segmented Control Bar Form */}
        <form onSubmit={handleSearch}>
          <div className="flex flex-col md:flex-row items-stretch md:items-center border border-neutral-200/90 rounded-xl md:rounded-2xl bg-neutral-50/40 hover:bg-neutral-50/70 transition-colors divide-y md:divide-y-0 md:divide-x divide-neutral-200/90 shadow-2xs">
            
            {/* Segment 1: Bulan Keberangkatan */}
            <div className="flex-1 px-4 py-2.5 min-w-0">
              <CustomSelect
                label="Bulan Berangkat"
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={monthOptions}
                placeholder="Semua Bulan"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

            {/* Segment 2: Rentang Harga */}
            <div className="flex-1 px-4 py-2.5 min-w-0">
              <CustomSelect
                label="Rentang Harga"
                value={selectedPrice}
                onChange={setSelectedPrice}
                options={priceOptions}
                placeholder="Semua Rentang Harga"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                }
              />
            </div>

            {/* Segment 3: Maskapai */}
            <div className="flex-1 px-4 py-2.5 min-w-0">
              <CustomSelect
                label="Maskapai Penerbangan"
                value={selectedAirline}
                onChange={setSelectedAirline}
                options={airlineOptions}
                placeholder="Semua Maskapai"
                icon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                  </svg>
                }
              />
            </div>

            {/* Segment 4: Tombol Cari Terintegrasi */}
            <div className="p-2 md:p-2.5 shrink-0">
              <button
                type="submit"
                className="w-full md:w-auto h-[46px] px-7 bg-brand hover:brightness-110 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-lg md:rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Cari Paket</span>
              </button>
            </div>

          </div>
        </form>

        {/* Quick Filter (Pencarian Populer) dengan Continuous Animation */}
        <div className="flex flex-wrap items-center gap-2 pt-3.5 mt-3.5 border-t border-neutral-100 text-xs">
          <span className="font-semibold text-neutral-400 tracking-wide flex items-center gap-1 shrink-0">
            <span>Pencarian Populer:</span>
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {availableMonths.slice(0, 3).map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => handleQuickSearch('bulan', m.value)}
                className="font-medium px-3 py-1 rounded-md bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/90 hover:border-neutral-300 shadow-2xs transition-all active:scale-95 cursor-pointer inline-flex items-center"
              >
                {m.label}
              </button>
            ))}

            {/* Continuous Pulse & Bounce Animated Promo Tag */}
            <button
              type="button"
              onClick={() => handleQuickSearch('promo', '1')}
              className="animate-promo-pulse font-bold px-3 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-400/90 transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              {/* Continuous Bouncing/Wiggling Lightning Icon */}
              <span className="animate-icon-bounce inline-flex">
                <svg
                  className="w-3.5 h-3.5 fill-current text-amber-600"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </span>
              <span>Paket Promo</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-white leading-none tracking-wider shadow-2xs">
                HOT
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSearch('harga', 'under-30m')}
              className="font-medium px-3 py-1 rounded-md bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/90 hover:border-neutral-300 shadow-2xs transition-all active:scale-95 cursor-pointer inline-flex items-center"
            >
              &lt; Rp 30 Juta
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}