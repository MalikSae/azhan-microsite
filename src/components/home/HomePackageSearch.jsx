'use client';

import { useState } from 'react';
import CustomDropdown from '../ui/CustomDropdown';

export default function HomePackageSearch({
  searchQuery = '', onSearchChange,
  selectedMonth = 'all', onMonthChange,
  selectedDuration = 'all', onDurationChange,
  selectedPriceRange = 'all', onPriceRangeChange,
  availableMonths = [], activeChip = 'all', onChipChange, onReset,
}) {
  const [open, setOpen] = useState(false);
  const activeCount = [selectedMonth, selectedDuration, selectedPriceRange, activeChip].filter((value) => value !== 'all').length;
  return (
    <div className="px-4">
      <div className="flex items-center gap-2">
        <input type="search" aria-label="Cari paket, maskapai, atau hotel" value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)} placeholder="Cari paket..."
          className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30" />
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
          className={`h-11 shrink-0 rounded-xl border px-3 text-sm font-semibold ${open || activeCount ? 'border-brand/30 bg-brand-light text-brand' : 'border-neutral-200 text-neutral-700'}`}>
          Filter{activeCount ? ` (${activeCount})` : ''}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="grid grid-cols-2 gap-3">
            <CustomDropdown label="Bulan berangkat" value={selectedMonth} onChange={onMonthChange}
              options={[{ value: 'all', label: 'Semua bulan' }, ...availableMonths.map((m) => ({ value: m.id, label: m.label }))]} />
            <CustomDropdown label="Harga per jamaah" value={selectedPriceRange} onChange={onPriceRangeChange}
              options={[{ value: 'all', label: 'Semua harga' }, { value: 'under_30', label: 'Di bawah Rp30 jt' }, { value: '30_40', label: 'Rp30–40 jt' }, { value: 'above_40', label: 'Di atas Rp40 jt' }]} />
            <CustomDropdown label="Durasi" value={selectedDuration} onChange={onDurationChange}
              options={[{ value: 'all', label: 'Semua durasi' }, { value: '9-10', label: '9–10 hari' }, { value: '11-13', label: '11–13 hari' }, { value: '14+', label: 'Lebih dari 13 hari' }]} />
            <CustomDropdown label="Pilihan paket" value={activeChip} onChange={onChipChange}
              options={[{ value: 'all', label: 'Semua paket' }, { value: 'promo', label: 'Promo' }]} />
          </div>
          <div className="flex items-center justify-between">
            <button type="button" disabled={!activeCount && !searchQuery} onClick={onReset} className="min-h-11 text-sm font-semibold text-neutral-600 disabled:opacity-40">Reset</button>
            <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-3 text-sm font-semibold text-brand">Lihat hasil</button>
          </div>
        </div>
      )}
    </div>
  );
}
