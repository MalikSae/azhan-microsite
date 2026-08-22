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
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandId = headerList.get('x-brand-id') || 'default';
  const brandIcon = `/brand-icon?brand=${encodeURIComponent(brandId)}`;

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
