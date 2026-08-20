'use client';

import { useEffect, useId, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { getMyBooking, listMyPayments } from '@/lib/portalApi';
import Badge from '@/components/ui/Badge';

const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const tanggal = (value) => value ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value)) : '-';
const progressItems = [
  ['progress_paspor', 'Dokumen Paspor'], ['progress_visa', 'Visa Umroh'], ['progress_tiket', 'Tiket Pesawat'],
  ['progress_hotel', 'Booking Hotel Makkah/Madinah'], ['progress_land_arrangement', 'Land Arrangement'],
  ['progress_manasik', 'Bimbingan Manasik'], ['progress_siskopatuh', 'Pendaftaran Siskopatuh'],
  ['progress_vaksin_meningitis', 'Vaksin Meningitis'],
];

function CollapsibleSection({ title, description, summary, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={id} className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand">
      <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-neutral-900">{title}</span>{open ? <span className="mt-0.5 block text-xs leading-5 text-neutral-500">{description}</span> : <span className="mt-0.5 block truncate text-xs text-neutral-500">{summary}</span>}</span>
      <svg className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && <div id={id} className="border-t border-neutral-100 px-4 py-4">{children}</div>}
  </section>;
}

export default function PortalBookingDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { brandName, brandLogo } = useBrand();
  const { jamaah, isLoading: authLoading } = usePortalAuth();
  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (!authLoading && !jamaah) router.replace('/portal/login'); }, [authLoading, jamaah, router]);
  useEffect(() => {
    if (!jamaah || !id) return;
    Promise.all([getMyBooking(id), listMyPayments(id).catch(() => [])])
      .then(([bookingData, paymentData]) => { setBooking(bookingData); setPayments(paymentData || []); })
      .catch((err) => setError(err.message || 'Booking tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [jamaah, id]);

  if (authLoading || loading) return <div className="flex min-h-[70vh] items-center justify-center text-sm text-neutral-500">Memuat detail booking...</div>;
  if (error || !booking) return <div className="flex min-h-[70vh] items-center justify-center px-4"><div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 text-center"><h2 className="font-bold text-neutral-900">Booking Tidak Ditemukan</h2><p className="mt-1 text-xs text-neutral-500">{error || 'Data ini tidak tersedia untuk akun Anda.'}</p><Link href="/portal" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white">Kembali ke Beranda</Link></div></div>;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const logoUrl = brandLogo?.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;
  const confirmedPayments = payments.filter((item) => item.status === 'confirmed');
  const paid = confirmedPayments.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
  const remaining = Math.max(0, Number(booking.total_harga || 0) - paid);
  const completedProgress = progressItems.filter(([key]) => Boolean(booking[key])).length;
  const equipmentGiven = booking.perlengkapan_status === 'sudah_diberikan';

  return <div className="min-h-dvh">
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4"><Link href="/portal/pembayaran" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" /></svg>Kembali</Link>{logoUrl ? <img src={logoUrl} alt={brandName} className="max-h-8 max-w-[130px] object-contain" /> : <span className="text-xs font-bold text-neutral-800">{brandName}</span>}</div>
    </header>

    <main className="space-y-3 px-4 py-4">
      <div className="rounded-2xl bg-neutral-900 p-4 text-white"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Invoice #INV-{String(booking.id).padStart(5, '0')}</p><h1 className="mt-1 truncate text-lg font-bold">{booking.jadwal_nama}</h1><p className="mt-1 text-xs text-neutral-300">{tanggal(booking.berangkat_tanggal)}</p></div><Badge variant={booking.status === 'lunas' ? 'success' : 'warning'}>{booking.status.toUpperCase()}</Badge></div></div>

      <CollapsibleSection title="Informasi Booking" description="Informasi paket, kamar, dan jamaah terdaftar." summary={`${tanggal(booking.berangkat_tanggal)} · Kamar ${booking.room_type}`}>
        <dl className="grid gap-3"><div className="rounded-xl bg-neutral-50 p-3"><dt className="text-xs text-neutral-400">Tanggal berangkat</dt><dd className="mt-1 text-sm font-bold text-neutral-800">{tanggal(booking.berangkat_tanggal)}</dd></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-neutral-50 p-3"><dt className="text-xs text-neutral-400">Tipe kamar</dt><dd className="mt-1 text-sm font-bold text-neutral-800">Kamar {booking.room_type}</dd></div><div className="rounded-xl bg-neutral-50 p-3"><dt className="text-xs text-neutral-400">Jamaah</dt><dd className="mt-1 truncate text-sm font-bold text-neutral-800">{booking.nama_jamaah}</dd></div></div></dl>
      </CollapsibleSection>

      <CollapsibleSection title="Progress Kesiapan" description="Status dokumen dan fasilitas keberangkatan." summary={`${completedProgress} dari ${progressItems.length} tahapan selesai`} defaultOpen>
        <div className="mb-4"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-neutral-600">Kelengkapan</span><span className="font-bold text-brand">{completedProgress}/{progressItems.length}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-brand" style={{ width: `${(completedProgress / progressItems.length) * 100}%` }} /></div></div>
        <div className="space-y-2">{progressItems.map(([key, label]) => { const ready = Boolean(booking[key]); return <div key={key} className={`flex items-center justify-between rounded-xl border px-3 py-3 ${ready ? 'border-success-200 bg-success-50' : 'border-neutral-200 bg-neutral-50'}`}><span className={`text-xs font-semibold ${ready ? 'text-success-800' : 'text-neutral-600'}`}>{label}</span><span className={`text-sm font-bold ${ready ? 'text-success-700' : 'text-neutral-400'}`}>{ready ? '✓' : '—'}</span></div>; })}</div>
      </CollapsibleSection>

      <CollapsibleSection title="Perlengkapan" description="Status penyerahan perlengkapan ibadah." summary={equipmentGiven ? `Sudah diberikan${booking.perlengkapan_tanggal ? ` · ${tanggal(booking.perlengkapan_tanggal)}` : ''}` : 'Belum diberikan'}>
        <div className={`rounded-xl border p-4 ${equipmentGiven ? 'border-success-200 bg-success-50' : 'border-neutral-200 bg-neutral-50'}`}><p className={`text-sm font-bold ${equipmentGiven ? 'text-success-800' : 'text-neutral-700'}`}>{equipmentGiven ? '✓ Perlengkapan sudah diberikan' : 'Perlengkapan belum diberikan'}</p>{equipmentGiven && booking.perlengkapan_tanggal && <p className="mt-1 text-xs text-success-700">Diterima pada {tanggal(booking.perlengkapan_tanggal)}</p>}</div>
      </CollapsibleSection>

      <CollapsibleSection title="Rincian Biaya" description="Harga paket, add-on, diskon, dan total invoice." summary={`Total ${rupiah(booking.total_harga)}`}>
        <div className="space-y-3 text-xs"><div className="flex justify-between gap-3 border-b border-neutral-100 pb-3"><span className="text-neutral-600">Harga paket ({booking.room_type})</span><span className="font-bold text-neutral-900">{rupiah(booking.harga_dasar)}</span></div>{booking.addons?.map((addon) => <div key={addon.id} className="flex justify-between gap-3"><span className="text-neutral-600">{addon.nama || addon.name}</span><span className="font-semibold text-neutral-900">{rupiah(addon.nominal)}</span></div>)}{Number(booking.diskon) > 0 && <div className="flex justify-between gap-3 text-danger-700"><span>Diskon {booking.diskon_keterangan ? `(${booking.diskon_keterangan})` : ''}</span><span className="font-bold">− {rupiah(booking.diskon)}</span></div>}<div className="flex justify-between gap-3 border-t border-neutral-200 pt-3 text-sm"><span className="font-bold text-neutral-900">Total tagihan</span><span className="font-extrabold text-neutral-900">{rupiah(booking.total_harga)}</span></div></div>
      </CollapsibleSection>

      <CollapsibleSection title="Riwayat Pembayaran" description="Transaksi pembayaran dan status konfirmasi." summary={`${payments.length} transaksi · Terbayar ${rupiah(paid)}`}>
        {payments.length === 0 ? <div className="rounded-xl bg-neutral-50 py-6 text-center text-xs text-neutral-500">Belum ada pembayaran tercatat.</div> : <div className="space-y-2">{payments.map((payment) => <div key={payment.id} className="rounded-xl border border-neutral-200 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-neutral-900">{rupiah(payment.jumlah)}</p><p className="mt-1 text-xs text-neutral-500">{tanggal(payment.tanggal)} · {payment.metode || 'Metode tidak tercatat'}</p></div><Badge variant={payment.status === 'confirmed' ? 'success' : 'warning'}>{payment.status.toUpperCase()}</Badge></div></div>)}</div>}
        <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl border border-success-200 bg-success-50 p-3"><p className="text-[11px] text-success-700">Total terbayar</p><p className="mt-1 text-sm font-bold text-success-800">{rupiah(paid)}</p></div><div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"><p className="text-[11px] text-neutral-500">Sisa tagihan</p><p className="mt-1 text-sm font-bold text-neutral-900">{rupiah(remaining)}</p></div></div>
      </CollapsibleSection>
    </main>
  </div>;
}
