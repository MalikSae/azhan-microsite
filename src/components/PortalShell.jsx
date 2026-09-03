'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Official Heroicons v2 (24x24) - Direct from Tailwind Labs Heroicons
const navItems = [
  {
    name: 'Beranda',
    href: '/portal',
    exact: true,
    icon: (isActive) =>
      isActive ? (
        // Heroicons 24/solid/home.svg
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.4697 3.84099C11.7626 3.5481 12.2374 3.5481 12.5303 3.84099L21.2197 12.5303C21.5126 12.8232 21.9874 12.8232 22.2803 12.5303C22.5732 12.2374 22.5732 11.7626 22.2803 11.4697L13.591 2.78033C12.7123 1.90165 11.2877 1.90165 10.409 2.78033L1.71967 11.4697C1.42678 11.7626 1.42678 12.2374 1.71967 12.5303C2.01256 12.8232 2.48744 12.8232 2.78033 12.5303L11.4697 3.84099Z" />
          <path d="M12 5.43198L20.159 13.591C20.1887 13.6207 20.2191 13.6494 20.25 13.6771V19.875C20.25 20.9105 19.4105 21.75 18.375 21.75H15C14.5858 21.75 14.25 21.4142 14.25 21V16.5C14.25 16.0858 13.9142 15.75 13.5 15.75H10.5C10.0858 15.75 9.75 16.0858 9.75 16.5V21C9.75 21.4142 9.41421 21.75 9 21.75H5.625C4.58947 21.75 3.75 20.9105 3.75 19.875V13.6771C3.78093 13.6494 3.81127 13.6207 3.84099 13.591L12 5.43198Z" />
        </svg>
      ) : (
        // Heroicons 24/outline/home.svg
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12L11.2045 3.04549C11.6438 2.60615 12.3562 2.60615 12.7955 3.04549L21.75 12M4.5 9.75V19.875C4.5 20.4963 5.00368 21 5.625 21H9.75V16.125C9.75 15.5037 10.2537 15 10.875 15H13.125C13.7463 15 14.25 15.5037 14.25 16.125V21H18.375C18.9963 21 19.5 20.4963 19.5 19.875V9.75M8.25 21H16.5" />
        </svg>
      ),
  },
  {
    name: 'Perjalanan',
    href: '/portal/perjalanan',
    exact: false,
    icon: (isActive) =>
      isActive ? (
        // Heroicons 24/solid/paper-airplane.svg
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.47804 2.4043C3.2133 2.3274 2.92771 2.40193 2.73432 2.5984C2.54093 2.79487 2.47091 3.0816 2.55198 3.3451L4.98426 11.25H13.5C13.9142 11.25 14.25 11.5858 14.25 12C14.25 12.4142 13.9142 12.75 13.5 12.75H4.98427L2.55207 20.6546C2.471 20.9181 2.54102 21.2049 2.73441 21.4013C2.92781 21.5978 3.2134 21.6723 3.47814 21.5954C10.1767 19.6494 16.3974 16.5814 21.9233 12.6087C22.1193 12.4678 22.2355 12.2412 22.2355 11.9998C22.2355 11.7583 22.1193 11.5317 21.9233 11.3908C16.3974 7.41817 10.1767 4.35021 3.47804 2.4043Z" />
        </svg>
      ) : (
        // Heroicons 24/outline/paper-airplane.svg
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.99972 12L3.2688 3.12451C9.88393 5.04617 16.0276 8.07601 21.4855 11.9997C16.0276 15.9235 9.884 18.9535 3.26889 20.8752L5.99972 12ZM5.99972 12L13.5 12" />
        </svg>
      ),
  },
  {
    name: 'Syiar',
    href: '/portal/syiar',
    exact: false,
    icon: (isActive) =>
      isActive ? (
        // Heroicons 24/solid/megaphone.svg
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.8812 4.34543C14.81 5.17401 12.5917 5.7132 10.276 5.91302C9.60847 5.97061 8.93276 6.00002 8.25 6.00002H7.5C4.60051 6.00002 2.25 8.35052 2.25 11.25C2.25 13.8496 4.13945 16.0079 6.61997 16.4266C6.95424 17.7956 7.41805 19.1138 7.99764 20.3674C8.46171 21.3712 9.67181 21.6875 10.5803 21.163L11.2366 20.784C12.1167 20.2759 12.4023 19.1913 12.0087 18.3159C11.7738 17.7935 11.5642 17.2574 11.3814 16.709C13.2988 16.9671 15.1419 17.4588 16.8812 18.1546C17.6069 15.9852 18 13.6635 18 11.25C18 8.83648 17.6069 6.51478 16.8812 4.34543Z" />
          <path d="M18.2606 3.74072C19.0641 6.09642 19.5 8.6223 19.5 11.25C19.5 13.8777 19.0641 16.4036 18.2606 18.7593C18.2054 18.9211 18.1487 19.0821 18.0901 19.2422C17.9477 19.6312 18.1476 20.0619 18.5366 20.2043C18.9256 20.3467 19.3563 20.1468 19.4987 19.7578C19.6387 19.3753 19.7696 18.9884 19.891 18.5973C20.4147 16.9106 20.7627 15.1469 20.914 13.3278C21.431 12.7893 21.75 12.0567 21.75 11.25C21.75 10.4434 21.431 9.71073 20.914 9.17228C20.7627 7.35319 20.4147 5.58948 19.891 3.90274C19.7696 3.51165 19.6387 3.12472 19.4987 2.74221C19.3563 2.35324 18.9256 2.15334 18.5366 2.29572C18.1476 2.43811 17.9477 2.86885 18.0901 3.25783C18.1487 3.41795 18.2055 3.57898 18.2606 3.74072Z" />
        </svg>
      ) : (
        // Heroicons 24/outline/megaphone.svg
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.3404 15.8398C9.65153 15.7803 8.95431 15.75 8.25 15.75H7.5C5.01472 15.75 3 13.7353 3 11.25C3 8.76472 5.01472 6.75 7.5 6.75H8.25C8.95431 6.75 9.65153 6.71966 10.3404 6.66022M10.3404 15.8398C10.5933 16.8015 10.9237 17.7317 11.3246 18.6234C11.5721 19.1738 11.3842 19.8328 10.8616 20.1345L10.2053 20.5134C9.6539 20.8318 8.9456 20.6306 8.67841 20.0527C8.0518 18.6973 7.56541 17.2639 7.23786 15.771M10.3404 15.8398C9.95517 14.3745 9.75 12.8362 9.75 11.25C9.75 9.66379 9.95518 8.1255 10.3404 6.66022M10.3404 15.8398C13.5 16.1124 16.4845 16.9972 19.1747 18.3749M10.3404 6.66022C13.5 6.3876 16.4845 5.50283 19.1747 4.12509M19.1747 4.12509C19.057 3.74595 18.9302 3.37083 18.7944 3M19.1747 4.12509C19.7097 5.84827 20.0557 7.65462 20.1886 9.51991M19.1747 18.3749C19.057 18.7541 18.9302 19.1292 18.7944 19.5M19.1747 18.3749C19.7097 16.6517 20.0557 14.8454 20.1886 12.9801M20.1886 9.51991C20.6844 9.93264 21 10.5545 21 11.25C21 11.9455 20.6844 12.5674 20.1886 12.9801M20.1886 9.51991C20.2293 10.0913 20.25 10.6682 20.25 11.25C20.25 11.8318 20.2293 12.4087 20.1886 12.9801" />
        </svg>
      ),
  },
  {
    name: 'Profil',
    href: '/portal/profil',
    exact: false,
    icon: (isActive) =>
      isActive ? (
        // Heroicons 24/solid/user.svg
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M7.49996 6C7.49996 3.51472 9.51468 1.5 12 1.5C14.4852 1.5 16.5 3.51472 16.5 6C16.5 8.48528 14.4852 10.5 12 10.5C9.51468 10.5 7.49996 8.48528 7.49996 6Z" />
          <path fillRule="evenodd" clipRule="evenodd" d="M3.75121 20.1053C3.82855 15.6156 7.49195 12 12 12C16.5081 12 20.1716 15.6157 20.2487 20.1056C20.2538 20.4034 20.0823 20.676 19.8116 20.8002C17.4327 21.8918 14.7865 22.5 12.0003 22.5C9.21382 22.5 6.5674 21.8917 4.18829 20.7999C3.91762 20.6757 3.74608 20.4031 3.75121 20.1053Z" />
        </svg>
      ) : (
        // Heroicons 24/outline/user.svg
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6C15.75 8.07107 14.071 9.75 12 9.75C9.9289 9.75 8.24996 8.07107 8.24996 6C8.24996 3.92893 9.9289 2.25 12 2.25C14.071 2.25 15.75 3.92893 15.75 6Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5011 20.1182C4.5714 16.0369 7.90184 12.75 12 12.75C16.0982 12.75 19.4287 16.0371 19.4988 20.1185C17.216 21.166 14.6764 21.75 12.0003 21.75C9.32396 21.75 6.78406 21.1659 4.5011 20.1182Z" />
        </svg>
      ),
  },
];

export default function PortalShell({ children }) {
  const pathname = usePathname() || '';

  // Auth pages (login & aktivasi) render children directly without shell/nav
  if (pathname === '/portal/login' || pathname === '/portal/aktivasi') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh w-full bg-white sm:bg-neutral-100 flex justify-center items-center overflow-x-hidden">
      {/* Frame Kontainer Utama */}
      <div className="w-full max-w-[420px] min-h-dvh bg-white sm:border-x sm:border-neutral-200/80 sm:shadow-lg flex flex-col justify-between relative overflow-hidden">
        {/* Area Konten */}
        <main className="flex-1 flex flex-col overflow-y-auto pb-16 w-full">
          {children}
        </main>

        {/* Bottom Navigation Bar (Dalam batas frame 420px, ter-center di desktop) */}
        <nav
          aria-label="Navigasi Portal"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white/95 backdrop-blur-md border-t border-neutral-200/80 z-30 px-2"
        >
          <div className="grid grid-cols-4 h-14">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                    isActive
                      ? 'text-brand font-semibold'
                      : 'text-neutral-400 hover:text-neutral-600 font-medium'
                  }`}
                >
                  <div className="transition-transform active:scale-95">
                    {item.icon(isActive)}
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
