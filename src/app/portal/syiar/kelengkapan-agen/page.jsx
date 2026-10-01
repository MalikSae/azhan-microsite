'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { getAgenStatus, ajukanAgen, uploadPortalMedia } from '@/lib/portalApi';
import { formatRupiah } from '@/lib/portalFormat';
import CustomCheckbox from '@/components/ui/CustomCheckbox';

// Screen A1a — Lengkapi Data Agen: foto diri, domisili, biaya (read-only), persetujuan S&K.
export default function KelengkapanAgenPage() {
  const router = useRouter();
  const { jamaah, isLoading } = usePortalAuth();
  const [status, setStatus] = useState(null);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [domisili, setDomisili] = useState('');
  const [setuju, setSetuju] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading && !jamaah) router.replace('/portal/login');
  }, [isLoading, jamaah, router]);

  useEffect(() => {
    if (!jamaah) return;
    getAgenStatus()
      .then((s) => {
        // Halaman ini hanya untuk yang belum pernah/sudah tidak mengajukan.
        if (s.status_agen !== 'tidak_aktif') {
          router.replace('/portal/syiar');
          return;
        }
        setStatus(s);
      })
      .catch((err) => setError(err.message));
  }, [jamaah, router]);

  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Foto diri harus berupa gambar (JPG, PNG, atau WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5MB');
      return;
    }
    setError(null);
    setFoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!foto) return setError('Foto diri wajib diunggah');
    if (domisili.trim().length < 2) return setError('Domisili wajib diisi');
    if (!setuju) return setError('Anda wajib menyetujui Syarat & Ketentuan Agen');

    setSubmitting(true);
    setError(null);
    try {
      const fotoUrl = await uploadPortalMedia(foto);
      const hasil = await ajukanAgen({
        foto_agen_url: fotoUrl,
        domisili: domisili.trim(),
        setuju_syarat_ketentuan: true,
      });
      router.replace(hasil.pembayaran?.nominal_tagihan > 0 ? '/portal/syiar/pembayaran-agen' : '/portal/syiar');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (isLoading || !jamaah || (!status && !error)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-neutral-500 font-medium">
        Memuat...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3.5">
      <div className="flex items-center gap-2.5 pb-1">
        <Link
          href="/portal/syiar"
          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors shrink-0"
          aria-label="Kembali ke Syiar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-neutral-900">Lengkapi Data Agen</h1>
          <p className="text-[11px] sm:text-xs text-neutral-500">Langkah 1 dari {status?.biaya_pendaftaran_agen > 0 ? '2' : '1'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        {error && (
          <div className="p-2.5 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 text-xs sm:text-sm">{error}</div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="foto-agen" className="text-xs sm:text-sm font-bold text-neutral-700 block">Foto diri *</label>
          <p className="text-[11px] sm:text-xs text-neutral-500">Dipakai untuk kartu identitas agen. Wajah terlihat jelas.</p>
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Pratinjau foto diri" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z" />
                </svg>
              )}
            </div>
            <input
              id="foto-agen"
              type="file"
              accept="image/*"
              onChange={handleFoto}
              className="w-full text-[11px] sm:text-xs text-neutral-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="domisili" className="text-xs sm:text-sm font-bold text-neutral-700 block">Domisili *</label>
          <input
            id="domisili"
            type="text"
            value={domisili}
            onChange={(e) => setDomisili(e.target.value)}
            maxLength={100}
            placeholder="Kota/kabupaten tempat tinggal"
            className="w-full h-11 px-3 rounded-xl border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:border-brand"
          />
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm text-neutral-600">Biaya pendaftaran agen</span>
          <span className="font-mono font-bold text-sm sm:text-base text-neutral-900">
            {status?.biaya_pendaftaran_agen > 0 ? formatRupiah(status.biaya_pendaftaran_agen) : 'Gratis'}
          </span>
        </div>

        <div className="space-y-1">
          <CustomCheckbox
            id="setuju-sk"
            checked={setuju}
            onChange={setSetuju}
            label="Saya menyetujui Syarat & Ketentuan Agen"
          />
          <Link href="/portal/syiar/syarat-ketentuan" className="text-[11px] sm:text-xs font-semibold text-brand underline block pl-7">
            Baca Syarat & Ketentuan Agen
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-2.5 px-4 rounded-xl bg-brand text-white text-sm font-bold shadow-xs transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95 cursor-pointer'}`}
        >
          {submitting ? 'Mengirim...' : 'Daftar Agen'}
        </button>
      </form>
    </div>
  );
}
