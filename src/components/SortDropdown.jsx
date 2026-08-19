'use client';

import React, { useState, useRef, useEffect } from 'react';

const OPTIONS = [
  { value: 'departure_asc', label: 'Keberangkatan Terdekat' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
  { value: 'duration_asc', label: 'Durasi Tersingkat' },
  { value: 'duration_desc', label: 'Durasi Terlama' },
];

export default function SortDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = OPTIONS.find(opt => opt.value === value) || OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full min-w-[180px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-neutral-700 font-medium flex items-center justify-between shadow-sm transition-all focus:outline-none ${
          isOpen ? 'border-brand ring-2 ring-brand/20' : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <span className="truncate">{selectedOption.label}</span>
        <svg 
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-100 rounded-lg shadow-xl overflow-hidden origin-top animate-dropdown">
          <ul className="py-1 max-h-60 overflow-auto">
            {OPTIONS.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center justify-between ${
                    value === option.value
                      ? 'bg-brand/5 text-brand font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <svg className="w-4 h-4 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
