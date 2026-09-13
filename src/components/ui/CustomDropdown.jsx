'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function CustomDropdown({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Pilih...',
  error,
  required,
  className = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
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

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleSelect = (optValue) => {
    if (disabled) return;
    if (onChange) {
      onChange(optValue);
    }
    setIsOpen(false);
  };

  return (
    <div className={`space-y-1 relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="font-bold text-neutral-700 block text-xs sm:text-sm">
          {label} {required && <span className="text-brand">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between text-xs sm:text-sm transition-all shadow-2xs cursor-pointer ${
          disabled
            ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
            : 'bg-white hover:border-neutral-400'
        } ${
          error
            ? 'border-red-500 focus:border-red-500'
            : isOpen
            ? 'border-brand ring-2 ring-brand/10'
            : 'border-neutral-300 focus:border-brand'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          {selectedOption?.logoUrl && (
            <img
              src={selectedOption.logoUrl}
              alt={selectedOption.label}
              className="h-4 sm:h-5 max-w-[50px] object-contain shrink-0"
            />
          )}
          <div className="truncate min-w-0 flex-1">
            <span
              className={`block truncate ${
                selectedOption ? 'font-semibold text-neutral-900' : 'text-neutral-400 font-normal'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.sublabel && (
              <span className="block text-[11px] text-neutral-400 truncate">
                {selectedOption.sublabel}
              </span>
            )}
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-800' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full left-0 mt-1.5 bg-white border border-neutral-200/90 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <ul className="max-h-60 overflow-y-auto py-1 text-xs sm:text-sm divide-y divide-neutral-100">
            {options.length === 0 ? (
              <li className="px-3.5 py-3 text-center text-xs text-neutral-400">
                Tidak ada pilihan
              </li>
            ) : (
              options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-50 text-neutral-900 font-bold'
                          : 'text-neutral-700 hover:bg-neutral-50 font-normal'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {opt.logoUrl && (
                          <img
                            src={opt.logoUrl}
                            alt={opt.label}
                            className="h-4 sm:h-5 max-w-[50px] object-contain shrink-0"
                          />
                        )}
                        <div className="truncate min-w-0 flex-1">
                          <span className="block truncate">{opt.label}</span>
                          {opt.sublabel && (
                            <span className="block text-[11px] text-neutral-400 truncate">
                              {opt.sublabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-brand shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>}
    </div>
  );
}
