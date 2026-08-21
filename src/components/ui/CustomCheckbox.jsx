'use client';

import React from 'react';

export default function CustomCheckbox({
  id = 'custom-checkbox',
  checked = false,
  onChange,
  label = '',
  badge = null
}) {
  return (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-2 cursor-pointer select-none group"
    >
      <div className="relative flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center shadow-2xs ${
            checked
              ? 'bg-neutral-900 border-neutral-900 text-white'
              : 'bg-white border-neutral-300 group-hover:border-neutral-400'
          }`}
        >
          {checked && (
            <svg
              className="w-2.5 h-2.5 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>

      {label && (
        <span className="text-xs font-semibold text-neutral-800 group-hover:text-neutral-900 transition-colors">
          {label}
        </span>
      )}

      {badge}
    </label>
  );
}