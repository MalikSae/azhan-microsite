import { getScheduleForCurrentBrand as getSchedule } from '@/lib/publicSchedule';
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

export default async function BookPackagePage({ params, searchParams }) {
  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Azhan Travel';
  const brandColor = headerList.get('x-brand-color') || '#990000';
  const brandIdStr = headerList.get('x-brand-id') || '0';
  const brandId = parseInt(brandIdStr, 10) || 0;
  const brandWhatsapp = headerList.get('x-brand-whatsapp') || '';
  const brandPpiu = headerList.get('x-brand-ppiu') || '';
  const brandLegal = headerList.get('x-brand-legal') || '';
  const brandLogo = headerList.get('x-brand-logo') || '';

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const initialRoom = resolvedSearchParams?.room || 'quad';

  const [schedule, bankAccounts] = await Promise.all([
    getSchedule(resolvedParams.id),
    getBankAccounts(brandId),
  ]);
  
  if (!schedule) {
    notFound();
  }
  
  const brandIcon = `/brand-icon?brand=${encodeURIComponent(brandId)}`;
  const waNumber = brandWhatsapp.replace(/[^0-9]/g, '');
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo ${brandName}, saya ingin menanyakan info ketersediaan paket ${schedule.jadwal_nama} (${schedule.berangkat_tanggal}).`)}` : '#';

  // Status Cut-off H-14: Pendaftaran online ditutup jika keberangkatan < 14 hari
  let isCutoff = false;
  if (schedule.berangkat_tanggal) {
    const depTime = new Date(schedule.berangkat_tanggal + 'T00:00:00').getTime();
    const nowTime = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.round((depTime - nowTime) / (1000 * 60 * 60 * 24));
    isCutoff = diffDays < 14;
  }
  
  return (
    <main className="min-h-screen bg-[#EEF2F6] pb-20 md:pb-6">
      {/* Seamless Mobile App Shell Container (max-w-md centered on desktop) */}
      <div className="max-w-md mx-auto bg-white border-x border-neutral-100 shadow-2xl shadow-neutral-300/30 flex flex-col relative min-h-screen">
        
        {/* Sticky Header - Konsisten dengan PackageDetailClient */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link 
              href={`/paket/${resolvedParams.id}`} 
              className="w-[34px] h-[34px] flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer"
              title="Kembali ke Detail Paket"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[13px] font-bold text-neutral-900 leading-none truncate">{brandName}</span>
                <svg className="w-3.5 h-3.5 text-[#1877F2] shrink-0" viewBox="0 0 24 24" fill="currentColor" title="Terverifikasi Resmi">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium leading-tight mt-0.5">Formulir Booking</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 px-4 py-4 pb-28">
          {(isCutoff || schedule.seat_sisa <= 0) ? (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm text-center space-y-4 my-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-neutral-900 font-heading">
                  {schedule.seat_sisa <= 0 ? 'Kuota Paket Penuh' : 'Pendaftaran Online Ditutup'}
                </h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {schedule.seat_sisa <= 0 ? 'Kursi paket ini sudah habis. Hubungi admin untuk alternatif keberangkatan.' : `Keberangkatan ${schedule.jadwal_nama} berjarak kurang dari 14 hari atau sudah lewat.`}
                </p>
              </div>

              {isCutoff && <div className="p-3.5 rounded-xl bg-slate-50 border border-neutral-200/80 text-[11.5px] text-neutral-600 leading-relaxed text-left">
                Pendaftaran online mandiri ditutup pada <strong>H-14 keberangkatan</strong> untuk finalisasi manifes tiket penerbangan, visa, dan pemesanan kamar hotel.
              </div>}

              <div className="pt-2 flex flex-col gap-2">
                <Link 
                  href={`/paket/${resolvedParams.id}`} 
                  className="w-full py-3 px-4 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center"
                >
                  Kembali ke Detail Paket
                </Link>
                {waNumber && (
                  <a 
                    href={waLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-wa-cta w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.086 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                    <span>Tanya Tim via WA</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <BookingWizard 
              schedule={schedule} 
              brandName={brandName} 
              brandColor={brandColor} 
              brandId={brandId}
              brandWhatsapp={brandWhatsapp}
              brandPpiu={brandPpiu}
              brandLegal={brandLegal}
              initialRoom={initialRoom}
              initialBankAccounts={bankAccounts || []}
              travelAccounts={bankAccounts || []}
            />
          )}
        </div>
      </div>
    </main>
  );
}
