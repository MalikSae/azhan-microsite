import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import BookingWizard from '@/components/booking/BookingWizard';

async function getSchedule(id) {
  if (!id) return null;
  const numericId = id.split('-')[0];
  const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const res = await fetch(`${baseUrl}/api/schedules/${numericId}`, { cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Gagal memuat detail paket');
  }
  return res.json();
}

export default async function BookPackagePage({ params }) {
  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Azhan Travel';
  const brandColor = headerList.get('x-brand-color') || '#3b82f6';
  const brandIdStr = headerList.get('x-brand-id') || '0';
  const brandId = parseInt(brandIdStr, 10) || 0;

  const resolvedParams = await params;
  const schedule = await getSchedule(resolvedParams.id);
  
  if (!schedule) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 md:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <BookingWizard 
          schedule={schedule} 
          brandName={brandName} 
          brandColor={brandColor} 
          brandId={brandId}
        />
      </div>
    </div>
  );
}
