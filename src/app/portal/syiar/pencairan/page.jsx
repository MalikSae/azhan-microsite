'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { getPencairanAgen, ajukanPencairanAgen, bukaBuktiPencairan } from '@/lib/portalApi';
import { formatRupiah } from '@/lib/portalFormat';
import Badge from '@/components/ui/Badge';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white';

const STATUS = {
  pending: { label: 'Diproses', variant: 'pending' },
  disetujui: { label: 'Disetujui', variant: 'success' },
  ditolak: { label: 'Ditolak', variant: 'danger' },
};

const formatTanggal = (v) =>
  v ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(v)) : '-';

// Screen A7 — tarik saldo agen: minimal Rp500.000, maksimal saldo tersedia,
// satu pengajuan diproses dalam satu waktu, rekening tersimpan untuk berikutnya.
export default function PencairanPage() {
  const router = useRouter();
  const { jamaah, isLoading } = usePortalAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [sukses, setSukses] = useState(false);
  const [nominal, setNominal] = useState('');
  const [rekening, setRekening] = useState({ rekening_bank: '', rekening_nomor: '', rekening_atas_nama: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !jamaah) router.replace('/portal/login');
  }, [isLoading, jamaah, router]);

  const muat = useCallback(async () => {
    try {
      const d = await getPencairanAgen();
      setData(d);
      setRekening(d.rekening);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (jamaah) muat();
  }, [jamaah, muat]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSukses(false);
    const n = parseInt(String(nominal).replace(/\D/g, ''), 10) || 0;
    if (n < data.minimal) return setFormError(`Nominal minimal ${formatRupiah(data.minimal)}`);
    if (n > data.saldo_tersedia) return setFormError('Nominal melebihi saldo tersedia');
    if (!rekening.rekening_bank.trim() || !rekening.rekening_nomor.trim() || !rekening.rekening_atas_nama.trim()) {
      return setFormError('Lengkapi rekening tujuan');
    }
    setSubmitting(true);
    try {
      await ajukanPencairanAgen({ nominal: n, ...rekening });
      setNominal('');
      setSukses(true);
      await muat();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !jamaah || (!data && !error)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-neutral-500 font-medium">
        Memuat...
      </div>
    );
  }

  const bisaAjukan = data && !data.ada_pending && data.saldo_tersedia >= data.minimal;

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
          <h1 className="text-sm sm:text-base font-bold text-neutral-900">Tarik Saldo</h1>
          <p className="text-[11px] sm:text-xs text-neutral-500">Diproses oleh Admin Azhan Grup</p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 text-xs sm:text-sm">{error}</div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-success-50 border border-success-200">
              <p className="text-[11px] text-success-700 font-semibold">Saldo tersedia</p>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-neutral-900 font-mono">{formatRupiah(data.saldo_tersedia)}</p>
            </div>
            <div className="p-3 rounded-xl bg-warning-50 border border-warning-200">
              <p className="text-[11px] text-warning-800 font-semibold">Saldo tertahan</p>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-neutral-900 font-mono">{formatRupiah(data.saldo_tertahan)}</p>
            </div>
          </div>

          <form onSubmit={submit} className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
            {data.ada_pending && (
              <div className="p-2.5 rounded-xl bg-warning-50 border border-warning-200 text-xs text-warning-800">
                Masih ada pengajuan yang sedang diproses. Pengajuan baru bisa dibuat setelah pengajuan itu selesai.
              </div>
            )}
            {!data.ada_pending && data.saldo_tersedia < data.minimal && (
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
                Saldo tersedia belum mencapai minimal pencairan {formatRupiah(data.minimal)}. Komisi tertahan menjadi tersedia setelah jamaahnya berangkat.
              </div>
            )}
            {formError && (
              <div className="p-2.5 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 text-xs sm:text-sm">{formError}</div>
            )}
            {sukses && (
              <div className="p-2.5 rounded-xl bg-success-50 text-success-700 border border-success-200 text-xs sm:text-sm">
                Pengajuan terkirim. Anda akan melihat bukti transfer di riwayat setelah disetujui.
              </div>
            )}

            <div>
              <label htmlFor="nominal" className="block text-xs font-semibold text-neutral-700 mb-1.5">Nominal (min. {formatRupiah(data.minimal)})</label>
              <input
                id="nominal"
                inputMode="numeric"
                value={nominal ? Number(nominal).toLocaleString('id-ID') : ''}
                onChange={(e) => setNominal(e.target.value.replace(/\D/g, ''))}
                placeholder="500.000"
                disabled={!bisaAjukan}
                className={`${inputClass} font-mono disabled:bg-neutral-50`}
              />
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-neutral-700">Rekening tujuan</p>
              <input
                value={rekening.rekening_bank}
                onChange={(e) => setRekening({ ...rekening, rekening_bank: e.target.value })}
                placeholder="Nama bank (mis. BSI)"
                maxLength={100}
                disabled={!bisaAjukan}
                className={`${inputClass} disabled:bg-neutral-50`}
              />
              <input
                inputMode="numeric"
                value={rekening.rekening_nomor}
                onChange={(e) => setRekening({ ...rekening, rekening_nomor: e.target.value.replace(/[^0-9 -]/g, '') })}
                placeholder="Nomor rekening"
                maxLength={50}
                disabled={!bisaAjukan}
                className={`${inputClass} font-mono disabled:bg-neutral-50`}
              />
              <input
                value={rekening.rekening_atas_nama}
                onChange={(e) => setRekening({ ...rekening, rekening_atas_nama: e.target.value })}
                placeholder="Atas nama"
                maxLength={150}
                disabled={!bisaAjukan}
                className={`${inputClass} disabled:bg-neutral-50`}
              />
            </div>
            <button
              type="submit"
              disabled={!bisaAjukan || submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-brand text-white text-sm font-bold shadow-xs hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? 'Mengirim...' : 'Ajukan Pencairan'}
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 space-y-2">
            <h2 className="text-sm font-bold text-neutral-900">Riwayat pengajuan</h2>
            {data.riwayat.length === 0 ? (
              <p className="text-xs text-neutral-500">Belum ada pengajuan.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {data.riwayat.map((r) => {
                  const meta = STATUS[r.status] || { label: r.status, variant: 'neutral' };
                  return (
                    <div key={r.id} className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-neutral-900 font-mono">{formatRupiah(r.nominal_diajukan)}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        {formatTanggal(r.diajukan_at)} • {r.rekening_bank} {r.rekening_nomor}
                      </p>
                      {r.status === 'ditolak' && r.catatan_penolakan && (
                        <p className="text-[11px] text-danger-700">Alasan: {r.catatan_penolakan}</p>
                      )}
                      {r.status === 'disetujui' && r.punya_bukti && (
                        <button
                          type="button"
                          onClick={() => bukaBuktiPencairan(r.id).catch((err) => setError(err.message))}
                          className="text-[11px] font-semibold text-brand underline cursor-pointer"
                        >
                          Lihat bukti transfer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
