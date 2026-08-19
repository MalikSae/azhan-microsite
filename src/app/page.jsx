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
    <main className="min-h-screen pb-16">
      {/* Brand Navigation / Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {fullLogoUrl ? (
              <img 
                src={fullLogoUrl} 
                alt={`${brandName} Logo`}
                className="h-8 md:h-9 w-auto object-contain"
              />
            ) : (
              <>
                <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-lg shadow-xs">
                  {brandName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-neutral-900 leading-tight">
                    {brandName}
                  </h1>
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Pilihan Paket Umroh & Haji Terbaik
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Link Portal Jamaah */}
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Portal Jamaah</span>
            </Link>

            {/* Quick Contact Header Button if WhatsApp exists */}
            {brandWhatsapp && (
              <a
                href={`https://wa.me/${brandWhatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
              >
                <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
                <span>Hubungi Kami</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Banner Title Section */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Paket Umroh {brandName}
          </h1>
          <p className="text-neutral-600 text-sm mt-2">
            Temukan dan pesan keberangkatan umroh resmi terpercaya dari {brandName}.
          </p>
        </div>

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
