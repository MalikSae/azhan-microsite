'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { listMyDokumen, uploadMyDokumen } from '@/lib/portalApi';

const items = [
  ['foto', 'Pas Foto 4×6', 'Latar putih dan wajah terlihat jelas'],
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
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';

  useEffect(() => { if (!authLoading && !jamaah) router.replace('/portal/login'); }, [authLoading, jamaah, router]);
  const loadDocuments = () => listMyDokumen().then((value) => setDocuments(value || [])).catch(() => setDocuments([])).finally(() => setLoading(false));
  useEffect(() => { if (jamaah) loadDocuments(); }, [jamaah]);

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
    <main className="space-y-4 px-4 py-5">
      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between"><div><h2 className="font-bold text-neutral-900">Kelengkapan Dokumen</h2><p className="mt-1 text-xs text-neutral-500">Lengkapi untuk proses visa dan keberangkatan.</p></div><span className="text-lg font-bold text-brand">{completed}/{items.length}</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(completed / items.length) * 100}%` }} /></div>
      </section>
      {message && <div role="status" className={`rounded-xl border p-3 text-sm ${message.type === 'success' ? 'border-success-200 bg-success-50 text-success-700' : 'border-danger-200 bg-danger-50 text-danger-700'}`}>{message.text}</div>}
      <section className="space-y-3">
        {loading ? [1,2,3].map((value) => <div key={value} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />) : items.map(([key, label, description]) => {
          const document = documents.find((doc) => doc.jenis === key);
          const uploaded = Boolean(document?.file_url);
          return <article key={key} className="rounded-2xl border border-neutral-200 bg-white p-4"><div className="flex items-start gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${uploaded ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>{uploaded ? '✓' : '·'}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-bold text-neutral-900">{label}</h3><span className={`text-[10px] font-bold uppercase ${uploaded ? 'text-success-700' : 'text-neutral-400'}`}>{uploaded ? 'Terunggah' : 'Belum ada'}</span></div><p className="mt-1 text-xs text-neutral-500">{description}</p><div className="mt-3 flex gap-2">{uploaded && <a href={document.file_url.startsWith('http') ? document.file_url : `${apiBaseUrl}${document.file_url}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-700">Lihat</a>}<label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg bg-brand px-3 text-xs font-semibold text-white"><span>{uploading === key ? 'Mengunggah...' : uploaded ? 'Ganti' : 'Upload'}</span><input type="file" accept="image/*,.pdf" disabled={uploading === key} onChange={(event) => upload(key, event)} className="hidden" /></label></div></div></div></article>;
        })}
      </section>
    </main>
  );
}
