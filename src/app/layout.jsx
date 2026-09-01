import { headers } from 'next/headers';
import { DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
});

export async function generateMetadata() {
  const headerList = await headers();
  const rawHost = headerList.get('x-forwarded-host') || headerList.get('host') || 'azhan.test';
  const host = rawHost.split(':')[0].trim();
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const baseUrl = `${proto}://${host}`;

  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandId = headerList.get('x-brand-id') || 'default';
  const brandIcon = `/brand-icon?brand=${encodeURIComponent(brandId)}`;
  const customMetaTitle = headerList.get('x-brand-meta-title');
  const customMetaDesc = headerList.get('x-brand-meta-desc');
  const ogImageUrl = headerList.get('x-brand-og-image') || '/hero-makkah.jpg';
  const gscCode = headerList.get('x-brand-gsc-code');

  const defaultTitle = customMetaTitle || `${brandName} - Paket Umroh & Haji Khusus Resmi`;
  const defaultDesc = customMetaDesc || `Pilihan paket umroh dan haji khusus resmi berizin PPIU Kemenag RI dari ${brandName}. Keberangkatan pasti, hotel dekat masjid, dan bimbingan ibadah sesuai Sunnah.`;

  const metadata = {
    metadataBase: new URL(baseUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${brandName}`,
    },
    description: defaultDesc,
    keywords: [
      `Paket Umroh ${brandName}`,
      `Travel Umroh ${brandName}`,
      'Paket Umroh 9 Hari',
      'Paket Umroh 12 Hari',
      'Haji Khusus',
      'Biaya Umroh Resmi',
      'Biro Umroh Kemenag',
    ],
    authors: [{ name: brandName, url: baseUrl }],
    creator: brandName,
    publisher: brandName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [{ url: brandIcon }],
      shortcut: [{ url: brandIcon }],
      apple: [{ url: brandIcon }],
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: baseUrl,
      siteName: brandName,
      title: defaultTitle,
      description: defaultDesc,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Paket Umroh & Haji ${brandName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: defaultDesc,
      images: [ogImageUrl],
    },
  };

  if (gscCode) {
    metadata.verification = {
      google: gscCode.replace(/^(google-site-verification=)/, '').trim(),
    };
  }

  return metadata;
}

export default async function RootLayout({ children }) {
  const headerList = await headers();
  const rawHost = headerList.get('x-forwarded-host') || headerList.get('host') || 'azhan.test';
  const host = rawHost.split(':')[0].trim();
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const baseUrl = `${proto}://${host}`;

  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandId = headerList.get('x-brand-id') || 'default';
  const brandColor = headerList.get('x-brand-color') || '#B87A3A';
  const brandLogo = headerList.get('x-brand-logo') || '';
  const brandWhatsapp = headerList.get('x-brand-whatsapp') || '';
  const brandAddress = headerList.get('x-brand-address') || '';
  const brandCity = headerList.get('x-brand-city') || '';
  const brandProvince = headerList.get('x-brand-province') || '';
  const brandEmail = headerList.get('x-brand-email') || '';
  const brandPhone = headerList.get('x-brand-phone') || '';
  const brandGmaps = headerList.get('x-brand-gmaps') || '';
  const brandLegal = headerList.get('x-brand-legal') || 'Izin Resmi PPIU Kemenag RI';
  const brandSocialsRaw = headerList.get('x-brand-socials');

  let sameAsLinks = [];
  if (brandSocialsRaw) {
    try {
      const parsedSocials = JSON.parse(brandSocialsRaw);
      sameAsLinks = Object.values(parsedSocials).filter(Boolean);
    } catch {
      // ignore JSON parse error
    }
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo ? (brandLogo.startsWith('http') ? brandLogo : `${apiBaseUrl}${brandLogo}`) : undefined;

  // Schema.org TravelAgency / LocalBusiness
  const travelAgencySchema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${baseUrl}/#organization`,
    name: brandName,
    url: baseUrl,
    logo: fullLogoUrl,
    image: fullLogoUrl,
    description: `Penyelenggara Perjalanan Ibadah Umroh (PPIU) dan Haji Khusus resmi berizin Kemenag RI dari ${brandName}.`,
    telephone: brandPhone || (brandWhatsapp ? `+${brandWhatsapp.replace(/[^0-9]/g, '')}` : undefined),
    email: brandEmail || undefined,
    priceRange: '$$$',
    hasMap: brandGmaps || undefined,
    sameAs: sameAsLinks.length > 0 ? sameAsLinks : undefined,
    award: brandLegal,
    knowsAbout: ['Ibadah Umroh', 'Haji Khusus', 'Badal Umroh', 'Tiket Pesawat & Visa Umroh', 'Akomodasi Hotel Makkah Madinah'],
    address: brandAddress || brandCity ? {
      '@type': 'PostalAddress',
      streetAddress: brandAddress || undefined,
      addressLocality: brandCity || 'Jakarta',
      addressRegion: brandProvince || 'DKI Jakarta',
      addressCountry: 'ID',
    } : undefined,
  };

  return (
    <html lang="id" style={{ '--brand-primary': brandColor }} suppressHydrationWarning className={dmSans.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(travelAgencySchema) }}
        />
      </head>
      <body className={`antialiased text-neutral-900 min-h-screen bg-neutral-50 ${dmSans.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
