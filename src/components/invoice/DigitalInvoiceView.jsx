'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mediaUrl } from '@/lib/mediaUrl';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

// Tanggal tanpa jam ("2026-10-20") dibaca apa adanya agar tidak bergeser zona waktu.
const formatDate = (value) => {
  if (!value) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  return `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}`;
};

// Waktu RFC3339 ditampilkan dalam WIB, terlepas dari zona waktu perangkat.
const formatWaktuWIB = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map((x) => [x.type, x.value])
  );
  return `${Number(p.day)} ${BULAN[Number(p.month) - 1]} ${p.year}, ${p.hour}:${p.minute} WIB`;
};

const pad = (n) => String(n).padStart(2, '0');

// Bagian datar dipisah garis tipis; tanpa kartu agar halaman tidak penuh kontainer.
function Section({ title, first = false, children }) {
  return (
    <section className={`py-5 space-y-3 ${first ? '' : 'border-t border-neutral-100'}`}>
      {title && <h2 className="text-sm font-bold text-neutral-900">{title}</h2>}
      {children}
    </section>
  );
}

const IconWhatsapp = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 01-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 01-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 012.76 6.67c0 5.2-4.24 9.43-9.44 9.43zm8.03-17.46A11.32 11.32 0 0012.05.7C5.79.7.7 5.79.7 12.04c0 2 .52 3.95 1.52 5.67L.6 23.3l5.72-1.5a11.3 11.3 0 005.42 1.38h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.32-8.02z" /></svg>
);

// Dokumen invoice formal untuk cetak / simpan PDF. Hanya tampil saat print;
// tata letak mengikuti invoice umum: kop, info tagihan, tabel item, total,
// lalu info pembayaran. Tanpa countdown, tombol, atau kotak berwarna.
function PrintableInvoice({ invoice, brand, fin, ppiu, waNumber, brandLogoUrl, statusLabel, jatuhTempo, batasTahan, bankAccounts }) {
  const s = invoice.schedule || {};
  const items = invoice.pax_items || [];
  const subtotal = items.filter((p) => p.status === 'aktif').reduce((sum, p) => sum + (p.harga || 0), 0);
  const belumBayar = !['dp', 'lunas'].includes(invoice.status);
  const rows = [
    ['No. Invoice', `#${invoice.booking_code}`],
    ['Tanggal', formatDate(invoice.created_at)],
    belumBayar && batasTahan && [fin.full_payment ? 'Batas pembayaran' : 'Batas pembayaran DP', batasTahan],
    jatuhTempo && !fin.full_payment && ['Jatuh tempo pelunasan', jatuhTempo],
    ['Status', statusLabel],
  ].filter(Boolean);

  return (
    <div className="hidden print:block text-xs text-neutral-900 leading-relaxed">
      {/* Kop */}
      <div className="flex items-start justify-between gap-8 pb-5 border-b-2 border-neutral-900">
        <div className="space-y-1">
          {/* Logo sudah memuat nama perusahaan; teks nama hanya bila tanpa logo. */}
          {brandLogoUrl ? <img src={brandLogoUrl} alt={brand.name} className="h-12 w-auto" /> : <p className="text-lg font-bold">{brand.pt_name || brand.name}</p>}
          {(brand.alamat || brand.city) && <p className="max-w-xs text-neutral-600">{brand.alamat || brand.city}</p>}
          <p className="text-neutral-600">
            {[waNumber && `WhatsApp +${waNumber}`, ppiu && `PPIU ${ppiu}`, brand.pihk_number && `PIHK ${brand.pihk_number.replace(/^No\.?\s*/i, '')}`].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-wide">INVOICE</p>
          <table className="mt-2 ml-auto">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td className="pr-3 text-left text-neutral-500">{k}</td>
                  <td className="text-right font-semibold">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ditagihkan kepada & paket */}
      <div className="grid grid-cols-2 gap-8 py-5">
        <div>
          <p className="text-neutral-500 uppercase tracking-wide font-semibold mb-1">Ditagihkan kepada</p>
          <p className="text-sm font-bold">{invoice.pic?.nama_lengkap}</p>
          <p>WhatsApp {invoice.pic?.no_hp_masked || '-'}</p>
        </div>
        <div>
          <p className="text-neutral-500 uppercase tracking-wide font-semibold mb-1">Paket</p>
          <p className="text-sm font-bold">{s.jadwal_nama}</p>
          <p>{formatDate(s.berangkat_tanggal)} – {formatDate(s.pulang_tanggal)}{s.maskapai?.name && ` · ${s.maskapai.name}`}</p>
          {(s.hotel_mekkah || s.hotel_madinah) && (
            <p>{[s.hotel_mekkah && `Mekkah: ${s.hotel_mekkah}`, s.hotel_madinah && `Madinah: ${s.hotel_madinah}`].filter(Boolean).join(' · ')}</p>
          )}
        </div>
      </div>

      {/* Item */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-neutral-100 text-left">
            <th className="py-2 px-2 w-10 font-semibold">No</th>
            <th className="py-2 px-2 font-semibold">Nama Jamaah</th>
            <th className="py-2 px-2 font-semibold">Tipe Kamar</th>
            <th className="py-2 px-2 font-semibold text-right">Harga</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-neutral-200">
              <td className="py-2 px-2">{idx + 1}</td>
              <td className="py-2 px-2">
                {item.nama_lengkap}
                {item.status !== 'aktif' && <span className="text-neutral-500"> (dibatalkan)</span>}
              </td>
              <td className="py-2 px-2">{item.pax_type === 'infant' ? 'Infant' : item.room_type || 'Quad'}</td>
              <td className={`py-2 px-2 text-right tabular-nums ${item.status !== 'aktif' ? 'line-through text-neutral-400' : ''}`}>{formatRp(item.harga)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="flex justify-end pt-3">
        <table className="w-64">
          <tbody className="tabular-nums">
            {fin.adjustments !== 0 && (
              <>
                <tr><td className="py-1 text-neutral-600">Subtotal</td><td className="py-1 text-right">{formatRp(subtotal)}</td></tr>
                <tr><td className="py-1 text-neutral-600">Penyesuaian / diskon</td><td className="py-1 text-right">{formatRp(fin.adjustments)}</td></tr>
              </>
            )}
            <tr className={fin.adjustments !== 0 ? 'border-t border-neutral-300' : ''}><td className="py-1 font-semibold">Total</td><td className="py-1 text-right font-semibold">{formatRp(fin.total_harga)}</td></tr>
            <tr><td className="py-1 text-neutral-600">Sudah dibayar</td><td className="py-1 text-right">{formatRp(fin.total_dibayar)}</td></tr>
            <tr className="border-t-2 border-neutral-900"><td className="py-1.5 text-sm font-bold">Sisa tagihan</td><td className="py-1.5 text-right text-sm font-bold">{formatRp(fin.sisa_tagihan)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Info pembayaran */}
      <div className="grid grid-cols-2 gap-8 pt-6 mt-6 border-t border-neutral-200">
        <div>
          <p className="text-neutral-500 uppercase tracking-wide font-semibold mb-1">Pembayaran ke</p>
          {bankAccounts.length > 0 ? (
            <table>
              <tbody>
                {bankAccounts.map((acc, i) => (
                  <tr key={acc.id || i}>
                    <td className="pr-3 font-semibold">{acc.bank_name}</td>
                    <td className="pr-3 tabular-nums">{acc.account_number}</td>
                    <td className="text-neutral-600">a.n. {acc.account_holder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Hubungi admin {brand.name}{waNumber && ` (WhatsApp +${waNumber})`} untuk nomor rekening resmi.</p>
          )}
        </div>
        <div>
          <p className="text-neutral-500 uppercase tracking-wide font-semibold mb-1">Ketentuan</p>
          <p>
            {fin.full_payment
              ? 'Keberangkatan kurang dari 45 hari: pembayaran penuh diperlukan sebelum batas pembayaran.'
              : `DP minimal ${formatRp(fin.minimal_dp)} untuk mengamankan seat; sisa tagihan dilunasi paling lambat ${jatuhTempo}.`}
            {' '}Cantumkan nomor invoice pada keterangan transfer.
          </p>
        </div>
      </div>

      <p className="pt-8 text-neutral-500">
        Invoice ini diterbitkan secara elektronik oleh {brand.pt_name || brand.name} dan sah tanpa tanda tangan.
      </p>
    </div>
  );
}

export default function DigitalInvoiceView({ invoice }) {
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState(null);
  const [sisaWaktu, setSisaWaktu] = useState(null);

  const brand = invoice.brand || {};
  const fin = invoice.financial || {};
  const brandColor = brand.primary_color || '#990000';
  const brandLogoUrl = brand.logo_url ? mediaUrl(brand.logo_url) : null;
  const ppiu = brand.ppiu_number ? brand.ppiu_number.replace(/^No\.?\s*/i, '') : '';
  const waNumber = (brand.whatsapp_number || '').replace(/\D/g, '');

  // Hitung mundur masa tahan seat.
  useEffect(() => {
    if (!invoice.seat_hold_expires_at || invoice.reservation_status !== 'held') return undefined;
    const target = new Date(invoice.seat_hold_expires_at).getTime();
    const tick = () => setSisaWaktu(Math.max(0, target - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [invoice.seat_hold_expires_at, invoice.reservation_status]);

  const holdExpired = invoice.reservation_status === 'held' && sisaWaktu === 0;
  const canPay = !['expired', 'cancelled'].includes(invoice.reservation_status) && !holdExpired;
  const showCountdown = invoice.reservation_status === 'held' && canPay && sisaWaktu !== null;
  const lunas = invoice.status === 'lunas';
  const dpMasuk = invoice.status === 'dp';

  // Nominal yang perlu dibayar sekarang, sesuai tahap booking.
  const kurangDP = Math.max(0, (fin.minimal_dp || 0) - (fin.total_dibayar || 0));
  let labelTagihan = 'Sisa tagihan';
  let nominalTagihan = fin.sisa_tagihan || 0;
  if (!lunas && !dpMasuk) {
    if (fin.full_payment) {
      labelTagihan = 'Bayar penuh';
    } else if (kurangDP > 0) {
      labelTagihan = 'Bayar DP minimal';
      nominalTagihan = kurangDP;
    }
  }
  const jatuhTempo = formatWaktuWIB(fin.jatuh_tempo_at) || fin.jatuh_tempo_pelunasan;
  const batasTahan = formatWaktuWIB(invoice.seat_hold_expires_at);

  const statusLabel = holdExpired ? 'Batas Pembayaran Berakhir' : invoice.status_label;
  const statusTone = lunas || dpMasuk
    ? 'bg-emerald-50 text-emerald-700'
    : !canPay ? 'bg-neutral-100 text-neutral-600' : 'bg-amber-50 text-amber-800';

  const waText = (pesan) => `https://wa.me/${waNumber}?text=${encodeURIComponent(pesan)}`;
  const waKonfirmasi = waText(`Assalamu'alaikum, saya ${invoice.pic?.nama_lengkap || ''} ingin konfirmasi pembayaran invoice #${invoice.booking_code}.`);
  const waRekening = waText(`Assalamu'alaikum, saya ${invoice.pic?.nama_lengkap || ''} ingin membayar invoice #${invoice.booking_code}. Mohon info nomor rekening resmi.`);
  const bankAccounts = canPay && !lunas ? invoice.bank_accounts || [] : [];

  const handleCopy = async (text, key) => {
    try { await navigator.clipboard.writeText(text); } catch { return; }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Invoice #${invoice.booking_code}`, url }); return; } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    handleCopy(url, 'url');
  };

  const sisaJam = sisaWaktu !== null ? Math.floor(sisaWaktu / 3600000) : 0;
  const countdownText = sisaWaktu !== null
    ? `${sisaJam >= 24 ? `${Math.floor(sisaJam / 24)} hari ` : ''}${pad(sisaJam % 24)}:${pad(Math.floor(sisaWaktu / 60000) % 60)}:${pad(Math.floor(sisaWaktu / 1000) % 60)}`
    : '';

  return (
    <div style={{ '--brand-primary': brandColor }}>
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-40 print:hidden">
        <div className="mx-auto max-w-xl px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={invoice.schedule?.id ? `/paket/${invoice.schedule.id}` : '/'}
              className="relative flex items-center justify-center w-8 h-8 -ml-1 rounded-full text-neutral-600 hover:bg-neutral-100 after:absolute after:-inset-1.5"
              aria-label="Kembali ke halaman paket"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-bold text-neutral-900 truncate">Invoice #{invoice.booking_code}</p>
              <p className="text-xs text-neutral-500 truncate">{brand.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer"
            >
              {copiedKey === 'url' ? (
                <span className="text-emerald-700">Link disalin</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  <span>Bagikan</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-700 hover:bg-neutral-100 cursor-pointer after:absolute after:-inset-1.5"
              aria-label="Cetak atau simpan PDF"
              title="Cetak / simpan PDF"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Versi cetak: dokumen invoice formal, terpisah dari halaman instruksi bayar */}
      <PrintableInvoice
        invoice={invoice}
        brand={brand}
        fin={fin}
        ppiu={ppiu}
        waNumber={waNumber}
        brandLogoUrl={brandLogoUrl}
        statusLabel={statusLabel}
        jatuhTempo={jatuhTempo}
        batasTahan={batasTahan}
        bankAccounts={invoice.bank_accounts || []}
      />

      <main className="mx-auto max-w-xl px-4 pt-2 pb-28 text-sm text-neutral-700 print:hidden">

        {!canPay && (
          <div role="alert" className="mt-3 flex items-start gap-2.5 rounded-xl bg-red-50 px-3 py-2.5 text-red-800">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            <p>Reservasi {invoice.reservation_status === 'cancelled' ? 'dibatalkan' : 'kedaluwarsa'}. Jangan transfer sebelum admin memastikan ketersediaan seat.</p>
          </div>
        )}
        {invoice.portal_activation_required && (
          <div role="note" className="mt-3 rounded-xl bg-blue-50 px-3 py-2.5 text-blue-900">
            Akun Portal Jamaah belum aktif. Hubungi admin untuk link aktivasi; bukti transfer bisa dikirim langsung ke admin.
          </div>
        )}

        {/* Ringkasan tagihan */}
        <Section first>
          <div className="flex items-center justify-between gap-3">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${statusTone}`}>{statusLabel}</span>
            <span className="text-xs text-neutral-500 text-right">Dibuat {formatDate(invoice.created_at)}</span>
          </div>

          {lunas ? (
            <div>
              <p className="text-xs text-neutral-500">Total dibayar</p>
              <p className="text-2xl font-bold text-neutral-900 font-mono">{formatRp(fin.total_dibayar)}</p>
              <p className="text-sm text-emerald-700 mt-1">Tagihan sudah lunas. Terima kasih.</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-neutral-500">{labelTagihan}</p>
              <p className="text-2xl font-bold text-neutral-900 font-mono">{formatRp(nominalTagihan)}</p>
              {showCountdown ? (
                <p className="text-sm mt-1">
                  Bayar sebelum <strong className="text-neutral-900">{batasTahan}</strong>
                  <span className="block text-xs text-neutral-500">
                    Sisa waktu <span className="font-mono font-semibold text-red-600">{countdownText}</span> · seat ditahan sampai batas ini
                  </span>
                </p>
              ) : dpMasuk && jatuhTempo ? (
                <p className="text-sm mt-1">Lunasi paling lambat <strong className="text-neutral-900">{jatuhTempo}</strong></p>
              ) : null}
            </div>
          )}

          {!lunas && canPay && (
            <div role="note" className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5 text-amber-900">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p>
                {fin.full_payment
                  ? 'Keberangkatan kurang dari 45 hari, jadi pembayaran penuh diperlukan sebelum batas waktu.'
                  : dpMasuk
                    ? 'DP sudah diterima. Sisa tagihan boleh dicicil sampai batas pelunasan.'
                    : <>DP minimal {formatRp(fin.minimal_dp)} mengamankan seat Anda. Sisa tagihan dilunasi paling lambat {jatuhTempo}.</>}
              </p>
            </div>
          )}

          {fin.pending_payment > 0 && (
            <div role="status" className="flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-2.5 text-blue-900">
              <p>Pembayaran {formatRp(fin.pending_payment)} sedang diverifikasi admin.</p>
              <button type="button" onClick={() => router.refresh()} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-blue-800 hover:bg-blue-100 shrink-0 cursor-pointer print:hidden">
                Perbarui
              </button>
            </div>
          )}
        </Section>

        {/* Rekening tujuan */}
        {canPay && !lunas && (
          <Section title="Transfer ke rekening resmi">
            {bankAccounts.length > 0 ? (
              <ul className="divide-y divide-neutral-100">
                {bankAccounts.map((acc, i) => (
                  <li key={acc.id || i} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                    {acc.logo_url ? (
                      <span className="w-16 h-8 rounded-lg border border-neutral-200 p-1 flex items-center justify-center shrink-0">
                        <img src={mediaUrl(acc.logo_url)} alt={acc.bank_name} className="w-full h-full object-contain" />
                      </span>
                    ) : (
                      <span className="w-16 py-1 rounded-md bg-neutral-900 text-white text-xs font-bold text-center truncate shrink-0">{acc.bank_name}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-bold text-base text-neutral-900 tracking-wide truncate">{acc.account_number}</p>
                      <p className="text-xs text-neutral-500 truncate">a.n. {acc.account_holder}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(acc.account_number, `acc-${i}`)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 shrink-0 cursor-pointer print:hidden"
                    >
                      {copiedKey === `acc-${i}` ? <span className="text-emerald-700">Disalin</span> : 'Salin'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3">
                <p>Nomor rekening belum tercantum. Minta nomor rekening resmi langsung ke admin {brand.name}.</p>
                {waNumber && (
                  <a href={waRekening} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 print:hidden">
                    {IconWhatsapp}
                    <span>Minta nomor rekening</span>
                  </a>
                )}
              </div>
            )}
            {!invoice.portal_activation_required && (
              <p className="text-neutral-500 print:hidden">
                Sudah transfer? Kirim bukti lewat tombol di bawah, atau{' '}
                <a href="/portal/login" className="font-semibold text-neutral-800 underline underline-offset-2">upload di Portal Jamaah</a>.
              </p>
            )}
          </Section>
        )}

        {/* Rincian pesanan: paket, jamaah, dan biaya dalam satu bagian */}
        <Section title="Rincian pesanan">
          <div>
            <p className="font-semibold text-neutral-900">{invoice.schedule?.jadwal_nama}</p>
            <p className="text-neutral-500">
              {formatDate(invoice.schedule?.berangkat_tanggal)} – {formatDate(invoice.schedule?.pulang_tanggal)}
              {invoice.schedule?.maskapai?.name && ` · ${invoice.schedule.maskapai.name}`}
            </p>
          </div>

          {invoice.pax_items?.length ? (
            <ul className="space-y-2">
              {invoice.pax_items.map((item, idx) => (
                <li key={idx} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-neutral-900 truncate">
                      {idx + 1}. {item.nama_lengkap}
                      {idx === 0 && <span className="text-neutral-500"> (pemesan)</span>}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.pax_type === 'infant' ? 'Infant' : `Kamar ${item.room_type || 'Quad'}`}
                      {item.status !== 'aktif' && <span className="ml-1.5 text-amber-700 font-semibold">· Dibatalkan</span>}
                    </p>
                  </div>
                  <p className={`font-mono whitespace-nowrap ${item.status !== 'aktif' ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>{formatRp(item.harga)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500">Tidak ada rincian jamaah.</p>
          )}

          <dl className="space-y-2 pt-3 border-t border-dashed border-neutral-200">
            {fin.adjustments !== 0 && (
              <div className="flex justify-between gap-4"><dt>Penyesuaian / diskon</dt><dd className="font-mono text-neutral-900">{formatRp(fin.adjustments)}</dd></div>
            )}
            <div className="flex justify-between gap-4"><dt>Total</dt><dd className="font-mono text-neutral-900">{formatRp(fin.total_harga)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Sudah dibayar</dt><dd className="font-mono text-emerald-700">{formatRp(fin.total_dibayar)}</dd></div>
            <div className="flex justify-between gap-4 font-bold text-neutral-900"><dt>Sisa tagihan</dt><dd className="font-mono">{formatRp(fin.sisa_tagihan)}</dd></div>
          </dl>
        </Section>

        {/* Penerbit */}
        <footer className="py-5 border-t border-neutral-100 space-y-2 text-xs text-neutral-500">
          {/* Logo sudah memuat nama brand, jadi nama teks hanya untuk brand tanpa logo. */}
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt={brand.name} className="h-8 w-auto" />
          ) : (
            <p className="font-semibold text-neutral-700">{brand.pt_name || brand.name}</p>
          )}
          {(ppiu || brand.akreditasi) && (
            <p>{[ppiu && `PPIU ${ppiu}`, brand.akreditasi && `Akreditasi ${brand.akreditasi}`].filter(Boolean).join(' · ')}</p>
          )}
          {(brand.alamat || brand.city) && <p>{brand.alamat || brand.city}</p>}
          {waNumber && <p>WhatsApp +{waNumber}</p>}
          <p>Invoice digital diterbitkan otomatis oleh sistem {brand.name}.</p>
        </footer>
      </main>

      {/* Aksi utama menempel di bawah, seperti formulir booking */}
      {canPay && !lunas && waNumber && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 print:hidden">
          <div className="mx-auto max-w-xl px-4 py-3">
            <a href={waKonfirmasi} target="_blank" rel="noopener noreferrer" className="btn-brand-cta w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold">
              {IconWhatsapp}
              <span>Konfirmasi pembayaran via WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
