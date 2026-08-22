'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({
  label = '',
  value = '',
  onChange,
  options = [],
  placeholder = 'Pilih opsi...',
  icon = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption && selectedOption.value !== '' ? selectedOption.label : placeholder;

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
    <div className={`w-full relative ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
      {label && (
        <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
          {label}
        </span>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-0.5 text-left flex items-center justify-between cursor-pointer focus:outline-none group"
      >
        <div className="flex items-center gap-2 truncate min-w-0 pr-1">
          {icon && <span className="text-neutral-400 group-hover:text-brand transition-colors shrink-0">{icon}</span>}
          <span className={`truncate text-xs sm:text-sm ${selectedOption && selectedOption.value !== '' ? 'font-bold text-neutral-900' : 'font-medium text-neutral-600'}`}>
            {displayLabel}
          </span>
        </div>

        <svg
          className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 shrink-0 ml-1.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[220px] left-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden origin-top animate-dropdown">
          <ul className="py-1 max-h-60 overflow-y-auto divide-y divide-neutral-50">
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-brand/10 text-brand font-bold'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}