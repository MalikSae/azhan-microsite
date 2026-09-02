import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import BookingWizard from '@/components/booking/BookingWizard';

async function getBankAccounts(brandId) {
  if (!brandId) return [];
  const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  try {
    const res = await fetch(`${baseUrl}/api/public/bank-accounts?brand_id=${brandId}&active=true`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

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
  const [schedule, bankAccounts] = await Promise.all([
    getSchedule(resolvedParams.id),
    getBankAccounts(brandId),
  ]);
  
  if (!schedule) {
    notFound();
  }
  
  const brandIcon = `/brand-icon?brand=${encodeURIComponent(brandId)}`;
  
  return (
    <>
      {/* Navbar / Header Simple */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <Link href={`/paket/${resolvedParams.id}`} className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="h-5 w-px bg-neutral-200 mx-1"></div>
            <div className="flex items-center gap-1.5">
                <img src={brandIcon} alt={brandName} className="w-7 h-7 object-contain rounded" />
                <span className="font-bold text-neutral-900 text-[13px]">{brandName}</span>
                <svg className="w-4 h-4 text-[#1877F2] shrink-0" viewBox="0 0 24 24" fill="currentColor" title="Terverifikasi Resmi">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              </div>
          </div>
          <div className="hidden sm:block font-bold text-neutral-800 text-sm md:text-base">
            Formulir Booking
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-slate-50 pt-6 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <BookingWizard 
            schedule={schedule} 
            brandName={brandName} 
            brandColor={brandColor} 
            brandId={brandId}
            initialBankAccounts={bankAccounts || []}
            travelAccounts={bankAccounts || []}
          />
        </div>
      </div>
    </>
  );
}
