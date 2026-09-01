import { headers } from 'next/headers';
import Link from 'next/link';
import { getPublicSchedules } from '@/lib/api';
import FilterResultsClient from '@/components/FilterResultsClient';
import FooterSection from '@/components/FooterSection';

export async function generateMetadata() {
  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  return {
    title: `Daftar Paket Umroh - ${brandName}`,
    description: `Temukan dan pilih paket umroh terbaik dari ${brandName} dengan jadwal, maskapai, dan hotel sesuai preferensi Anda.`,
  };
}

export default async function PaketFilterPage({ searchParams }) {
  const headerList = await headers();
  const brandId = headerList.get('x-brand-id');
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandWhatsapp = headerList.get('x-brand-whatsapp') || '';
  const brandLogo = headerList.get('x-brand-logo') || '';

  const params = await searchParams;
  const filterParams = {
    bulan: params?.bulan || '',
    harga: params?.harga || '',
    maskapai: params?.maskapai || '',
    promo: params?.promo || '',
  };

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

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo && brandLogo.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;

  return (
    <main className="min-h-screen flex flex-col justify-between">
      <div>
        {/* Header / Brand Bar */}
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              {fullLogoUrl ? (
                <img 
                  src={fullLogoUrl} 
                  alt={`${brandName} Logo`}
                  className="h-8 sm:h-9 max-w-[180px] sm:max-w-[220px] w-auto object-contain"
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-base shadow-xs">
                    {brandName.charAt(0)}
                  </div>
                  <span className="truncate text-sm sm:text-base font-bold text-neutral-900 font-heading">
                    {brandName}
                  </span>
                </div>
              )}
            </Link>

            <Link
              href="/portal"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-xl text-neutral-800 bg-neutral-100 hover:bg-neutral-200 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Portal Jamaah</span>
            </Link>
          </div>
        </header>

        {/* Full-width SEO Banner & Title */}
        <div className="w-full bg-neutral-900 relative">
          <div className="absolute inset-0 opacity-30 bg-[url('/hero-makkah.jpg')] bg-cover bg-center mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 via-neutral-900/50 to-neutral-900/90"></div>
          <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-12 pb-28 md:pt-16 md:pb-32 flex flex-col items-center text-center max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-white mb-4 drop-shadow-md">
              Paket Umroh Terlengkap dari {brandName}
            </h1>
            <p className="text-neutral-200 text-sm md:text-base max-w-2xl font-medium leading-relaxed drop-shadow-sm">
              Temukan pilihan paket ibadah umroh terbaik dengan jadwal keberangkatan pasti, harga transparan, maskapai penerbangan terpercaya, dan akomodasi terdekat di Makkah serta Madinah.
            </p>
          </div>
        </div>

        {/* Content Area (Overlapping Banner) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-20 md:-mt-24 relative z-20">
          {fetchError && (
            <div className="mb-6 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{fetchError}</span>
            </div>
          )}

          <FilterResultsClient
            initialSchedules={schedules}
            filterParams={filterParams}
            brandWhatsapp={brandWhatsapp}
            brandName={brandName}
            brandLogoUrl={fullLogoUrl}
          />
        </div>
      </div>

      {/* Footer Section */}
      <FooterSection
        brandName={brandName}
        brandWhatsapp={brandWhatsapp}
        fullLogoUrl={fullLogoUrl}
      />
    </main>
  );
}


