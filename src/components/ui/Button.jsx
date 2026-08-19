import React from 'react';

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  type = 'button', 
  children,
  className = ''
}) {
  let baseClasses = 'inline-flex items-center justify-center font-medium transition-all rounded-lg focus:outline-none';
  
  let sizeClasses = '';
  if (size === 'sm') {
    sizeClasses = 'text-xs px-3 py-1.5';
  } else if (size === 'md') {
    sizeClasses = 'text-sm px-4 py-2.5';
  }

  let variantClasses = '';
  if (variant === 'primary') {
    variantClasses = 'bg-brand text-white hover:brightness-90';
  } else if (variant === 'secondary') {
    variantClasses = 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200';
  }

  let disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}
