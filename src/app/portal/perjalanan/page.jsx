'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { listMyBookings, listMyDokumen, uploadMyDokumen, getDocumentFile } from '@/lib/portalApi';
import { chooseBooking, requirements, documentProgress, paymentFileError } from '@/lib/portalPolicy.mjs';
import PortalDialog from '@/components/ui/PortalDialog';
import ItineraryModal from '@/components/ItineraryModal';
const actionClass = 'min-h-11 px-3 py-2 rounded-xl border border-neutral-300 text-sm font-semibold disabled:opacity-50';
export default function PerjalananPage() { return <Suspense fallback={<p className="p-4">Memuat perjalanan...</p>}><PerjalananContent /></Suspense>; }
function PerjalananContent() {
  const { jamaah, isLoading } = usePortalAuth();
  const router = useRouter();
  const search = useSearchParams();
  const requestedID = search.get('booking');
  const [tab, setTab] = useState('dokumen');
  const [items, setItems] = useState([]);
  const [docs, setDocs] = useState([]);
  const [selectedID, setSelectedID] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [uploading, setUploading] = useState('');
  const [preview, setPreview] = useState(null);
  const [itinerary, setItinerary] = useState(false);
  const closePreview = useCallback(() => setPreview(null), []);
  useEffect(() => { if (!isLoading && !jamaah) router.replace('/portal/login'); }, [isLoading, jamaah, router]);
  useEffect(() => { const next = search.get('tab'); if (next === 'dokumen' || next === 'keberangkatan') setTab(next); }, [search]);
  useEffect(() => {
    if (!jamaah) return;
    let live = true; setLoading(true); setError('');
    Promise.all([listMyDokumen(), listMyBookings()]).then(([documents, bookings]) => {
      if (!live) return;
      const chosen = chooseBooking(bookings, requestedID || selectedID);
      if (!chosen && requestedID) throw new Error('Booking tidak tersedia untuk akun Anda.');
      setDocs(documents); setItems(bookings); setSelectedID(chosen ? String(chosen.id) : '');
    }).catch(e => { if (live) setError(e.message); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [jamaah, requestedID, selectedID, attempt]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const booking = items.find(item => String(item.id) === selectedID);
  const personal = booking?.personal_pax;
  const required = requirements(jamaah, booking);
  const progress = documentProgress(docs, required);
  async function upload(jenis, event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    const invalid = paymentFileError(file);
    if (invalid) { setNotice(invalid); return; }
    setUploading(jenis); setNotice('');
    try { await uploadMyDokumen(jenis, file); setNotice('Dokumen terkirim untuk verifikasi petugas.'); setAttempt(n => n + 1); }
    catch (e) { setNotice(e.message); }
    finally { setUploading(''); }
  }
  async function view(doc) {
    setNotice('');
    try { const blob = await getDocumentFile(doc.id); setPreview({ url: URL.createObjectURL(blob), type: blob.type }); }
    catch (e) { setNotice(e.message); }
  }
  const tasks = booking ? [
    ['Tiket pesawat', booking.progress_tiket],
    ['Hotel', booking.progress_hotel],
    ['Transportasi dan layanan darat', booking.progress_land_arrangement],
    ...(personal ? [['Visa Anda', personal.progress_visa], ['Pendaftaran Siskopatuh Anda', personal.progress_siskopatuh], ...(personal.pax_type === 'infant' ? [] : [['Manasik Anda', personal.progress_manasik]])] : []),
  ] : [];
  if (isLoading || !jamaah) return <p className="p-4">Memuat akun...</p>;
  return <div className="p-4 space-y-5">
    <Link href="/portal" className="underline text-sm">Kembali ke beranda</Link>
    <h1 className="text-xl sm:text-2xl font-bold">Perjalanan dan dokumen</h1>
    <div className="flex gap-2"><button className={actionClass} aria-pressed={tab === 'dokumen'} onClick={() => setTab('dokumen')}>Dokumen saya</button><button className={actionClass} aria-pressed={tab === 'keberangkatan'} onClick={() => setTab('keberangkatan')}>Keberangkatan</button></div>
    {notice && <p role="status" className="p-3 border rounded-xl text-sm">{notice}</p>}
    {error ? <div role="alert" className="space-y-3"><p>{error}</p><button className={actionClass} onClick={() => setAttempt(n => n + 1)}>Coba lagi</button></div> : loading ? <p role="status">Memuat data...</p> : <>
      {items.length > 0 && <div className="space-y-2"><label htmlFor="travel-booking" className="text-sm font-semibold">Booking perjalanan</label><select id="travel-booking" value={selectedID} onChange={e => { setSelectedID(e.target.value); router.replace('/portal/perjalanan?tab=' + tab + '&booking=' + e.target.value); }} className="w-full h-11 px-3 text-sm rounded-xl border">{items.map(item => <option key={item.id} value={item.id}>{item.id_booking} — {item.jadwal_nama} ({item.status})</option>)}</select></div>}
      {tab === 'dokumen' ? <section className="space-y-3">
        <h2 className="text-lg font-bold">Dokumen wajib terverifikasi: {progress.approved}/{progress.total}</h2>
        <p className="text-sm text-neutral-600">Daftar umum persiapan. Petugas travel akan mengonfirmasi ketentuan yang berlaku untuk perjalanan Anda. Dokumen opsional tidak mengurangi progress wajib.</p>
        {required.map(item => {
          const doc = docs.find(d => d.jenis === item.jenis);
          return <article key={item.jenis} className="border rounded-2xl p-4 space-y-3">
            <div><h3 className="font-semibold">{item.label}</h3><p className="text-sm text-neutral-600">{item.required ? 'Wajib' : 'Jika berlaku untuk Anda'}</p></div>
            <p className="text-sm">{doc?.status === 'approved' ? 'Disetujui' : doc?.status === 'rejected' ? 'Perlu diperbaiki' : doc?.status === 'submitted' ? 'Menunggu verifikasi' : 'Belum diunggah'}</p>
            {doc?.status === 'rejected' && <p className="text-sm">Alasan: {doc.rejection_reason || 'Hubungi petugas untuk penjelasan dokumen lama ini.'}</p>}
            {doc?.status === 'approved' && <p className="text-sm text-neutral-600">Mengganti berkas akan meminta verifikasi ulang.</p>}
            <div className="flex gap-2 flex-wrap">
              {doc?.file_url && <button className={actionClass} onClick={() => view(doc)}>Lihat {item.label}</button>}
              <input id={'doc-' + item.jenis} type="file" className="peer sr-only" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" disabled={!!uploading} onChange={e => upload(item.jenis, e)} />
              <label className={actionClass + ' cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-disabled:opacity-50'} htmlFor={'doc-' + item.jenis}>{uploading === item.jenis ? 'Mengunggah...' : doc ? 'Ganti berkas' : 'Unggah berkas'}</label>
            </div>
          </article>;
        })}
      </section> : !booking ? <p>Belum ada perjalanan.</p> : <section className="space-y-4">
        <h2 className="text-lg font-bold">{booking.jadwal_nama}</h2>
        <p className="text-sm">Status booking: {booking.status}. Berangkat: {booking.berangkat_tanggal || 'Belum tersedia'}.</p>
        {booking.status === 'batal' || personal?.pax_status === 'batal' ? <p>Keikutsertaan Anda pada booking ini dibatalkan. Hubungi petugas untuk penyelesaiannya.</p> : <>
          {!personal && <p className="text-sm">Anda tercatat sebagai PIC. Status visa dan manasik ditampilkan pada akun masing-masing peserta.</p>}
          {tasks.map(([name, done]) => <div key={name} className="border rounded-xl p-3 flex justify-between gap-3 text-sm"><span>{name}</span><strong>{done ? 'Selesai' : 'Belum selesai'}</strong></div>)}
          {personal && <div className="border rounded-xl p-3 text-sm"><strong>Perlengkapan Anda</strong><p>{personal.perlengkapan_status === 'sudah_diberikan' ? 'Sudah diberikan' : 'Belum diberikan'}{personal.perlengkapan_tanggal ? ' · ' + personal.perlengkapan_tanggal : ''}</p></div>}
        </>}
        {booking.itinerary_id && <button className={actionClass} onClick={() => setItinerary(true)}>Lihat itinerary</button>}
        <Link href={'/portal/pembayaran?booking=' + booking.id} className="block underline text-sm">Lihat tagihan booking ini</Link>
        <h3 className="font-bold">Peserta booking</h3>
        {(booking.pax || []).map(pax => <div key={pax.id} className="border rounded-xl p-3 text-sm"><p className="font-semibold">{pax.nama_jamaah}</p><p>{pax.room_type || pax.pax_type} · {pax.pax_status === 'batal' ? 'Dibatalkan' : 'Terdaftar'}</p></div>)}
      </section>}
    </>}
    <PortalDialog open={!!preview} onClose={closePreview} title="Pratinjau dokumen">
      {preview && (preview.type === 'application/pdf' ? <iframe src={preview.url} title="Dokumen PDF" className="w-full h-96 border rounded-xl" /> : <img src={preview.url} alt="Dokumen Anda" className="w-full object-contain" />)}
      {preview && <a href={preview.url} target="_blank" rel="noopener noreferrer" className="underline text-sm">Buka berkas di tab baru</a>}
    </PortalDialog>
    <ItineraryModal itineraryId={booking?.itinerary_id} isOpen={itinerary} onClose={() => setItinerary(false)} />
  </div>;
}
