import { headers } from 'next/headers';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import SeatProgressBar from '@/components/SeatProgressBar';
import WhatsAppButton from '@/components/WhatsAppButton';
import PackageCard from '@/components/PackageCard';
import InteractiveSection from './InteractiveSection';

export default async function DesignSystemPage() {
  const headerList = await headers();
  const brandName = headerList.get('x-brand-name') || 'Travel Umroh';
  const brandColor = headerList.get('x-brand-color') || '#134396';

  const dummyNormal = {
    name: 'Paket Umroh Reguler 9 Hari',
    price: 25000000,
    departure_date: '2024-12-10',
    duration_days: 9,
    airline_name: 'Saudia Airlines',
    hotel_makkah_name: 'Swissotel Makkah',
    hotel_makkah_star: 5,
    hotel_madinah_name: 'Anwar Al Madinah',
    hotel_madinah_star: 5,
    total_seat: 45,
    booked_seat: 10,
    is_promo: false
  };

  const dummyPromo = {
    name: 'Paket Umroh Spesial Ramadhan',
    price: 32000000,
    harga_coret: 35000000,
    departure_date: '2025-03-01',
    duration_days: 12,
    airline_name: 'Garuda Indonesia',
    hotel_makkah_name: 'Pullman Zamzam',
    hotel_makkah_star: 5,
    hotel_madinah_name: 'Rove Madinah',
    hotel_madinah_star: 4,
    total_seat: 45,
    booked_seat: 20,
    is_promo: true
  };

  const dummyFull = {
    name: 'Paket Umroh Hemat Syawal',
    price: 23000000,
    departure_date: '2025-04-15',
    duration_days: 9,
    airline_name: 'Lion Air',
    hotel_makkah_name: 'Olayan Makkah',
    hotel_makkah_star: 3,
    hotel_madinah_name: 'Concorde Madinah',
    hotel_madinah_star: 3,
    total_seat: 45,
    booked_seat: 42,
    is_promo: false
  };

  const neutralShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

  return (
    <main className="min-h-screen bg-neutral-50 p-4 sm:p-8 pb-20">
      <div className="max-w-6xl mx-auto space-y-12 bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-neutral-200">
        
        {/* Section Info Brand Aktif */}
        <section className="border-b border-neutral-100 pb-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Info Brand Aktif</h2>
          <div className="flex flex-col gap-2 text-sm text-neutral-600">
            <p><strong>Nama Brand:</strong> {brandName}</p>
            <p><strong>Warna Brand:</strong> {brandColor}</p>
          </div>
        </section>

        {/* Section Warna */}
        <section className="border-b border-neutral-100 pb-8 space-y-6">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Warna</h2>
          
          <div>
            <h3 className="font-semibold text-neutral-700 mb-3 text-sm">Neutral Scale</h3>
            <div className="flex flex-wrap gap-3">
              {neutralShades.map(shade => (
                <div key={shade} className="flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 rounded-md shadow-sm bg-neutral-${shade}`}></div>
                  <span className="text-xs text-neutral-500">{shade}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-700 mb-3 text-sm">Semantic (Status)</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-md shadow-sm bg-success-500"></div>
                <span className="text-xs text-neutral-500">Success</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-md shadow-sm bg-warning-500"></div>
                <span className="text-xs text-neutral-500">Warning</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-md shadow-sm bg-danger-500"></div>
                <span className="text-xs text-neutral-500">Danger</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-700 mb-3 text-sm">Brand Primary (.bg-brand)</h3>
            <div className="flex items-center gap-3">
              <div className="w-24 h-24 rounded-lg shadow-sm bg-brand flex items-center justify-center text-white text-xs font-medium">
                .bg-brand
              </div>
            </div>
          </div>
        </section>

        {/* Section Tipografi */}
        <section className="border-b border-neutral-100 pb-8 space-y-4">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Tipografi (DM Sans)</h2>
          <div className="space-y-4 text-neutral-900">
            <div className="flex items-baseline gap-4"><span className="w-20 text-xs text-neutral-400 shrink-0">text-3xl</span><p className="text-3xl font-bold">Heading Tiga (3xl)</p></div>
            <div className="flex items-baseline gap-4"><span className="w-20 text-xs text-neutral-400 shrink-0">text-2xl</span><p className="text-2xl font-bold">Heading Dua (2xl)</p></div>
            <div className="flex items-baseline gap-4"><span className="w-20 text-xs text-neutral-400 shrink-0">text-xl</span><p className="text-xl font-bold">Heading Satu (xl)</p></div>
            <div className="flex items-baseline gap-4"><span className="w-20 text-xs text-neutral-400 shrink-0">text-lg</span><p className="text-lg font-semibold">Teks Lebih Besar (lg)</p></div>
            <div className="flex items-baseline gap-4"><span className="w-20 text-xs text-neutral-400 shrink-0">text-base</span><p className="text-base">Paragraf Standar (base) - The quick brown fox jumps over the lazy dog.</p></div>
            <div className="flex items-baseline gap-4"><span className="w-20 text-xs text-neutral-400 shrink-0">text-sm</span><p className="text-sm text-neutral-600">Teks Kecil (sm) - Sering dipakai untuk deskripsi sekunder.</p></div>
            <div className="flex items-baseline gap-4"><span className="w-20 text-xs text-neutral-400 shrink-0">text-xs</span><p className="text-xs text-neutral-500 uppercase font-medium">Teks Ekstra Kecil (xs) - Label atau badge.</p></div>
          </div>
        </section>

        {/* Section Button */}
        <section className="border-b border-neutral-100 pb-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Button</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="md">Primary MD</Button>
            <Button variant="primary" size="sm">Primary SM</Button>
            <Button variant="secondary" size="md">Secondary MD</Button>
            <Button variant="secondary" size="sm">Secondary SM</Button>
            <Button variant="primary" size="md" disabled>Disabled</Button>
          </div>
        </section>

        {/* Section Badge */}
        <section className="border-b border-neutral-100 pb-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Badge</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="promo">Promo</Badge>
            <Badge variant="success">Tersedia</Badge>
            <Badge variant="neutral">Draft</Badge>
          </div>
        </section>

        {/* Section EmptyState */}
        <section className="border-b border-neutral-100 pb-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Empty State</h2>
          <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
            <EmptyState title="Contoh Empty State" message="Ini contoh pesan ketika data kosong atau tidak ditemukan." />
          </div>
        </section>

        {/* Section SeatProgressBar */}
        <section className="border-b border-neutral-100 pb-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Seat Progress Bar</h2>
          <div className="space-y-6 max-w-md">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-2">Kondisi Aman (Hijau)</p>
              <SeatProgressBar totalSeat={45} bookedSeat={15} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-2">Kondisi Hampir Penuh (Warning)</p>
              <SeatProgressBar totalSeat={45} bookedSeat={42} />
            </div>
          </div>
        </section>

        {/* Section SearchBar & SortDropdown */}
        <section className="border-b border-neutral-100 pb-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Search & Sort</h2>
          <InteractiveSection />
        </section>

        {/* Section WhatsAppButton */}
        <section className="border-b border-neutral-100 pb-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">WhatsApp Button</h2>
          <div className="space-y-4 max-w-sm">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-2">Aktif</p>
              <WhatsAppButton brandWhatsapp="6281234567890" packageName="Paket Umroh Dummy" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-2">Disabled (Props Kosong)</p>
              <WhatsAppButton brandWhatsapp="" packageName="Paket Umroh Dummy" />
            </div>
          </div>
        </section>

        {/* Section PackageCard */}
        <section>
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Package Card</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PackageCard schedule={dummyNormal} brandWhatsapp="6281234567890" />
            <PackageCard schedule={dummyPromo} brandWhatsapp="6281234567890" />
            <PackageCard schedule={dummyFull} brandWhatsapp="6281234567890" />
          </div>
        </section>

      </div>
    </main>
  );
}
