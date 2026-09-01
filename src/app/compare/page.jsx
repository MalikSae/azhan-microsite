import { headers } from 'next/headers';
import Link from 'next/link';
import { getPublicSchedules } from '@/lib/api';
import ComparePackagesClient from '@/components/ComparePackagesClient';

export async function generateMetadata() {
  const headerList = await headers();
  const rawHost = headerList.get('x-forwarded-host') || headerList.get('host') || 'azhan.test';
  const host = rawHost.split(':')[0].trim();
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';

  return {
    title: `Bandingkan Paket Umroh - ${brandName}`,
    description: `Bandingkan jadwal, fasilitas, hotel, dan harga paket umroh ${brandName}.`,
    alternates: {
      canonical: `${proto}://${host}/compare`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function ComparePage({ searchParams }) {
  const headerList = await headers();
  const brandId = headerList.get('x-brand-id');
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandWhatsapp = headerList.get('x-brand-whatsapp') || '6281234567890';
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
    <main className="min-h-screen bg-neutral-50/60 pb-16">
      {/* Header Halaman */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Kembali ke beranda"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="font-bold text-base md:text-lg text-neutral-900 leading-tight">
                Bandingkan Paket Umroh
              </h1>
              <p className="truncate text-xs text-neutral-500">{brandName}</p>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors hidden sm:block"
          >
            Lihat Semua Paket
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-5">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : (
          <ComparePackagesClient
            schedules={schedules}
            initialPackageId={initialPackageId}
            initialOpponentId={initialOpponentId}
            brandWhatsapp={brandWhatsapp}
            brandName={brandName}
          />
        )}
      </div>
    </main>
  );
}
