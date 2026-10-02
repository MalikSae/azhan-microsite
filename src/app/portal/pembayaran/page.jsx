'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { useBrand } from '@/context/BrandContext';
import { listMyBookings, listMyPayments, listPaymentAccounts, uploadPortalMedia, submitPaymentConfirmation, getInvoiceLink } from '@/lib/portalApi';
import { chooseBooking, localTransferDate, paymentFileError } from '@/lib/portalPolicy.mjs';
import { formatRupiah, formatTanggalIndo } from '@/lib/portalFormat';
import PortalDialog from '@/components/ui/PortalDialog';
import BankAccountList from '@/components/portal/BankAccountList';
const inputClass = 'w-full h-11 rounded-xl border border-neutral-300 px-3 text-sm focus:ring-2 focus:ring-brand';
const buttonClass = 'min-h-11 px-4 py-2 rounded-xl border border-neutral-300 text-sm font-semibold disabled:opacity-50';

export default function PortalPembayaranPage() {
  return <Suspense fallback={<p className="p-4">Memuat pembayaran...</p>}><PaymentContent /></Suspense>;
}
function PaymentContent() {
  const { jamaah, isLoading } = usePortalAuth();
  const { brandWhatsapp } = useBrand();
  const router = useRouter();
  const search = useSearchParams();
  const requestedID = search.get('booking');
  const [bookings, setBookings] = useState([]);
  const [selectedID, setSelectedID] = useState('');
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ bank: '', amount: '', sender: '', senderBank: '', date: localTransferDate() });
  const [file, setFile] = useState(null);
  const errorRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  const selected = bookings.find(b => String(b.id) === String(selectedID));
  useEffect(() => { if (!isLoading && !jamaah) router.replace('/portal/login'); }, [isLoading, jamaah, router]);
  useEffect(() => {
    if (!jamaah) return;
    let live = true;
    setLoading(true); setError('');
    Promise.all([listMyBookings(), listPaymentAccounts()]).then(async ([items, bankItems]) => {
      const chosen = chooseBooking(items, requestedID || selectedID);
      if (!chosen && requestedID) throw new Error('Booking tidak tersedia untuk akun Anda.');
      const history = chosen ? await listMyPayments(chosen.id) : [];
      if (live) { setBookings(items); setAccounts(bankItems); setSelectedID(chosen ? String(chosen.id) : ''); setPayments(history); }
    }).catch(e => { if (live) setError(e.message || 'Gagal memuat pembayaran.'); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [jamaah, requestedID, selectedID, attempt]);
  useEffect(() => { if (formError) errorRef.current?.focus(); }, [formError]);
  const paid = payments.filter(p => p.status === 'confirmed').reduce((n, p) => n + Number(p.jumlah), 0);
  const pending = payments.filter(p => p.status === 'pending').reduce((n, p) => n + Number(p.jumlah), 0);
  const total = Number(selected?.total_harga || 0);
  const remaining = Math.max(0, total - paid);
  const payable = !!selected?.can_submit_payment && remaining > 0;
  const wa = (brandWhatsapp || '').replace(/[^0-9]/g, '').replace(/^0/, '62');
  function begin() {
    setForm({ bank: String(accounts[0]?.id || ''), amount: String(remaining), sender: jamaah.nama_lengkap || '', senderBank: '', date: localTransferDate() });
    setFile(null); setFormError(''); setSuccess(false); setOpen(true);
  }
  function pickFile(event) {
    const next = event.target.files?.[0];
    setFile(null);
    const invalid = paymentFileError(next);
    if (invalid) { event.target.value = ''; setFormError(invalid); return; }
    setFile(next); setFormError('');
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!payable) { setFormError('Booking tidak dapat dibayar. Muat ulang untuk memeriksa status.'); return; }
    const invalid = paymentFileError(file);
    if (invalid) { setFormError(invalid); return; }
    const amount = Number(form.amount);
    if (!(amount > 0) || amount > remaining) { setFormError('Nominal harus lebih dari nol dan tidak melebihi sisa tagihan.'); return; }
    if (!form.bank || !form.sender.trim() || !form.date || form.date > localTransferDate()) { setFormError('Lengkapi rekening, nama pengirim, dan tanggal transfer yang valid.'); return; }
    setBusy(true); setFormError('');
    try {
      const fresh = await listMyBookings();
      const current = fresh.find(b => b.id === selected.id);
      if (!current?.can_submit_payment) throw new Error('Reservasi tidak lagi dapat dibayar. Hubungi petugas travel.');
      const url = await uploadPortalMedia(file);
      await submitPaymentConfirmation(selected.id, { bank_account_id: Number(form.bank), jumlah: amount, sender_name: form.sender.trim(), sender_bank: form.senderBank.trim() || undefined, tanggal: form.date, metode: 'transfer', bukti_url: url });
      setSuccess(true); setAttempt(n => n + 1);
    } catch (e) { setFormError(e.message || 'Bukti belum dapat dikirim. Coba lagi.'); }
    finally { setBusy(false); }
  }
  if (isLoading || !jamaah) return <p className="p-4">Memuat akun...</p>;
  return <div className="p-4 space-y-5">
    <Link href="/portal" className="text-sm underline">Kembali ke beranda</Link>
    <h1 className="text-xl sm:text-2xl font-bold">Pembayaran</h1>
    {error ? <div role="alert" className="p-4 border rounded-xl space-y-3"><p>{error}</p><button className={buttonClass} onClick={() => setAttempt(n => n + 1)}>Coba lagi</button></div>
    : loading ? <p role="status">Memuat tagihan dan transaksi...</p>
    : !selected ? <p>Belum ada booking. <Link href="/paket" className="underline">Lihat paket</Link></p>
    : <>
      <label className="block text-sm font-semibold" htmlFor="payment-booking">Pilih booking</label>
      <select id="payment-booking" className={inputClass} value={selectedID} disabled={busy} onChange={e => { setSelectedID(e.target.value); router.replace('/portal/pembayaran?booking=' + e.target.value); }}>
        {bookings.map(b => <option key={b.id} value={b.id}>{b.id_booking} — {b.jadwal_nama} ({b.status})</option>)}
      </select>
      <section className="border rounded-2xl p-4 space-y-3">
        <h2 className="text-base font-bold">{selected.jadwal_nama}</h2>
        <p className="text-sm">Status booking: {selected.status}</p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt>Total tagihan</dt><dd>{formatRupiah(total)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Terverifikasi</dt><dd>{formatRupiah(paid)}</dd></div>
          <div className="flex justify-between gap-3 font-bold"><dt>Sisa tagihan</dt><dd>{formatRupiah(remaining)}</dd></div>
        </dl>
        {selected.due_at ? <p className="text-sm">Batas pelunasan: {new Date(selected.due_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB. {selected.full_payment ? 'Pembayaran penuh diperlukan.' : 'DP mengikuti ketentuan invoice.'}</p> : <p className="text-sm">Batas pelunasan belum tersedia. Hubungi petugas travel.</p>}
        {pending > 0 && <p className="text-sm">Menunggu verifikasi: {formatRupiah(pending)}. Jangan transfer ulang untuk bukti yang sama.</p>}
        {!selected.reservation_payable && remaining > 0 && <p role="status" className="p-3 border rounded-xl text-sm">Reservasi tidak dapat menerima pembayaran saat ini. Hubungi petugas sebelum melakukan transfer.</p>}
        {!selected.can_submit_payment && selected.reservation_payable && <p className="text-sm">Konfirmasi pembayaran dilakukan oleh PIC booking. Akun Anda memiliki akses baca.</p>}
        {payable && <><h3 className="font-semibold text-sm">Rekening resmi</h3><BankAccountList accounts={accounts} /><button type="button" className={buttonClass} onClick={begin} disabled={!accounts.length}>Konfirmasi transfer</button></>}
        {selected.can_view_invoice && <button type="button" className={buttonClass} onClick={async () => { try { window.location.assign(await getInvoiceLink(selected.id)); } catch (e) { setError(e.message); } }}>Buka invoice</button>}
        {wa && <a className="block text-sm underline" href={'https://wa.me/' + wa} target="_blank" rel="noopener noreferrer">Hubungi petugas travel</a>}
      </section>
      <section className="space-y-3"><h2 className="text-lg font-bold">Riwayat pembayaran</h2>
        {!payments.length && <p className="text-sm">Belum ada transaksi pembayaran.</p>}
        {payments.map(p => <article key={p.id} className="border rounded-xl p-3 text-sm space-y-1"><p className="font-semibold">{formatRupiah(p.jumlah)} — {p.status === 'confirmed' ? 'Terverifikasi' : p.status === 'pending' ? 'Menunggu verifikasi' : 'Ditolak'}</p><p>{formatTanggalIndo(p.tanggal || p.created_at)} · {p.sender_name || 'Pembayaran'}</p>{p.rejection_reason && <p>Alasan: {p.rejection_reason}</p>}</article>)}
      </section>
    </>}
    <PortalDialog open={open} onClose={close} busy={busy} title="Konfirmasi pembayaran">
      {success ? <div role="status" className="space-y-3"><p>Bukti terkirim dan menunggu verifikasi petugas. Pengiriman bukti belum berarti pembayaran terverifikasi.</p><button className={buttonClass} onClick={close}>Selesai</button></div>
      : <form onSubmit={submit} className="space-y-4">
        {formError && <p ref={errorRef} tabIndex={-1} id="payment-error" role="alert" className="p-3 border rounded-xl">{formError}</p>}
        <div><label htmlFor="payment-bank" className="text-sm font-semibold">Rekening tujuan</label><select required id="payment-bank" className={inputClass} value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })}><option value="">Pilih rekening</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} — {a.account_number}</option>)}</select></div>
        <div><label htmlFor="payment-amount" className="text-sm font-semibold">Nominal transfer (rupiah)</label><input required id="payment-amount" type="number" min="1" max={remaining} step="1" className={inputClass} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
        <div><label htmlFor="payment-sender" className="text-sm font-semibold">Nama pengirim</label><input required id="payment-sender" maxLength={150} className={inputClass} value={form.sender} onChange={e => setForm({ ...form, sender: e.target.value })} /></div>
        <div><label htmlFor="payment-sender-bank" className="text-sm font-semibold">Bank pengirim (opsional)</label><input id="payment-sender-bank" maxLength={100} className={inputClass} value={form.senderBank} onChange={e => setForm({ ...form, senderBank: e.target.value })} /></div>
        <div><label htmlFor="payment-date" className="text-sm font-semibold">Tanggal transfer</label><input required id="payment-date" type="date" max={localTransferDate()} className={inputClass} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div><label htmlFor="payment-file" className="text-sm font-semibold">Bukti transfer, maksimal 5 MB</label><input required id="payment-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" className={inputClass} onChange={pickFile} aria-describedby={formError ? 'payment-error' : undefined} />{file && <p className="text-sm break-all">{file.name}</p>}</div>
        <button type="submit" className={buttonClass} disabled={busy || !file || !payable}>{busy ? 'Mengirim...' : 'Kirim bukti'}</button>
      </form>}
    </PortalDialog>
  </div>;
}
