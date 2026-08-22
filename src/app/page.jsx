import { headers } from 'next/headers';
import Link from 'next/link';
import { getPublicSchedules } from '@/lib/api';
import HeroSearchFilter from '@/components/HeroSearchFilter';
import TrustBar from '@/components/TrustBar';
import PackageListClient from '@/components/PackageListClient';
import WhyChooseUs from '@/components/WhyChooseUs';
import Testimonials from '@/components/Testimonials';
import FaqSection from '@/components/FaqSection';
import FooterSection from '@/components/FooterSection';

export default async function HomePage() {
  const headersList = await headers();
  const brandId = headersList.get('x-brand-id') || '1';
  const brandName = headersList.get('x-brand-name') || 'Hana Tours Travel';
  const brandLogo = headersList.get('x-brand-logo');
  const brandWhatsapp = headersList.get('x-brand-whatsapp') || '6281234567890';

  let schedules = [];
  let fetchError = null;

  try {
    schedules = await getPublicSchedules(brandId);
  } catch (err) {
    console.error('Gagal mengambil paket umroh:', err);
    fetchError = err.message || 'Gagal memuat data paket umroh dari server.';
  }

  // Sort berdasarkan keberangkatan terdekat (ASC) dan batasi 6 paket untuk homepage
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = new Date(a.berangkat_tanggal || '9999-12-31').getTime();
    const dateB = new Date(b.berangkat_tanggal || '9999-12-31').getTime();
    return dateA - dateB;
  });
  const featuredSchedules = sortedSchedules.slice(0, 6);
  const totalSchedulesCount = schedules.length;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo && brandLogo.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;

  return (
    <main className="min-h-screen bg-neutral-50/50">
      {/* Brand Navigation / Top Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
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
                <div className="min-w-0">
                  <h1 className="truncate text-sm sm:text-base font-bold text-neutral-900 leading-tight font-heading">
                    {brandName}
                  </h1>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-3">
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
        </div>
      </header>

      {/* ━━━ SECTION 1: HERO DENGAN EDITORIAL TEXT HIGHLIGHT ━━━ */}
      <section className="relative text-white pt-14 sm:pt-18 md:pt-24 pb-24 sm:pb-28 md:pb-36 px-4 sm:px-6 lg:px-8 bg-neutral-950">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/images/hero-makkah.jpg"
            alt="Latar Belakang Masjidil Haram Makkah"
            className="w-full h-full object-cover object-center brightness-75 contrast-105"
          />
          <div className="absolute inset-0 bg-neutral-950/75" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="text-left md:text-center md:max-w-3xl md:mx-auto space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-semibold text-white shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-success-400"></span>
              <span>Berizin Resmi PPIU Kemenag RI</span>
            </div>

            {/* H1 dengan Editorial Text Highlight Persis Referensi */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading text-white leading-tight sm:leading-snug tracking-tight drop-shadow-md">
              Wujudkan Ibadah Umroh Nyaman Bersama{' '}
              <span className="bg-brand text-white px-2.5 sm:px-3 py-0.5 sm:py-1 inline-block whitespace-nowrap leading-none align-baseline font-black shadow-xs">
                {brandName}
              </span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-neutral-200 leading-relaxed md:max-w-2xl md:mx-auto font-medium drop-shadow-xs">
              Pilihan jadwal keberangkatan pasti, maskapai direct/transit terpercaya, dan akomodasi hotel pilihan dekat masjid untuk kenyamanan ibadah Anda.
            </p>
          </div>
        </div>
      </section>

      {/* ━━━ FLOATING CARD FILTER: OVERLAPPING HERO & CONTENT ━━━ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-16 sm:-mt-18 md:-mt-20 z-20">
        <HeroSearchFilter schedules={schedules} brandName={brandName} />
      </div>

      {/* ━━━ SECTION 2: TRUST BAR ━━━ */}
      <TrustBar />

      {/* ━━━ SECTION 3: KATALOG PAKET UMROH ━━━ */}
      <section className="py-14 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 md:space-y-10">
          <div className="text-left md:text-center md:max-w-2xl md:mx-auto space-y-1.5">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-brand block">
              Katalog Terpilih
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-neutral-900 leading-snug">
              Pilihan Paket Umroh {brandName}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-lg mx-auto">
              Jadwal keberangkatan terdekat dengan fasilitas prima untuk kenyamanan ibadah Anda.
            </p>
          </div>

          {fetchError && (
            <div className="p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{fetchError}</span>
            </div>
          )}

          <PackageListClient
            initialSchedules={featuredSchedules}
            showControls={false}
            brandWhatsapp={brandWhatsapp}
            brandName={brandName}
            brandLogoUrl={fullLogoUrl}
          />

          {/* Tombol Lihat Semua Paket */}
          {totalSchedulesCount > 6 && (
            <div className="pt-4 text-center">
              <Link
                href="/paket"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 px-6 py-3 rounded-2xl transition-all shadow-2xs hover:shadow-xs"
              >
                <span>Lihat Semua Paket ({totalSchedulesCount})</span>
                <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ━━━ SECTION 4: KENAPA PILIH KAMI ━━━ */}
      <WhyChooseUs brandName={brandName} />

      {/* ━━━ SECTION 5: TESTIMONI JAMAAH ━━━ */}
      <Testimonials brandName={brandName} />

      {/* ━━━ SECTION 6: FAQ (PERTANYAAN UMUM) ━━━ */}
      <FaqSection />

      {/* ━━━ SECTION 7: FOOTER (NAP & KONTAK) ━━━ */}
      <FooterSection
        brandName={brandName}
        brandWhatsapp={brandWhatsapp}
        fullLogoUrl={fullLogoUrl}
      />
    </main>
  );
}