import React from 'react';

// Gaya tombol disamakan dengan komponen Button ERP (frontend/shared): radius
// 6px (rounded-xl), font-semibold, shadow halus, focus ring, efek tekan.
const VARIANTS = {
  primary: 'bg-brand text-white shadow-2xs hover:brightness-95 hover:shadow-xs focus:ring-brand/40',
  secondary: 'bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 shadow-2xs hover:border-neutral-300 focus:ring-neutral-200',
  ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700 focus:ring-neutral-200',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-3 text-sm gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  children,
  className = '',
}) {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold select-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95';
  const state = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${state} ${className}`}
    >
      {children}
    </button>
  );
}
