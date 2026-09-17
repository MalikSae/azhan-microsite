'use client';

import React from 'react';

const CATEGORIES = [
  {
    id: 'all',
    label: 'Semua',
    iconName: 'compass',
  },
  {
    id: 'reguler',
    label: 'Reguler',
    iconName: 'landmark',
  },
  {
    id: 'plus',
    label: 'Plus Turki',
    iconName: 'plane',
  },
  {
    id: 'haji',
    label: 'Haji Khusus',
    iconName: 'award',
  },
  {
    id: 'promo',
    label: 'Promo',
    iconName: 'tag',
    isPromo: true,
  },
];

function CategoryIcon({ name, className = 'w-[20px] h-[20px]' }) {
  switch (name) {
    case 'compass':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'landmark':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="22" x2="21" y2="22" />
          <line x1="6" y1="18" x2="6" y2="11" />
          <line x1="10" y1="18" x2="10" y2="11" />
          <line x1="14" y1="18" x2="14" y2="11" />
          <line x1="18" y1="18" x2="18" y2="11" />
          <polygon points="12 2 20 7 4 7" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'plane':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'award':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      );
    case 'tag':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8 8a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-8-8z" />
          <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

export default function HomeAppCategories({ activeCategory = 'all', onSelectCategory }) {
  return (
    <div className="box-border w-full h-fit shrink-0 flex flex-row gap-0 justify-between items-center py-1">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory && onSelectCategory(cat.id)}
            className="box-border w-fit shrink-0 h-fit flex flex-col gap-[6px] justify-start items-center cursor-pointer group focus:outline-none transition-transform active:scale-95"
          >
            <div
              className={`box-border w-[46px] h-[46px] shrink-0 flex flex-col gap-0 justify-center items-center rounded-[16px] transition-all ${
                isActive
                  ? 'bg-brand-light text-brand shadow-xs scale-105 border border-brand/20'
                  : cat.isPromo
                  ? 'bg-[#FFF1F2] text-[#E11D48] hover:bg-[#FFE4E6]'
                  : 'bg-[#F4F4F8] text-[#1A1A2E] hover:bg-[#ECEEF5]'
              }`}
            >
              <CategoryIcon
                name={cat.iconName}
                className={`w-[20px] h-[20px] shrink-0 ${
                  isActive
                    ? 'text-brand'
                    : cat.isPromo
                    ? 'text-[#E11D48]'
                    : 'text-[#1A1A2E]'
                }`}
              />
            </div>
            <div
              className={`text-[10px] text-center whitespace-nowrap transition-colors ${
                isActive ? 'text-brand font-bold' : 'text-[#1A1A2E] font-semibold'
              }`}
            >
              {cat.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
