'use client';
import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import SortDropdown from '@/components/SortDropdown';

export default function InteractiveSection() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="flex-1">
        <SearchBar value={search} onChange={setSearch} placeholder="Cari paket..." />
      </div>
      <div className="w-full sm:w-64">
        <SortDropdown value={sort} onChange={setSort} />
      </div>
    </div>
  );
}
