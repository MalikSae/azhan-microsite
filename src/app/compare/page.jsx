import { headers } from 'next/headers';
import Link from 'next/link';
import { getPublicSchedules } from '@/lib/api';
import ComparePackagesClient from '@/components/ComparePackagesClient';

export async function generateMetadata() {
  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  return {
    title: `Bandingkan Paket - ${brandName}`,
    description: `Bandingkan jadwal, fasilitas, hotel, dan harga paket umroh ${brandName}.`,
  };
}

export default async function ComparePage({ searchParams }) {
  const headerList = await headers();
  const brandId = headerList.get('x-brand-id');
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const query = await searchParams;
  const initialPackageId = query?.paket || '';
  const initialOpponentId = query?.lawan || '';

  let schedules = [];
  let errorMessage = '';
  try {
    schedules = brandId ? await getPublicSchedules(brandId) : [];
  } catch (error) {
    errorMessage = error.message || 'Gagal memuat daftar paket.';
  }

  return (
    <main className="min-h-screen pb-10">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            aria-label="Kembali ke daftar paket"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-neutral-900">Bandingkan Paket</h1>
            <p className="truncate text-xs text-neutral-500">{brandName}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4">
        {errorMessage ? (
          <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
            {errorMessage}
          </div>
        ) : (
          <ComparePackagesClient
            schedules={schedules}
            initialPackageId={initialPackageId}
            initialOpponentId={initialOpponentId}
          />
        )}
      </div>
    </main>
  );
}
