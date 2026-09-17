import { headers } from 'next/headers';
import Link from 'next/link';
import { getPublicSchedules, getPublicBankAccounts } from '@/lib/api';
import PaketAppClient from '@/components/paket/PaketAppClient';
import FooterSection from '@/components/FooterSection';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import PwaInstallBanner from '@/components/PwaInstallBanner';

export async function generateMetadata() {
  const headerList = await headers();
  const rawHost = headerList.get('x-forwarded-host') || headerList.get('host') || 'azhan.test';
  const host = rawHost.split(':')[0].trim();
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const canonicalUrl = `${proto}://${host}/paket`;

  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const title = `Daftar Paket Umroh & Haji Terlengkap - ${brandName}`;
  const description = `Temukan dan pilih paket umroh terbaik dari ${brandName} dengan jadwal keberangkatan pasti, maskapai terpercaya, dan akomodasi hotel terdekat di Makkah serta Madinah.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: brandName,
      type: 'website',
      images: [
        {
          url: '/hero-makkah.jpg',
          width: 1200,
          height: 630,
          alt: `Daftar Paket Umroh ${brandName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PaketPage({ searchParams }) {
  const headerList = await headers();
  const brandId = headerList.get('x-brand-id');
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandWhatsapp = headerList.get('x-brand-whatsapp') || '';
  const brandLogo = headerList.get('x-brand-logo') || '';
  const brandIcon = headerList.get('x-brand-icon') || '';
  const brandAddress = headerList.get('x-brand-address') || '';
  const brandCity = headerList.get('x-brand-city') || '';
  const brandProvince = headerList.get('x-brand-province') || '';
  const brandEmail = headerList.get('x-brand-email') || '';
  const brandPhone = headerList.get('x-brand-phone') || '';
  const brandGmaps = headerList.get('x-brand-gmaps') || '';
  const brandLegal = headerList.get('x-brand-legal') || 'Izin Resmi PPIU Kemenag RI';
  const brandSocialsRaw = headerList.get('x-brand-socials');

  let brandSocials = null;
  if (brandSocialsRaw) {
    try {
      brandSocials = JSON.parse(brandSocialsRaw);
    } catch {
      // ignore
    }
  }

  const params = await searchParams;
  const initialCategory = params?.kategori || 'all';
  const initialChip = params?.filter || (params?.promo === '1' ? 'promo' : (params?.flash_sale === '1' ? 'flash_sale' : (params?.hampir_penuh === '1' ? 'hampir_penuh' : (params?.banyak_dicari === '1' ? 'banyak_dicari' : 'all'))));
  const initialQuery = params?.q || '';

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
  try {
    schedules = await getPublicSchedules(brandId);
  } catch (err) {
    console.error('Gagal mengambil paket umroh:', err);
  }

  let bankAccounts = [];
  try {
    bankAccounts = await getPublicBankAccounts(brandId);
  } catch (err) {
    console.error('Gagal mengambil rekening bank:', err);
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo && brandLogo.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;
  const fullIconUrl = brandIcon && brandIcon.startsWith('/') ? `${apiBaseUrl}${brandIcon}` : brandIcon;

  return (
    <main className="min-h-screen bg-[#EEF2F6] pb-20 md:pb-6">
      <PwaInstallBanner brandName={brandName} brandId={brandId} brandLogoUrl={fullLogoUrl} />

      {/* ━━━ Container Mobile App Viewport (375px - max-w-md centered, Pure White Seamless) ━━━ */}
      <div className="max-w-md mx-auto min-h-screen bg-white border-x border-neutral-100 flex flex-col relative shadow-2xl shadow-neutral-300/30">

        {/* App Header Row (Sticky, Seamless - sama persis dengan Home) */}
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

        {/* App Content Container */}
        <div className="box-border w-full h-fit flex flex-col gap-[16px] p-[16px_16px_24px_16px]">
          {/* Dynamic App Content Client */}
          <PaketAppClient
            initialSchedules={schedules}
            brandWhatsapp={brandWhatsapp}
            brandName={brandName}
            initialCategory={initialCategory}
            initialChip={initialChip}
            initialQuery={initialQuery}
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
