'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { listMyBookings } from '@/lib/portalApi';
import ProgressTimeline from '@/components/ProgressTimeline';

const formatTanggal = (value) => value ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '-';
const formatRupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);

const nearestBooking = (bookings) => {
  const active = bookings.filter((item) => item.status !== 'batal');
  const today = new Date().setHours(0, 0, 0, 0);
  return active.sort((a, b) => {
    const aTime = new Date(a.berangkat_tanggal).getTime();
    const bTime = new Date(b.berangkat_tanggal).getTime();
    const aFuture = aTime >= today;
    const bFuture = bTime >= today;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    return aFuture ? aTime - bTime : bTime - aTime;
  })[0] || null;
};

export default function PortalHomePage() {
  const router = useRouter();
  const { brandName } = useBrand();
  const { jamaah, isLoading: authLoading } = usePortalAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !jamaah) router.replace('/portal/login');
  }, [authLoading, jamaah, router]);

  useEffect(() => {
    if (!jamaah) return;
    listMyBookings().then((value) => setBookings(value || [])).catch(() => setBookings([])).finally(() => setLoading(false));
  }, [jamaah]);

  if (authLoading || !jamaah) return <div className="flex min-h-[70vh] items-center justify-center text-sm text-neutral-500">Memuat portal...</div>;
  const current = nearestBooking(bookings);

  return (
    <main className="portal-page space-y-5">
      <section className="overflow-hidden rounded-2xl bg-neutral-900 p-5 text-white">
        <p className="text-xs text-neutral-300">Selamat datang di {brandName}</p>
        <h2 className="mt-1 text-xl font-bold">Halo, {jamaah.nama_lengkap}</h2>
        <div className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">ID Jamaah: {jamaah.id_jamaah || `#${jamaah.id}`}</div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.72fr)]">
      {current && <ProgressTimeline booking={current} />}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-end justify-between">
          <div><h2 className="font-bold text-neutral-900">Booking Saya</h2><p className="text-xs text-neutral-500">Jadwal perjalanan yang terdaftar</p></div>
          <span className="text-xs font-semibold text-neutral-500">{bookings.length} booking</span>
        </div>
        {loading ? <div className="h-24 animate-pulse rounded-xl bg-neutral-100" /> : bookings.length === 0 ? (
          <div className="rounded-xl bg-neutral-50 px-4 py-8 text-center"><p className="text-sm font-semibold text-neutral-700">Belum ada booking</p><p className="mt-1 text-xs text-neutral-500">Hubungi customer service untuk mendaftar paket.</p></div>
        ) : <div className="space-y-3">{bookings.map((booking) => (
          <Link key={booking.id} href={`/portal/booking/${booking.id}`} className="block rounded-xl border border-neutral-200 p-4 transition-colors hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold text-neutral-900">{booking.jadwal_nama}</p><p className="mt-1 text-xs text-neutral-500">{formatTanggal(booking.berangkat_tanggal)} · Kamar {booking.room_type}</p></div><span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold uppercase text-neutral-600">{booking.status}</span></div>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3"><span className="text-xs text-neutral-500">Total biaya</span><span className="text-sm font-bold text-neutral-900">{formatRupiah(booking.total_harga)}</span></div>
          </Link>
        ))}</div>}
      </section></div>
    </main>
  );
}
