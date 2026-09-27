'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { getAgenStatus } from '@/lib/portalApi';
import { formatRupiah } from '@/lib/portalFormat';
import Badge from '@/components/ui/Badge';
import StatusPembayaranAgen from './StatusPembayaranAgen';
import DashboardAgen from './DashboardAgen';

// Portal Syiar — satu route, tampilan mengikuti status_agen (screen A1, A2, A3, A4).
export default function PortalSyiarPage() {
  const router = useRouter();
  const { jamaah, isLoading } = usePortalAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !jamaah) {
      router.replace('/portal/login');
    }
  }, [isLoading, jamaah, router]);

  useEffect(() => {
    if (!jamaah) return;
    getAgenStatus()
      .then(setData)
      .catch((err) => setError(err.message));
  }, [jamaah]);

  if (isLoading || !jamaah || (!data && !error)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-neutral-500 font-medium">
        Memuat...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-danger-700 text-center">{error}</p>
      </div>
    );
  }

  const bayar = data.pembayaran;
  const pembayaranBelumBeres =
    bayar && bayar.keputusan_agen !== 'ditolak' && bayar.status !== 'terverifikasi' && bayar.nominal_tagihan > 0;

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3.5">
      <div className="pb-1">
        <h1 className="text-base sm:text-lg font-bold text-neutral-900">Syiar</h1>
        <p className="text-xs sm:text-sm text-neutral-500">Program Agen Umroh {data.brand_name}</p>
      </div>

      {data.status_agen === 'tidak_aktif' && (
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-sm sm:text-base font-bold text-neutral-900">Ajak keluarga & kerabat berangkat umroh</h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Jadi Agen Syiar dan dapatkan komisi untuk setiap jamaah yang Anda ajak, setelah pembayaran paketnya lunas.
            </p>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-neutral-700">
            <li className="flex gap-2"><span className="text-brand font-bold">•</span>Komisi langsung per jamaah yang Anda ajak</li>
            <li className="flex gap-2"><span className="text-brand font-bold">•</span>Bonus pembinaan dari agen yang Anda rekrut</li>
            <li className="flex gap-2"><span className="text-brand font-bold">•</span>Komisi repeat order saat jamaah Anda berangkat lagi</li>
          </ul>
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs sm:text-sm text-neutral-700">
            {data.biaya_pendaftaran_agen > 0 ? (
              <>Biaya pendaftaran agen: <strong className="font-mono">{formatRupiah(data.biaya_pendaftaran_agen)}</strong></>
            ) : (
              <>Tanpa biaya pendaftaran.</>
            )}
          </div>
          <Link
            href="/portal/syiar/kelengkapan-agen"
            className="block w-full py-2.5 px-4 rounded-xl bg-brand text-white text-sm font-bold text-center shadow-xs hover:opacity-95 transition-all"
          >
            Ajukan jadi Agen
          </Link>
        </div>
      )}

      {data.status_agen === 'pengajuan' && (
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-neutral-900">Pengajuan sedang diproses</h2>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Admin {data.brand_name} akan meninjau data Anda. Kami akan mengabari Anda setelah pengajuan disetujui.
              </p>
            </div>
            <Badge variant="pending">Menunggu</Badge>
          </div>
          {bayar && bayar.nominal_tagihan > 0 && <StatusPembayaranAgen pembayaran={bayar} />}
          {pembayaranBelumBeres && (
            <Link
              href="/portal/syiar/pembayaran-agen"
              className="block w-full py-2.5 px-4 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold text-center hover:bg-neutral-50 transition-all"
            >
              {bayar.status === 'ditolak' ? 'Kirim Ulang Bukti Transfer' : 'Kelola Pembayaran Pendaftaran'}
            </Link>
          )}
        </div>
      )}

      {data.status_agen === 'aktif' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base font-bold text-neutral-900">Anda Agen Syiar aktif</h2>
              <Badge variant="success">Aktif</Badge>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Kode referral</span>
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <span className="font-mono font-bold text-base sm:text-lg text-neutral-900 tracking-widest">{data.kode_referral}</span>
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/?ref=${data.kode_referral}`;
                    navigator.clipboard?.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold shrink-0 cursor-pointer"
                >
                  {copied ? 'Link tersalin!' : 'Salin link'}
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-500">
                Bagikan link Anda. Jamaah yang mendaftar lewat link ini tercatat sebagai jamaah Anda.
              </p>
            </div>
          </div>
          <DashboardAgen />
          {pembayaranBelumBeres && (
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 space-y-3">
              <StatusPembayaranAgen pembayaran={bayar} />
              <Link
                href="/portal/syiar/pembayaran-agen"
                className="block w-full py-2 px-4 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-xs sm:text-sm font-semibold text-center hover:bg-neutral-50"
              >
                {bayar.status === 'ditolak' ? 'Kirim Ulang Bukti Transfer' : 'Kelola Pembayaran Pendaftaran'}
              </Link>
            </div>
          )}
        </div>
      )}

      {data.status_agen === 'nonaktif' && (
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-bold text-neutral-900">Akun agen dinonaktifkan</h2>
            <Badge variant="danger">Nonaktif</Badge>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Selama nonaktif, fitur agen dan komisi tidak tersedia. Hubungi admin {data.brand_name} untuk informasi lebih lanjut.
          </p>
        </div>
      )}
    </div>
  );
}
