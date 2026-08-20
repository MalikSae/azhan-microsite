'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { listMyBookings, listMyPayments } from '@/lib/portalApi';

const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const tanggal = (value) => value ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '-';

export default function PembayaranPage() {
  const router = useRouter();
  const { jamaah, isLoading: authLoading } = usePortalAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !jamaah) router.replace('/portal/login'); }, [authLoading, jamaah, router]);
  useEffect(() => {
    if (!jamaah) return;
    listMyBookings().then(async (bookings) => Promise.all((bookings || []).map(async (booking) => {
      const payments = await listMyPayments(booking.id).catch(() => []);
      const paid = payments.filter((payment) => payment.status === 'confirmed').reduce((sum, payment) => sum + Number(payment.jumlah || 0), 0);
      return { booking, payments, paid, remaining: Math.max(0, Number(booking.total_harga || 0) - paid) };
    }))).then(setRows).finally(() => setLoading(false));
  }, [jamaah]);

  if (authLoading || !jamaah) return <div className="flex min-h-[70vh] items-center justify-center text-sm text-neutral-500">Memuat pembayaran...</div>;
  const totalPaid = rows.reduce((sum, row) => sum + row.paid, 0);
  const totalRemaining = rows.reduce((sum, row) => sum + row.remaining, 0);

  return <main className="space-y-4 px-4 py-5">
    <section className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-neutral-900 p-4 text-white"><p className="text-xs text-neutral-300">Sudah dibayar</p><p className="mt-2 text-base font-bold">{rupiah(totalPaid)}</p></div><div className="rounded-2xl border border-neutral-200 bg-white p-4"><p className="text-xs text-neutral-500">Sisa tagihan</p><p className="mt-2 text-base font-bold text-neutral-900">{rupiah(totalRemaining)}</p></div></section>
    <section className="space-y-3"><div><h2 className="font-bold text-neutral-900">Pembayaran per Booking</h2><p className="text-xs text-neutral-500">Riwayat dan posisi tagihan perjalanan.</p></div>{loading ? <div className="h-32 animate-pulse rounded-2xl bg-neutral-100" /> : rows.length === 0 ? <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">Belum ada transaksi pembayaran.</div> : rows.map(({ booking, payments, paid, remaining }) => <Link href={`/portal/booking/${booking.id}`} key={booking.id} className="block rounded-2xl border border-neutral-200 bg-white p-4 focus:outline-none focus:ring-2 focus:ring-brand"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-bold text-neutral-900">{booking.jadwal_nama}</h3><p className="mt-1 text-xs text-neutral-500">{payments.length} transaksi · {tanggal(booking.berangkat_tanggal)}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${remaining === 0 ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'}`}>{remaining === 0 ? 'Lunas' : 'Berjalan'}</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3"><div><p className="text-[11px] text-neutral-400">Terbayar</p><p className="mt-1 text-sm font-bold text-success-700">{rupiah(paid)}</p></div><div><p className="text-[11px] text-neutral-400">Sisa</p><p className="mt-1 text-sm font-bold text-neutral-900">{rupiah(remaining)}</p></div></div></Link>)}</section>
  </main>;
}
