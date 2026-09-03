import { headers } from 'next/headers';
import { BrandProvider } from '@/context/BrandContext';
import { PortalAuthProvider } from '@/context/PortalAuthContext';

export default async function PortalLayout({ children }) {
  const headerList = await headers();
  const brandId = headerList.get('x-brand-id');
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandColor = headerList.get('x-brand-color') || '#B87A3A';
  const brandLogo = headerList.get('x-brand-logo') || '';
  const brandIcon = headerList.get('x-brand-icon') || '';
  const brandWhatsapp = headerList.get('x-brand-whatsapp') || '';
  const brandContextValue = {
    brandId,
    brandName,
    brandColor,
    brandLogo,
    brandIcon,
    brandWhatsapp,
  };
  return (
    <BrandProvider value={brandContextValue}>
      <PortalAuthProvider>
        {children}
      </PortalAuthProvider>
    </BrandProvider>
  );
}
