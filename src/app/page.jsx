import { headers } from 'next/headers';
import Link from 'next/link';
import { getPublicSchedules, getPublicBankAccounts } from '@/lib/api';
import HomeAppClient from '@/components/home/HomeAppClient';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import FooterSection from '@/components/FooterSection';
import PwaInstallBanner from '@/components/PwaInstallBanner';

export async function generateMetadata() {
  const headerList = await headers();
  const rawHost = headerList.get('x-forwarded-host') || headerList.get('host') || 'azhan.test';
  const host = rawHost.split(':')[0].trim();
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const baseUrl = `${proto}://${host}`;

  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const customMetaTitle = headerList.get('x-brand-meta-title');
  const customMetaDesc = headerList.get('x-brand-meta-desc');
  const ogImageUrl = headerList.get('x-brand-og-image') || '/hero-makkah.jpg';

  const title = customMetaTitle || `Paket Umroh & Haji Khusus Resmi Berizin PPIU | ${brandName}`;
  const description = customMetaDesc || `Pilihan paket umroh terbaik dan terpercaya dari ${brandName}. Jadwal keberangkatan pasti, maskapai terpercaya, hotel dekat masjid, dan bimbingan ibadah sesuai Sunnah.`;

  return {
    title,
    description,
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: brandName,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${brandName} - Paket Umroh & Haji Khusus`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function HomePage() {
  const headersList = await headers();
  const brandId = headersList.get('x-brand-id') || '1';
  const brandName = headersList.get('x-brand-name') || 'Hana Tours Travel';
  const brandLogo = headersList.get('x-brand-logo');
  const brandIcon = headersList.get('x-brand-icon');
  const brandWhatsapp = headersList.get('x-brand-whatsapp') || '6281234567890';
  const brandAddress = headersList.get('x-brand-address') || '';
  const brandCity = headersList.get('x-brand-city') || '';
  const brandProvince = headersList.get('x-brand-province') || '';
  const brandEmail = headersList.get('x-brand-email') || '';
  const brandPhone = headersList.get('x-brand-phone') || '';
  const brandGmaps = headersList.get('x-brand-gmaps') || '';
  const brandLegal = headersList.get('x-brand-legal') || 'Izin Resmi PPIU Kemenag RI';
  const brandSocialsRaw = headersList.get('x-brand-socials');

  let brandSocials = null;
  if (brandSocialsRaw) {
    try {
      brandSocials = JSON.parse(brandSocialsRaw);
    } catch {
      // ignore JSON parse error
    }
  }

  let schedules = [];
  let fetchError = null;

  try {
    schedules = await getPublicSchedules(brandId);
  } catch (err) {
    console.error('Gagal mengambil paket umroh:', err);
    fetchError = err.message || 'Gagal memuat data paket umroh dari server.';
  }

  let bankAccounts = [];
  try {
    bankAccounts = await getPublicBankAccounts(brandId);
  } catch (err) {
    console.error('Gagal mengambil rekening bank:', err);
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
  const fullIconUrl = brandIcon && brandIcon.startsWith('/') ? `${apiBaseUrl}${brandIcon}` : brandIcon;

  return (
    <main className="min-h-screen bg-[#EEF2F6] pb-20 md:pb-6">
      <PwaInstallBanner brandName={brandName} brandId={brandId} brandLogoUrl={fullLogoUrl} />
      
      {/* Container Mobile App Viewport (375px - max-w-md centered, Pure White Seamless) */}
      <div className="max-w-md mx-auto min-h-screen bg-white border-x border-neutral-100 flex flex-col relative shadow-2xl shadow-neutral-300/30">
        
        {/* App Header Row (Sticky, Seamless) */}
        <header className="w-full h-[54px] shrink-0 flex flex-row justify-between items-center px-4 bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-neutral-100">
          {/* Brand Info & Legal Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            {fullIconUrl ? (
              <img
                src={fullIconUrl}
                alt={`${brandName} Icon`}
                className="w-[32px] h-[32px] rounded-[10px] object-contain bg-white border border-neutral-200/80 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-[32px] h-[32px] flex justify-center items-center bg-brand text-white rounded-[10px] shadow-2xs font-extrabold text-[15px] shrink-0">
                {brandName ? brandName.charAt(0) : 'A'}
              </div>
            )}
            <div className="flex flex-col justify-center min-w-0">
              <div className="text-[15px] text-neutral-900 font-extrabold leading-none truncate">
                {brandName}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold leading-none mt-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{brandLegal}</span>
              </div>
            </div>
          </div>

          {/* Header Action: Portal Jamaah */}
          <Link
            href="/portal"
            className="w-[34px] h-[34px] flex justify-center items-center bg-neutral-100 hover:bg-brand-light hover:text-brand text-neutral-700 rounded-full transition-colors shadow-2xs shrink-0"
            title="Portal Jamaah"
          >
            <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </header>

        {/* Dynamic App Content Client */}
        <div className="w-full flex flex-col bg-white">
          <HomeAppClient
            initialSchedules={sortedSchedules}
            brandName={brandName}
            brandWhatsapp={brandWhatsapp}
            brandLogoUrl={fullLogoUrl}
            brandLegal={brandLegal}
          />
        </div>

        {/* Compact App Footer */}
        <FooterSection
          compact={true}
          brandName={brandName}
          brandWhatsapp={brandWhatsapp}
          fullLogoUrl={fullLogoUrl}
          address={brandAddress}
          city={brandCity}
          province={brandProvince}
          email={brandEmail}
          phone={brandPhone}
          gmapsUrl={brandGmaps}
          legalInfo={brandLegal}
          socials={brandSocials}
          bankAccounts={bankAccounts}
        />

        {/* Fixed Mobile Bottom Navigation Bar */}
        <MobileBottomNav brandWhatsapp={brandWhatsapp} />
      </div>
    </main>
  );
}
