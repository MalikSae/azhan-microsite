import React from 'react';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import PackageDetailClient from '@/components/paket/PackageDetailClient';
import FooterSection from '@/components/FooterSection';
import { getPublicBankAccounts } from '@/lib/api';

const DUMMY_FALLBACK_SCHEDULES = [
  {
    id: 101,
    jadwal_nama: 'Paket Umroh Hana Reguler Syawal',
    is_promo: true,
    views: 1,
    promo_until: null,
    is_ticket_confirmed: true,
    is_direct_flight: false,
    seat_total: 45,
    seat_sisa: 6,
    maskapai: { id: 10, name: 'EMIRATES', logo_url: '/uploads/airline-logos/181837fa-a756-456f-891c-6f3af052723e.webp' },
    berangkat_tanggal: '2026-10-15',
    berangkat_jam: '08:00',
    berangkat_kode_penerbangan: 'SV815',
    berangkat_bandara_asal: 'CGK',
    berangkat_bandara_tujuan: 'JED',
    pulang_tanggal: '2026-10-24',
    pulang_jam: '14:00',
    pulang_kode_penerbangan: 'SV816',
    pulang_bandara_asal: 'MED',
    pulang_bandara_tujuan: 'CGK',
    transit_bandara: 'Berangkat: KUL, 2 Jam',
    hotel_mekkah: { id: 8, name: 'ANJUM', star_rating: 5, distance_m: 400, photo_url: null },
    hotel_madinah: { id: 7, name: 'ANDALUS', star_rating: 3, distance_m: 350, photo_url: null },
    transit_hotels: [{ hotel_id: 18, urutan: 0, nama: 'ADDRESS DUBAI MALL', kota: 'Dubai', star_rating: 5, photo_url: null }],
    harga_quad: 28500000,
    harga_triple: 30500000,
    harga_double: 33000000,
    harga_infant: 12000000,
    harga_coret: 30000000,
    minimal_dp: 5000000,
    itinerary_id: 14,
    include_items: ['Tiket Pesawat PP', 'Visa Umroh & Asuransi', 'Kereta Cepat Haramain'],
    exclude_items: ['Paspor', 'Kebutuhan Pribadi'],
    add_ons: [{ id: 8, name: 'AL BAIK' }, { id: 10, name: 'CITY TOUR TURKI' }],
    brosur_url: '',
    brosur_thumb_url: '',
  },
  {
    id: 102,
    jadwal_nama: 'Umroh Plus Turki 12 Hari',
    is_promo: false,
    views: 0,
    promo_until: null,
    is_ticket_confirmed: false,
    is_direct_flight: false,
    seat_total: 45,
    seat_sisa: 7,
    maskapai: { id: 9, name: 'TURKISH AIRLINES', logo_url: '' },
    berangkat_tanggal: '2026-11-05',
    pulang_tanggal: '2026-11-16',
    hotel_mekkah: { id: 12, name: 'PULLMAN ZAMZAM', star_rating: 5, distance_m: 100, photo_url: null },
    hotel_madinah: { id: 13, name: 'DAR AL TAQWA', star_rating: 5, distance_m: 50, photo_url: null },
    harga_quad: 44500000,
    harga_triple: 46500000,
    harga_double: 49500000,
    harga_coret: null,
    minimal_dp: 5000000,
    itinerary_id: null,
    include_items: ['Bosphorus Cruise', 'Kereta Cepat Haramain'],
    exclude_items: ['Paspor'],
    add_ons: [],
  },
];

async function getSchedule(id) {
  if (!id) return null;
  const numericId = parseInt(id.split('-')[0], 10);
  if (isNaN(numericId)) return null;
  const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';

  try {
    const res = await fetch(`${baseUrl}/api/schedules/${numericId}`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Gagal mengambil jadwal paket dari API:', err);
  }

  // Fallback ke dummy list jika backend tidak menemukan ID tersebut saat testing
  const dummy = DUMMY_FALLBACK_SCHEDULES.find((s) => s.id === numericId);
  return dummy || null;
}

async function getItinerary(itineraryId) {
  if (!itineraryId) return null;
  const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  try {
    const res = await fetch(`${baseUrl}/api/itineraries/${itineraryId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const schedule = await getSchedule(resolvedParams.id);
  if (!schedule) return { title: 'Paket Tidak Ditemukan' };

  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const domain = headerList.get('host') || 'azhan.test';

  const slug = `${schedule.id}-${(schedule.jadwal_nama || 'paket').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const url = `https://${domain}/paket/${slug}`;

  const kotaBerangkat = schedule.berangkat_bandara_asal || 'Jakarta';
  const dest1 = schedule.hotel_mekkah?.name ? 'Makkah' : '';
  const dest2 = schedule.hotel_madinah?.name ? 'Madinah' : '';
  const destinations = [dest1, dest2].filter(Boolean).join(', ');

  const title = `Paket Umroh ${schedule.jadwal_nama} | ${brandName}`;
  const description = `Paket Umroh ${schedule.jadwal_nama} bersama ${brandName}. Keberangkatan dari ${kotaBerangkat} menuju ${destinations}. Mulai dari Rp ${(schedule.harga_quad || 0).toLocaleString('id-ID')}. Pesan sekarang kursi terbatas!`;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const ogImageUrl = schedule.brosur_thumb_url
    ? schedule.brosur_thumb_url.startsWith('http')
      ? schedule.brosur_thumb_url
      : `${apiBaseUrl}${schedule.brosur_thumb_url}`
    : '/hero-makkah.jpg';

  return {
    title,
    description,
    keywords: `Paket Umroh ${brandName}, Umroh ${schedule.jadwal_nama}, Umroh dari ${kotaBerangkat}, Umroh ${destinations}, Travel Umroh Terbaik`,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: brandName,
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 800,
          alt: `Brosur Paket Umroh ${schedule.jadwal_nama}`,
        },
      ],
      locale: 'id_ID',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PackageDetailPage({ params }) {
  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Hana Tours & Travel';
  const brandWhatsapp = headerList.get('x-brand-whatsapp') || '6281211829993';
  const brandLogo = headerList.get('x-brand-logo');
  const brandId = headerList.get('x-brand-id');
  const brandLegal = headerList.get('x-brand-legal') || 'Izin Resmi PPIU Kemenag RI';
  const brandPpiu = headerList.get('x-brand-ppiu') || '';

  let bankAccounts = [];
  try {
    bankAccounts = await getPublicBankAccounts(brandId);
  } catch (err) {
    console.error('Gagal mengambil rekening bank:', err);
  }
  const brandAddress = headerList.get('x-brand-address') || '';
  const brandCity = headerList.get('x-brand-city') || '';
  const brandProvince = headerList.get('x-brand-province') || '';
  const brandEmail = headerList.get('x-brand-email') || '';
  const brandPhone = headerList.get('x-brand-phone') || '';
  const brandGmaps = headerList.get('x-brand-gmaps') || '';
  const brandSocialsRaw = headerList.get('x-brand-socials');

  let brandSocials = null;
  if (brandSocialsRaw) {
    try {
      brandSocials = JSON.parse(brandSocialsRaw);
    } catch {
      // ignore
    }
  }

  const resolvedParams = await params;
  const schedule = await getSchedule(resolvedParams.id);

  if (!schedule) {
    notFound();
  }

  const itinerary = schedule.itinerary_id ? await getItinerary(schedule.itinerary_id) : null;

  // Status Cut-off H-14: Pendaftaran online ditutup jika keberangkatan < 14 hari
  let isCutoff = false;
  if (schedule.berangkat_tanggal) {
    const depTime = new Date(schedule.berangkat_tanggal + 'T00:00:00').getTime();
    const nowTime = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.round((depTime - nowTime) / (1000 * 60 * 60 * 24));
    isCutoff = diffDays < 14;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo && brandLogo.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;

  // Structured Data (JSON-LD)
  const rawHost = headerList.get('x-forwarded-host') || headerList.get('host') || 'hana.azhan.test';
  const host = rawHost.split(':')[0].trim();
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const baseUrl = `${proto}://${host}`;
  const slug = `${schedule.id}-${(schedule.jadwal_nama || 'paket').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const canonicalUrl = `${baseUrl}/paket/${slug}`;
  const packageImageUrl = schedule.brosur_thumb_url
    ? schedule.brosur_thumb_url.startsWith('http')
      ? schedule.brosur_thumb_url
      : `${apiBaseUrl}${schedule.brosur_thumb_url}`
    : `${baseUrl}/hero-makkah.jpg`;

  const durationDays =
    schedule.berangkat_tanggal && schedule.pulang_tanggal
      ? Math.round(
          (new Date(schedule.pulang_tanggal) - new Date(schedule.berangkat_tanggal)) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: `Paket Umroh ${schedule.jadwal_nama}`,
    image: packageImageUrl,
    description: `Paket Umroh ${schedule.jadwal_nama} bersama ${brandName}. Keberangkatan dari ${schedule.berangkat_bandara_asal || 'Jakarta'}.`,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'IDR',
      price: schedule.harga_quad || 0,
      priceValidUntil: schedule.berangkat_tanggal || undefined,
      availability: (schedule.seat_sisa || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      seller: {
        '@type': 'TravelAgency',
        name: brandName,
        url: baseUrl,
      },
    },
  };

  const touristTripSchema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${canonicalUrl}#trip`,
    name: `Paket Umroh ${schedule.jadwal_nama}`,
    description: `Perjalanan Ibadah Umroh ${durationDays > 0 ? `${durationDays} Hari` : ''} bersama ${brandName}.`,
    touristType: ['Jamaah Umroh', 'Muslim Travelers'],
    offers: {
      '@type': 'Offer',
      price: schedule.harga_quad || 0,
      priceCurrency: 'IDR',
      url: canonicalUrl,
    },
    provider: {
      '@type': 'TravelAgency',
      name: brandName,
      url: baseUrl,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Paket Umroh',
        item: `${baseUrl}/paket`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: schedule.jadwal_nama,
        item: canonicalUrl,
      },
    ],
  };

  const combinedSchemas = [productSchema, touristTripSchema, breadcrumbSchema];

  return (
    <main className="min-h-screen bg-[#EEF2F6] pb-20 md:pb-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchemas) }}
      />
      {/* Seamless Mobile App Shell Container (max-w-md centered on desktop) */}
      <div className="max-w-md mx-auto bg-white border-x border-neutral-100 shadow-2xl shadow-neutral-300/30 flex flex-col relative min-h-screen">
        {/* Seamless Client Component */}
        <PackageDetailClient
          schedule={schedule}
          brandName={brandName}
          brandWhatsapp={brandWhatsapp}
          brandLegal={brandLegal}
          brandPpiu={brandPpiu}
          itinerary={itinerary}
          canonicalUrl={canonicalUrl}
          isCutoff={isCutoff}
        />

        {/* Compact Footer Section - Full Width of Container */}
        <FooterSection
          compact={true}
          brandName={brandName}
          brandWhatsapp={brandWhatsapp}
          fullLogoUrl={fullLogoUrl}
          address={brandAddress}
          city={brandCity}
          province={brandProvince}
          email={brandEmail}
          phone={brandPhone}
          gmapsUrl={brandGmaps}
          legalInfo={brandLegal}
          socials={brandSocials}
          bankAccounts={bankAccounts}
        />
      </div>
    </main>
  );
}
