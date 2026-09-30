'use client';
import { useEffect, useState } from 'react';
import { getCashback } from '@/lib/portalApi';
import { formatRupiah, formatTanggalIndo } from '@/lib/portalFormat';
import { useBrand } from '@/context/BrandContext';
export default function CashbackPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const { brandWhatsapp } = useBrand();
  useEffect(() => { let live = true; setError(''); getCashback().then(v => { if (live) setData(v); }).catch(e => { if (live) setError(e.message); }); return () => { live = false; }; }, [attempt]);
  const wa = (brandWhatsapp || '').replace(/[^0-9]/g, '').replace(/^0/, '62');
  return <section className="border rounded-2xl p-4 space-y-3"><h2 className="text-base sm:text-lg font-bold">Kredit cashback</h2>
    {error ? <div role="alert"><p>{error}</p><button type="button" className="min-h-11 underline" onClick={() => setAttempt(n => n + 1)}>Coba lagi</button></div> : !data ? <p role="status">Memuat kredit...</p> : <><p className="text-xl font-bold">{formatRupiah(data.balance)}</p><p className="text-sm">Kredit untuk potongan booking berikutnya di travel yang sama. Tidak dapat dicairkan. Hubungi petugas untuk penggunaannya.</p>{data.items.length ? <ul className="space-y-2">{data.items.map((item, index) => <li key={index} className="border-t pt-2 text-sm">{item.jenis === 'diterima' ? 'Diterima' : 'Dipakai'}: {formatRupiah(item.nominal)} · {formatTanggalIndo(item.created_at)}</li>)}</ul> : <p className="text-sm">Belum ada mutasi kredit.</p>}</>}
    {wa && <a href={'https://wa.me/' + wa} target="_blank" rel="noopener noreferrer" className="block underline text-sm">Hubungi petugas travel</a>}
  </section>;
}
