import { headers } from 'next/headers';
import Link from 'next/link';
import { getPublicSchedules } from '@/lib/api';
import PackageListClient from '@/components/PackageListClient';

export default async function HomePage() {
  const headerList = await headers();
  const brandId = headerList.get('x-brand-id');
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandWhatsapp = headerList.get('x-brand-whatsapp') || '';
  const brandLogo = headerList.get('x-brand-logo') || '';

  if (!brandId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center max-w-md">
          <p className="text-neutral-600 font-medium">Informasi brand tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  let schedules = [];
  let fetchError = null;

  try {
    schedules = await getPublicSchedules(brandId);
  } catch (err) {
    console.error('Gagal mengambil paket umroh:', err);
    fetchError = err.message || 'Gagal memuat data paket umroh dari server.';
  }

  // Handle URL logo (if relative, prefix with API base URL)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo && brandLogo.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;

  return (
    <main className="min-h-screen pb-10">
      {/* Brand Navigation / Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 shadow-xs">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {fullLogoUrl ? (
              <img 
                src={fullLogoUrl} 
                alt={`${brandName} Logo`}
                className="h-9 max-w-[190px] w-auto object-contain"
              />
            ) : (
              <>
                <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-lg shadow-xs">
                  {brandName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold text-neutral-900 leading-tight">
                    {brandName}
                  </h1>
                  <p className="truncate text-[10px] text-neutral-500 font-medium">
                    Umroh & Haji Terpercaya
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="shrink-0">
            {/* Link Portal Jamaah */}
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 rounded-xl text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Portal</span>
            </Link>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-4 pt-5">
        {/* Error Alert if fetch failed */}
        {fetchError && (
          <div className="mb-6 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{fetchError}</span>
          </div>
        )}

        {/* Package List Client Component */}
        <PackageListClient
          initialSchedules={schedules}
          brandWhatsapp={brandWhatsapp}
          brandName={brandName}
          brandLogoUrl={fullLogoUrl}
        />
      </div>
    </main>
  );
}
