'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { useBrand } from '@/context/BrandContext';
import { formatTanggalIndo } from '@/lib/portalFormat';
import Card from '@/components/ui/Card';

export default function PortalProfilPage() {
  const router = useRouter();
  const { jamaah, isLoading, logout } = usePortalAuth();
  const { brandName, brandWhatsapp } = useBrand();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!isLoading && !jamaah) {
      router.replace('/portal/login');
    }
  }, [isLoading, jamaah, router]);

  const handleLogout = () => {
    logout();
    router.replace('/portal/login');
  };

  if (isLoading || !jamaah) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-neutral-500 font-medium min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
          <span>Memuat profil...</span>
        </div>
      </div>
    );
  }

  const nama = jamaah.nama_lengkap || jamaah.nama || jamaah.name || 'Jamaah';
  const idJamaah = jamaah.id_jamaah || jamaah.id || '-';
  const noHp = jamaah.no_hp || jamaah.nomor_wa || jamaah.phone || '-';
  const nik = jamaah.nik || jamaah.nomor_ktp || '-';
  const noPaspor = jamaah.nomor_paspor || jamaah.paspor_nomor || '-';
  const jenisKelamin =
    jamaah.jenis_kelamin === 'L' || jamaah.jenis_kelamin === 'LAKI_LAKI'
      ? 'Laki-laki'
      : jamaah.jenis_kelamin === 'P' || jamaah.jenis_kelamin === 'PEREMPUAN'
      ? 'Perempuan'
      : jamaah.jenis_kelamin || '-';
  const tglLahir = jamaah.tanggal_lahir ? formatTanggalIndo(jamaah.tanggal_lahir) : '-';
  const tempatLahir = jamaah.tempat_lahir || '';
  const ttl = tempatLahir ? `${tempatLahir}, ${tglLahir}` : tglLahir;
  const alamat = jamaah.alamat || jamaah.alamat_ktp || '-';

  return (
    <div className="flex-1 px-4 py-5 space-y-4 pb-12 max-w-lg mx-auto w-full">
      {/* 1. Header Card Profil */}
      <Card className="p-5 shadow-xs border border-neutral-200/90 text-center flex flex-col items-center relative overflow-hidden">
        {/* Dekorasi Aksen Brand */}
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 pointer-events-none"
          style={{ backgroundColor: 'var(--brand-primary, #990000)' }}
        />

        {/* Avatar Inisial */}
        <div className="w-16 h-16 rounded-2xl bg-brand text-white flex items-center justify-center text-2xl font-black shadow-xs mb-3">
          {nama.charAt(0).toUpperCase()}
        </div>

        <h1 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
          {nama}
        </h1>

        <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-[11px] font-mono font-semibold text-neutral-700">
          <span>ID: {idJamaah}</span>
        </div>
      </Card>

      {/* 2. Informasi Data Pribadi */}
      <Card className="p-4 shadow-xs border border-neutral-200/90 space-y-3.5">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-2.5">
          <div className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-neutral-900">
            Data Pribadi
          </h2>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-start gap-2">
            <span className="text-neutral-400 shrink-0">Nomor WhatsApp</span>
            <span className="font-semibold text-neutral-800 text-right">{noHp}</span>
          </div>

          <div className="flex justify-between items-start gap-2">
            <span className="text-neutral-400 shrink-0">NIK (KTP)</span>
            <span className="font-semibold text-neutral-800 text-right font-mono">{nik}</span>
          </div>

          <div className="flex justify-between items-start gap-2">
            <span className="text-neutral-400 shrink-0">Nomor Paspor</span>
            <span className="font-semibold text-neutral-800 text-right font-mono">{noPaspor}</span>
          </div>

          <div className="flex justify-between items-start gap-2">
            <span className="text-neutral-400 shrink-0">Jenis Kelamin</span>
            <span className="font-semibold text-neutral-800 text-right">{jenisKelamin}</span>
          </div>

          <div className="flex justify-between items-start gap-2">
            <span className="text-neutral-400 shrink-0">Tempat, Tgl Lahir</span>
            <span className="font-semibold text-neutral-800 text-right">{ttl}</span>
          </div>

          <div className="flex justify-between items-start gap-2 pt-1 border-t border-neutral-100">
            <span className="text-neutral-400 shrink-0">Alamat</span>
            <span className="font-medium text-neutral-700 text-right leading-relaxed max-w-[200px]">
              {alamat}
            </span>
          </div>
        </div>
      </Card>

      {/* 3. Bantuan & CS */}
      <Card className="p-4 shadow-xs border border-neutral-200/90 space-y-3">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-2.5">
          <div className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-neutral-900">
            Bantuan & Layanan
          </h2>
        </div>

        <div className="space-y-1">
          {brandWhatsapp && (
            <a
              href={`https://wa.me/${brandWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                'Halo Customer Service, saya ingin menanyakan perihal akun dan data profil saya.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-800 group-hover:text-brand transition-colors">
                    Hubungi CS {brandName || 'Travel'}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Bantuan kendala data atau perjalanan
                  </span>
                </div>
              </div>
              <svg
                className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.25"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          )}

          <Link
            href="/portal/perjalanan"
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-800 group-hover:text-brand transition-colors">
                  Kelengkapan Berkas & Dokumen
                </span>
                <span className="text-[11px] text-neutral-400">
                  Cek status verifikasi dokumen
                </span>
              </div>
            </div>
            <svg
              className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.25"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </Card>

      {/* 4. Tombol Logout */}
      <div className="pt-2">
        {showLogoutConfirm ? (
          <Card className="p-4 border-rose-200 bg-rose-50/50 space-y-3">
            <p className="text-xs font-semibold text-neutral-800 text-center">
              Apakah Anda yakin ingin keluar dari Portal Jamaah?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-xs font-bold hover:bg-neutral-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
              >
                Ya, Keluar
              </button>
            </div>
          </Card>
        ) : (
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 px-4 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-600 text-xs font-bold hover:bg-rose-100/80 transition-all flex items-center justify-center gap-2 active:scale-98 shadow-2xs"
          >
            <svg
              className="w-4 h-4 text-rose-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            <span>Keluar dari Akun</span>
          </button>
        )}
      </div>
    </div>
  );
}

