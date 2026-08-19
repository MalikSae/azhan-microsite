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
  return {
    title: `${brandName} - Paket Umroh & Haji`,
    description: `Paket Umroh & Haji Terpercaya dari ${brandName}`,
  };
}

export default async function RootLayout({ children }) {
  const headerList = await headers();
  const brandColor = headerList.get('x-brand-color') || '#B87A3A';

  return (
    <html lang="id" style={{ '--brand-primary': brandColor }} suppressHydrationWarning className={dmSans.variable}>
      <body className={`antialiased bg-neutral-50 text-neutral-900 min-h-screen ${dmSans.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
