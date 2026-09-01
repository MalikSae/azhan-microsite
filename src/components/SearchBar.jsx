import React from 'react';

export default function SearchBar({ value, onChange, placeholder = "Cari nama paket, hotel, atau keberangkatan...", className = "", variant = "default" }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2.5 text-sm placeholder:text-neutral-400 text-neutral-800 focus:outline-none transition-all ${variant === "borderless" ? "bg-transparent border-0 focus:ring-0 shadow-none" : "bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent shadow-sm"} ${className}`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}




