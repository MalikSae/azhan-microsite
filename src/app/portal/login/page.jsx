'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { usePortalAuth } from '@/context/PortalAuthContext';

export default function PortalLoginPage() {
  const router = useRouter();
  const { brandId, brandName, brandLogo } = useBrand();
  const { jamaah, isLoading: authLoading, login } = usePortalAuth();

  const [namaLengkap, setNamaLengkap] = useState('');
  const [idJamaah, setIdJamaah] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && jamaah) {
      router.push('/portal');
    }
  }, [authLoading, jamaah, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!namaLengkap.trim() || !idJamaah.trim()) {
      setErrorMessage('Nama lengkap dan ID jamaah wajib diisi');
      return;
    }

    if (!brandId) {
      setErrorMessage('Informasi brand tidak valid');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(brandId, namaLengkap.trim(), idJamaah.trim().toUpperCase());
      router.push('/portal');
    } catch (err) {
      setErrorMessage(err.message || 'Nama atau ID jamaah tidak cocok');
    } finally {
      setIsSubmitting(false);
    }
  };

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo && brandLogo.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-4 hover:opacity-90 transition-opacity">
            {fullLogoUrl ? (
              <img 
                src={fullLogoUrl} 
                alt={brandName} 
                className="h-12 w-auto mx-auto object-contain"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-brand text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
                {brandName.charAt(0)}
              </div>
            )}
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Portal Jamaah
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Masuk untuk melihat jadwal, progress, dan kelola dokumen Anda di {brandName}.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-5">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nama_lengkap" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <input
                id="nama_lengkap"
                type="text"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                placeholder="Sesuai KTP / Paspor"
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 placeholder-neutral-400 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="id_jamaah" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                ID Jamaah
              </label>
              <input
                id="id_jamaah"
                type="text"
                value={idJamaah}
                onChange={(e) => setIdJamaah(e.target.value.toUpperCase())}
                placeholder="mis. AS-2608000001"
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 placeholder-neutral-400 font-mono uppercase text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-brand text-white font-semibold text-sm hover:brightness-95 active:brightness-90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Memeriksa...</span>
                </>
              ) : (
                <span>Masuk ke Portal</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-500">
              ID Jamaah bisa dilihat pada invoice atau ditanyakan ke admin travel Anda.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Kembali ke Beranda {brandName}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
