'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';

const navItems = [
  { href: '/portal', label: 'Beranda', exact: true, icon: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></> },
  { href: '/portal/dokumen', label: 'Dokumen', icon: <><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/></> },
  { href: '/portal/pembayaran', label: 'Pembayaran', aliases: ['/portal/booking'], icon: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></> },
  { href: '/portal/profil', label: 'Profil', icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></> },
];

const NavIcon = ({ children }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">{children}</svg>;

export default function PortalMobileShell({ children }) {
  const pathname = usePathname();
  const { brandName, brandLogo } = useBrand();
  const isAuthPage = pathname === '/portal/login' || pathname === '/portal/aktivasi';
  const showPageHeader = ['/portal', '/portal/dokumen', '/portal/pembayaran', '/portal/profil'].includes(pathname);
  const pageTitles = {
    '/portal': 'Beranda',
    '/portal/dokumen': 'Dokumen',
    '/portal/pembayaran': 'Pembayaran',
    '/portal/profil': 'Profil',
  };
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const logoUrl = brandLogo?.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;

  if (isAuthPage) return children;

  return (
    <div className="min-h-dvh bg-[#f5f7fa] pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-neutral-200 bg-white lg:flex">
        <Link href="/" className="flex h-20 items-center border-b border-neutral-100 px-6">
          {logoUrl ? <img src={logoUrl} alt={brandName} className="max-h-10 max-w-[170px] object-contain" /> : <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-bold text-white">{brandName?.charAt(0) || 'A'}</span><span className="font-bold text-neutral-900">{brandName}</span></div>}
        </Link>
        <div className="px-5 pb-2 pt-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Portal Jamaah</p><p className="mt-1 text-sm text-neutral-600">Layanan perjalanan Anda</p></div>
        <nav aria-label="Navigasi portal desktop" className="flex-1 space-y-1 p-4">{navItems.map((item) => { const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) || item.aliases?.some((alias) => pathname.startsWith(alias)); return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${active ? 'bg-brand-light text-brand' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}`}><NavIcon>{item.icon}</NavIcon><span>{item.label}</span></Link>; })}</nav>
        <div className="border-t border-neutral-100 p-5 text-xs leading-5 text-neutral-500">Butuh bantuan?<br/><span className="font-semibold text-neutral-800">Hubungi admin {brandName}</span></div>
      </aside>
      <div className="lg:pl-64">
      {showPageHeader && (
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Portal Jamaah</p>
              <h1 className="truncate text-lg font-bold text-neutral-900 lg:text-2xl">{pageTitles[pathname]}</h1>
            </div>
            <Link href="/" aria-label={`Kembali ke situs ${brandName}`} className="flex h-10 max-w-[150px] items-center justify-end rounded-lg px-1 focus:outline-none focus:ring-2 focus:ring-brand">
              {logoUrl ? <img src={logoUrl} alt={brandName} className="max-h-8 max-w-full object-contain" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{brandName?.charAt(0) || 'A'}</span>}
            </Link>
          </div>
        </header>
      )}

      {children}
      </div>

      <nav aria-label="Navigasi utama portal" className="fixed bottom-0 left-0 z-40 w-full border-t border-neutral-200 bg-white/98 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid h-[68px] grid-cols-4 px-2">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) || item.aliases?.some((alias) => pathname.startsWith(alias));
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${active ? 'text-brand' : 'text-neutral-500 hover:text-neutral-800'}`}>
                {active && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-brand" />}
                <NavIcon>{item.icon}</NavIcon>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
