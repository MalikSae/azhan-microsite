'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { usePortalAuth } from '@/context/PortalAuthContext';

export default function PortalLoginPage() {
  const router = useRouter();
  const { brandId, brandName, brandLogo } = useBrand();
  const { jamaah, isLoading: authLoading, login } = usePortalAuth();

  const [portalPin, setPortalPin] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  const pinDigits = Array.from({ length: 6 }, (_, i) => portalPin[i] || '');

  const handlePinChange = (e, index) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      const chars = pinDigits.slice();
      chars[index] = '';
      setPortalPin(chars.join(''));
      return;
    }

    if (rawVal.length > 1) {
      const pasted = rawVal.slice(0, 6);
      setPortalPin(pasted);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const char = rawVal.slice(-1);
    const chars = pinDigits.slice();
    chars[index] = char;
    const newPin = chars.join('').slice(0, 6);
    setPortalPin(newPin);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        const chars = pinDigits.slice();
        chars[index - 1] = '';
        setPortalPin(chars.join(''));
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      } else if (pinDigits[index]) {
        const chars = pinDigits.slice();
        chars[index] = '';
        setPortalPin(chars.join(''));
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      setPortalPin(pastedData);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  useEffect(() => {
    if (!authLoading && jamaah) {
      router.push('/portal');
    }
  }, [authLoading, jamaah, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!portalPin.trim() || !identifier.trim()) {
      setErrorMessage('PIN dan ID jamaah wajib diisi');
      return;
    }

    if (!brandId) {
      setErrorMessage('Informasi brand tidak valid');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(brandId, identifier.trim(), portalPin.trim());
      router.push('/portal');
    } catch (err) {
      setErrorMessage(err.message || 'ID jamaah atau PIN tidak cocok');
    } finally {
      setIsSubmitting(false);
    }
  };

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo && brandLogo.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;

  return (
    <div className="min-h-dvh bg-[#f5f7fa] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,.95fr)]">
      <section className="hidden bg-neutral-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="w-fit">{fullLogoUrl ? <img src={fullLogoUrl} alt={brandName} className="max-h-12 max-w-[190px] object-contain brightness-0 invert" /> : <span className="text-xl font-bold">{brandName}</span>}</Link>
        <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-on-dark">Portal Jamaah</p><h2 className="mt-4 text-4xl font-bold leading-tight">Semua kebutuhan perjalanan dalam satu tempat.</h2><p className="mt-4 max-w-lg text-base leading-7 text-neutral-300">Pantau kesiapan keberangkatan, lengkapi dokumen, dan konfirmasi pembayaran dengan lebih mudah.</p><div className="mt-8 grid grid-cols-3 gap-3 text-sm"><div className="rounded-2xl border border-white/10 bg-white/5 p-4">Progress jelas</div><div className="rounded-2xl border border-white/10 bg-white/5 p-4">Dokumen aman</div><div className="rounded-2xl border border-white/10 bg-white/5 p-4">Tagihan rapi</div></div></div>
        <p className="text-xs text-neutral-500">Layanan resmi {brandName}</p>
      </section>
      <div className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-8">
      <div className="w-full max-w-md">
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
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-neutral-500">
            Masuk untuk melihat jadwal, progress, dan kelola dokumen Anda di {brandName}.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
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
              <label htmlFor="identifier" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                ID JAMAAH ATAU NO. WHATSAPP
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="HN-2608000001 atau 08123456789"
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 placeholder-neutral-400 font-mono text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                PIN Portal
              </label>
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    value={pinDigits[index] || ''}
                    onChange={(e) => handlePinChange(e, index)}
                    onKeyDown={(e) => handlePinKeyDown(e, index)}
                    onPaste={handlePinPaste}
                    aria-label={`Digit PIN ke-${index + 1}`}
                    className="h-12 w-full text-center text-lg font-bold rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || portalPin.length !== 6 || !identifier.trim()}
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
              Gunakan ID Jamaah dari invoice, atau nomor WhatsApp yang terdaftar. Belum bisa masuk? Hubungi admin travel Anda.
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
      </div></div>
    </div>
  );
}
