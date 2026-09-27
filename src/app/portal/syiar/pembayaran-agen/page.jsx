'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { useBrand } from '@/context/BrandContext';
import {
  getAgenStatus,
  listPaymentAccounts,
  uploadPortalMedia,
  kirimBuktiPendaftaranAgen,
} from '@/lib/portalApi';
import { formatRupiah, formatTanggalIndo } from '@/lib/portalFormat';
import BankAccountList from '@/components/portal/BankAccountList';
import StatusPembayaranAgen from '../StatusPembayaranAgen';

// Screen A1b — Bayar Pendaftaran Agen. Bisa dibuka ulang selama pembayaran
// masih menunggu verifikasi atau ditolak (upload revisi = riwayat baru).
export default function PembayaranAgenPage() {
  const router = useRouter();
  const { jamaah, isLoading } = usePortalAuth();
  const { brandName, brandWhatsapp } = useBrand();
  const [status, setStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sukses, setSukses] = useState(false);
  const [inputKey, setInputKey] = useState(0); // remount input file setelah terkirim

  useEffect(() => {
    if (!isLoading && !jamaah) router.replace('/portal/login');
  }, [isLoading, jamaah, router]);

  const load = async () => {
    try {
      const [s, acc] = await Promise.all([getAgenStatus(), listPaymentAccounts().catch(() => [])]);
      const p = s.pembayaran;
      // Tidak ada tagihan aktif (belum mengajukan, biaya Rp0, atau siklus sudah ditolak).
      if (!p || p.nominal_tagihan <= 0 || p.keputusan_agen === 'ditolak' || s.status_agen === 'tidak_aktif') {
        router.replace('/portal/syiar');
        return;
      }
      setStatus(s);
      setAccounts(Array.isArray(acc) ? acc : []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (jamaah) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jamaah]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }
    setError(null);
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return setError('Pilih file bukti transfer terlebih dahulu');
    setSubmitting(true);
    setError(null);
    try {
      const url = await uploadPortalMedia(file);
      await kirimBuktiPendaftaranAgen(url);
      setFile(null);
      setPreview(null);
      setInputKey((k) => k + 1);
      setSukses(true);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
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

  const p = status?.pembayaran;
  const bisaUpload = p && p.status !== 'terverifikasi';
  const nomorAdmin = (status?.no_wa_admin_travel || '').replace(/[^0-9]/g, '');
  const nomorBantuan = (brandWhatsapp || '').replace(/[^0-9]/g, '');
  const teksKonfirmasi = encodeURIComponent(
    `Halo Admin ${brandName}, saya ${jamaah?.nama_lengkap || ''} ingin konfirmasi pembayaran pendaftaran Agen Syiar sebesar ${formatRupiah(p?.nominal_tagihan || 0)}.`
  );
  const teksBantuan = encodeURIComponent(`Halo ${brandName}, saya butuh bantuan untuk pendaftaran Agen Syiar.`);

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
          <h1 className="text-sm sm:text-base font-bold text-neutral-900">Bayar Pendaftaran Agen</h1>
          <p className="text-[11px] sm:text-xs text-neutral-500">Langkah 2 dari 2</p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 text-xs sm:text-sm">{error}</div>
      )}

      {p && (
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 space-y-3">
            <StatusPembayaranAgen pembayaran={p} />
            {p.status === 'terverifikasi' && (
              <p className="text-xs sm:text-sm text-success-700">Pembayaran pendaftaran Anda sudah diverifikasi. Terima kasih!</p>
            )}
          </div>

          {bisaUpload && (
            <>
              <div className="px-4 sm:px-5 pb-3 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Transfer ke rekening resmi</span>
                <BankAccountList accounts={accounts} />
              </div>

              <div className="p-4 sm:p-5 bg-neutral-50/70 border-t border-neutral-100 space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="bukti-agen" className="text-xs sm:text-sm font-bold text-neutral-700 block">
                    Unggah bukti transfer <span className="font-normal text-neutral-500">(disarankan)</span>
                  </label>
                  <input
                    key={inputKey}
                    id="bukti-agen"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFile}
                    className="w-full text-[11px] sm:text-xs text-neutral-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-neutral-700 hover:file:bg-neutral-100 cursor-pointer"
                  />
                  {preview && (
                    <div className="rounded-lg overflow-hidden border border-neutral-200 max-h-40 flex items-center justify-center bg-white">
                      <img src={preview} alt="Pratinjau bukti transfer" className="object-contain max-h-40" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={submitting || !file}
                    className={`w-full py-2.5 px-4 rounded-xl bg-brand text-white text-sm font-bold transition-all ${submitting || !file ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95 cursor-pointer'}`}
                  >
                    {submitting ? 'Mengunggah...' : p.status === 'ditolak' ? 'Kirim Bukti Revisi' : 'Kirim Bukti Transfer'}
                  </button>
                  {sukses && <p className="text-xs text-success-700">Bukti transfer terkirim dan menunggu verifikasi admin.</p>}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {nomorAdmin && (
                    <a
                      href={`https://wa.me/${nomorAdmin}?text=${teksKonfirmasi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-semibold text-center"
                    >
                      Konfirmasi Pembayaran via WhatsApp
                    </a>
                  )}
                  {nomorBantuan && (
                    <a
                      href={`https://wa.me/${nomorBantuan}?text=${teksBantuan}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 text-xs sm:text-sm font-semibold text-center"
                    >
                      Butuh Bantuan
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {p?.uploads?.length > 0 && (
        <div className="space-y-1.5 px-1">
          <h2 className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Riwayat bukti transfer</h2>
          <div className="divide-y divide-neutral-100 bg-white rounded-2xl border border-neutral-200/80 px-3.5 py-1 shadow-2xs">
            {p.uploads.map((u, i) => (
              <div key={u.id} className="py-2 flex items-center justify-between text-xs text-neutral-600">
                <span>Upload #{i + 1} {u.diupload_oleh_tipe === 'admin' ? '(oleh admin)' : ''}</span>
                <span className="text-neutral-400">{formatTanggalIndo(u.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/portal/syiar"
        className="block w-full py-2.5 px-4 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold text-center hover:bg-neutral-50"
      >
        Lanjut ke Status Pengajuan
      </Link>
    </div>
  );
}
