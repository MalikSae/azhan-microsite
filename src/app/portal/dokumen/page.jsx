'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { listMyDokumen, uploadMyDokumen } from '@/lib/portalApi';

const items = [
  ['pas_foto', 'Pas Foto 4×6', 'Latar putih dan wajah terlihat jelas'],
  ['paspor', 'Buku Paspor', 'Halaman identitas yang masih berlaku'],
  ['ktp', 'KTP Elektronik', 'Foto KTP asli dan terbaca'],
  ['kk', 'Kartu Keluarga', 'Foto lembar Kartu Keluarga'],
  ['buku_nikah', 'Buku Nikah / Akta Lahir', 'Untuk pasangan, mahram, atau anak'],
  ['vaksin_meningitis', 'Sertifikat Vaksin', 'Buku kuning atau sertifikat meningitis'],
];

export default function DokumenPage() {
  const router = useRouter();
  const { jamaah, isLoading: authLoading } = usePortalAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';

  useEffect(() => { if (!authLoading && !jamaah) router.replace('/portal/login'); }, [authLoading, jamaah, router]);
  const loadDocuments = () => listMyDokumen().then((value) => setDocuments(value || [])).catch(() => setDocuments([])).finally(() => setLoading(false));
  useEffect(() => { if (jamaah) loadDocuments(); }, [jamaah]);
  useEffect(() => {
    if (!preview) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setPreview(null); };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = ''; };
  }, [preview]);

  const showPreview = (document, label) => {
    const source = document.file_url.startsWith('http') ? document.file_url : `${apiBaseUrl}${document.file_url}`;
    setPreview({ label, source, isPdf: /\.pdf(?:$|\?)/i.test(source) });
  };

  const upload = async (type, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(type); setMessage(null);
    try { await uploadMyDokumen(type, file); await loadDocuments(); setMessage({ type: 'success', text: 'Dokumen berhasil diunggah.' }); }
    catch (error) { setMessage({ type: 'error', text: error.message || 'Dokumen gagal diunggah.' }); }
    finally { setUploading(''); event.target.value = ''; }
  };

  if (authLoading || !jamaah) return <div className="flex min-h-[70vh] items-center justify-center text-sm text-neutral-500">Memuat dokumen...</div>;
  const completed = items.filter(([key]) => documents.some((doc) => doc.jenis === key && doc.file_url)).length;

  return (
    <main className="portal-page space-y-5">
      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between"><div><h2 className="font-bold text-neutral-900">Kelengkapan Dokumen</h2><p className="mt-1 text-xs text-neutral-500">Lengkapi untuk proses visa dan keberangkatan.</p></div><span className="text-lg font-bold text-brand">{completed}/{items.length}</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(completed / items.length) * 100}%` }} /></div>
      </section>
      {message && <div role="status" className={`rounded-xl border p-3 text-sm ${message.type === 'success' ? 'border-success-200 bg-success-50 text-success-700' : 'border-danger-200 bg-danger-50 text-danger-700'}`}>{message.text}</div>}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading ? [1,2,3].map((value) => <div key={value} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />) : items.map(([key, label, description]) => {
          const document = documents.find((doc) => doc.jenis === key);
          const uploaded = Boolean(document?.file_url);
          return <article key={key} className="rounded-2xl border border-neutral-200 bg-white p-4"><div className="flex items-start gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${uploaded ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>{uploaded ? '✓' : '·'}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-bold text-neutral-900">{label}</h3><span className={`text-[10px] font-bold uppercase ${uploaded ? 'text-success-700' : 'text-neutral-400'}`}>{uploaded ? 'Terunggah' : 'Belum ada'}</span></div><p className="mt-1 text-xs text-neutral-500">{description}</p><div className="mt-3 flex gap-2">{uploaded && <button type="button" onClick={() => showPreview(document, label)} className="inline-flex min-h-10 items-center rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-700">Lihat</button>}<label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg bg-brand px-3 text-xs font-semibold text-white"><span>{uploading === key ? 'Mengunggah...' : uploaded ? 'Ganti' : 'Upload'}</span><input type="file" accept="image/*,.pdf" disabled={uploading === key} onChange={(event) => upload(key, event)} className="hidden" /></label></div></div></div></article>;
        })}
      </section>
      {preview && <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="document-preview-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
        <section className="flex max-h-[92dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
          <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3">
            <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">Preview dokumen</p><h2 id="document-preview-title" className="truncate text-base font-bold text-neutral-900">{preview.label}</h2></div>
            <button type="button" onClick={() => setPreview(null)} aria-label="Tutup preview" className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xl text-neutral-600">×</button>
          </header>
          <div className="min-h-0 flex-1 overflow-auto bg-neutral-100 p-3">
            {preview.isPdf ? <iframe src={preview.source} title={preview.label} className="h-[70dvh] w-full rounded-xl bg-white" /> : <div className="flex min-h-[50dvh] items-center justify-center"><img src={preview.source} alt={preview.label} className="max-h-[72dvh] max-w-full rounded-xl object-contain" /></div>}
          </div>
          <footer className="shrink-0 border-t border-neutral-200 bg-white p-3"><button type="button" onClick={() => setPreview(null)} className="min-h-11 w-full rounded-xl bg-brand px-4 text-sm font-bold text-white">Tutup</button></footer>
        </section>
      </div>}
    </main>
  );
}
