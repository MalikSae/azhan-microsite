import { headers } from 'next/headers';
import { DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
});

function resolveBrandIcon(brandLogo) {
  const fallbackIcon = '/globe.svg';

  if (!brandLogo) return fallbackIcon;

  try {
    if (/^https?:\/\//i.test(brandLogo)) {
      return new URL(brandLogo).toString();
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl || !brandLogo.startsWith('/')) return fallbackIcon;

    return new URL(brandLogo, `${apiBaseUrl.replace(/\/$/, '')}/`).toString();
  } catch {
    return fallbackIcon;
  }
}

export async function generateMetadata() {
  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandIcon = resolveBrandIcon(headerList.get('x-brand-logo'));

  return {
    title: `${brandName} - Paket Umroh & Haji`,
    description: `Paket Umroh & Haji Terpercaya dari ${brandName}`,
    icons: {
      icon: [{ url: brandIcon }],
      shortcut: [{ url: brandIcon }],
      apple: [{ url: brandIcon }],
    },
  };
}

export default async function RootLayout({ children }) {
  const headerList = await headers();
  const brandColor = headerList.get('x-brand-color') || '#B87A3A';

  return (
    <html lang="id" style={{ '--brand-primary': brandColor }} suppressHydrationWarning className={dmSans.variable}>
      <body className={`antialiased text-neutral-900 min-h-screen bg-neutral-50 ${dmSans.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
