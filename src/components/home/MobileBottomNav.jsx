'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav({ brandWhatsapp = '6281234567890' }) {
  const pathname = usePathname();
  const cleanWa = (brandWhatsapp || '6281234567890').replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent("Assalamu'alaikum, saya ingin konsultasi paket umroh terbaik.")}`;

  const NAV_ITEMS = [
    {
      id: 'home',
      label: 'Home',
      href: '/',
      isExternal: false,
      icon: (isActive) => (
        <svg
          viewBox="0 0 24 24"
          className="w-[23px] h-[23px] fill-none stroke-current"
          strokeWidth={isActive ? '2.4' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'paket',
      label: 'Paket',
      href: '/paket',
      isExternal: false,
      icon: (isActive) => (
        <svg
          viewBox="0 0 24 24"
          className="w-[23px] h-[23px] fill-none stroke-current"
          strokeWidth={isActive ? '2.4' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon
            points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            fill={isActive ? 'currentColor' : 'none'}
          />
        </svg>
      ),
    },
    {
      id: 'konsultasi',
      label: 'Konsultasi',
      href: waUrl,
      isExternal: true,
      icon: () => (
        <div className="relative flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-[23px] h-[23px] fill-[#22C55E]">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.08L2 22l5.08-1.34C8.52 21.52 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm.08 17.5c-1.5 0-2.92-.4-4.14-1.12l-.3-.18-3.04.8.81-2.96-.2-.31C4.46 14.52 4 13.3 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-7.92 8z" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#22C55E] ring-2 ring-white" />
        </div>
      ),
    },
    {
      id: 'portal',
      label: 'Akun',
      href: '/portal',
      isExternal: false,
      icon: (isActive) => (
        <svg
          viewBox="0 0 24 24"
          className="w-[23px] h-[23px] fill-none stroke-current"
          strokeWidth={isActive ? '2.4' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" fill={isActive ? 'currentColor' : 'none'} />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="w-full h-[62px] grid grid-cols-4 items-center">
        {NAV_ITEMS.map((item) => {
          const isActive = !item.isExternal && pathname === item.href;

          if (item.isExternal) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative h-full w-full flex flex-col items-center justify-center gap-1 transition-all group select-none active:scale-95"
                title="Konsultasi WhatsApp"
              >
                <div className="transition-transform duration-200 group-hover:scale-110">
                  {item.icon(false)}
                </div>
                <span className="text-[11px] font-semibold text-neutral-600 group-hover:text-[#16a34a] leading-none transition-colors">
                  {item.label}
                </span>
              </a>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative h-full w-full flex flex-col items-center justify-center gap-1 transition-all group select-none active:scale-95"
            >
              {/* Active Top Line Indicator */}
              {isActive && (
                <span className="absolute top-0 w-8 h-[2.5px] rounded-b-full bg-brand" />
              )}

              <div
                className={`transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-brand' : 'text-neutral-400 group-hover:text-neutral-600'
                }`}
              >
                {item.icon(isActive)}
              </div>
              <span
                className={`text-[11px] leading-none transition-colors ${
                  isActive
                    ? 'text-brand font-bold'
                    : 'text-neutral-500 font-medium group-hover:text-neutral-800'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
