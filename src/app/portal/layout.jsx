import { headers } from 'next/headers';
import { BrandProvider } from '@/context/BrandContext';
import { PortalAuthProvider } from '@/context/PortalAuthContext';
import PortalMobileShell from '@/components/PortalMobileShell';

export async function generateMetadata() {
  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  return {
    title: `Portal Jamaah - ${brandName}`,
    description: `Portal Informasi & Layanan Jamaah Resmi ${brandName}`,
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nocache: true,
    },
  };
}

export default async function PortalLayout({ children }) {
  const headerList = await headers();
  const brandId = headerList.get('x-brand-id');
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandColor = headerList.get('x-brand-color') || '#B87A3A';
  const brandLogo = headerList.get('x-brand-logo') || '';
  const brandWhatsapp = headerList.get('x-brand-whatsapp') || '';

  const brandContextValue = {
    brandId,
    brandName,
    brandColor,
    brandLogo,
    brandWhatsapp,
  };

  return (
    <BrandProvider value={brandContextValue}>
      <PortalAuthProvider>
        <PortalMobileShell>{children}</PortalMobileShell>
      </PortalAuthProvider>
    </BrandProvider>
  );
}
