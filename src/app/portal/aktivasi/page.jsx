'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';

function AktivasiContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { brandName, brandLogo } = useBrand();

  const [status, setStatus] = useState('loading'); // 'loading' | 'invalid' | 'valid' | 'success'
  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [namaLengkap, setNamaLengkap] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [portalPin, setPortalPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pinInputsRef = useRef([]);
  const confirmPinInputsRef = useRef([]);

  const pinDigits = Array.from({ length: 6 }, (_, i) => portalPin[i] || '');
  const confirmPinDigits = Array.from({ length: 6 }, (_, i) => confirmPin[i] || '');

  // 1. Check Token on Mount
  useEffect(() => {
    if (!token.trim()) {
      setStatus('invalid');
      return;
    }

    let isMounted = true;

    async function verifyToken() {
      try {
        const res = await fetch('/api/public/aktivasi/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token.trim() }),
        });

        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.valid) {
          setNamaLengkap(data.nama_lengkap || '');
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      } catch {
        if (isMounted) {
          setStatus('invalid');
        }
      }
    }

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Focus input on step change
  useEffect(() => {
    if (step === 2) {
      pinInputsRef.current[0]?.focus();
    } else if (step === 3) {
      confirmPinInputsRef.current[0]?.focus();
    }
  }, [step]);

  // 6-digit PIN Handlers
  const handlePinChange = (e, index, isConfirm = false) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const currentDigits = isConfirm ? confirmPinDigits : pinDigits;
    const setPinState = isConfirm ? setConfirmPin : setPortalPin;
    const refs = isConfirm ? confirmPinInputsRef : pinInputsRef;

    if (!rawVal) {
      const chars = currentDigits.slice();
      chars[index] = '';
      setPinState(chars.join(''));
      return;
    }

    if (rawVal.length > 1) {
      const pasted = rawVal.slice(0, 6);
      setPinState(pasted);
      const nextIndex = Math.min(pasted.length, 5);
      refs.current[nextIndex]?.focus();
      return;
    }

    const char = rawVal.slice(-1);
    const chars = currentDigits.slice();
    chars[index] = char;
    const newPin = chars.join('').slice(0, 6);
    setPinState(newPin);

    if (char && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e, index, isConfirm = false) => {
    const currentDigits = isConfirm ? confirmPinDigits : pinDigits;
    const setPinState = isConfirm ? setConfirmPin : setPortalPin;
    const refs = isConfirm ? confirmPinInputsRef : pinInputsRef;

    if (e.key === 'Backspace') {
      if (!currentDigits[index] && index > 0) {
        const chars = currentDigits.slice();
        chars[index - 1] = '';
        setPinState(chars.join(''));
        refs.current[index - 1]?.focus();
        e.preventDefault();
      } else if (currentDigits[index]) {
        const chars = currentDigits.slice();
        chars[index] = '';
        setPinState(chars.join(''));
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePinPaste = (e, isConfirm = false) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const setPinState = isConfirm ? setConfirmPin : setPortalPin;
    const refs = isConfirm ? confirmPinInputsRef : pinInputsRef;

    if (pastedData) {
      setPinState(pastedData);
      const nextIndex = Math.min(pastedData.length, 5);
      refs.current[nextIndex]?.focus();
    }
  };

  // Step 1: Verify Tanggal Lahir
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!tanggalLahir || isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/public/aktivasi/verify-dob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          tanggal_lahir: tanggalLahir,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setErrorMessage(data.error || 'Tanggal lahir tidak sesuai.');
        return;
      }

      setErrorMessage(null);
      setStep(2);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memverifikasi tanggal lahir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Buat PIN
  const handleStep2Submit = (e) => {
    e.preventDefault();
    if (portalPin.length !== 6) return;

    setErrorMessage(null);
    setStep(3);
  };

  // Step 3: Final Submit Aktivasi
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!tanggalLahir) {
      setErrorMessage('Tanggal lahir wajib diisi');
      setStep(1);
      return;
    }

    if (portalPin.length !== 6) {
      setErrorMessage('PIN portal harus 6 digit angka');
      setStep(2);
      return;
    }

    if (portalPin === '123456') {
      setErrorMessage('PIN terlalu mudah ditebak, gunakan kombinasi lain.');
      setStep(2);
      return;
    }

    if (portalPin !== confirmPin) {
      setErrorMessage('Konfirmasi PIN tidak cocok');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/public/aktivasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          tanggal_lahir: tanggalLahir,
          portal_pin: portalPin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || 'Gagal mengaktifkan akun';
        setErrorMessage(errMsg);
        if (
          errMsg === 'Tanggal lahir tidak sesuai.' ||
          errMsg === 'Link aktivasi tidak valid atau sudah kedaluwarsa.'
        ) {
          setStep(1);
        }
        return;
      }

      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menghubungi server aktivasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPinComplete = portalPin.length === 6;
  const isConfirmComplete = confirmPin.length === 6;
  const isMatch = isPinComplete && isConfirmComplete && portalPin === confirmPin;
  const isMismatch = isConfirmComplete && portalPin !== confirmPin;
  const canSubmit = isMatch && !isSubmitting;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const fullLogoUrl = brandLogo && brandLogo.startsWith('/') ? `${apiBaseUrl}${brandLogo}` : brandLogo;

  return (
    <div className="min-h-dvh bg-[#f5f7fa] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,.95fr)]">
      {/* Panel Kiri (Konsisten dengan Login) */}
      <section className="hidden bg-neutral-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="w-fit">
          {fullLogoUrl ? (
            <img src={fullLogoUrl} alt={brandName} className="max-h-12 max-w-[190px] object-contain brightness-0 invert" />
          ) : (
            <span className="text-xl font-bold">{brandName}</span>
          )}
        </Link>
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-on-dark">Portal Jamaah</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight">Semua kebutuhan perjalanan dalam satu tempat.</h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-neutral-300">
            Pantau kesiapan keberangkatan, lengkapi dokumen, dan konfirmasi pembayaran dengan lebih mudah.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Progress jelas</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Dokumen aman</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Tagihan rapi</div>
          </div>
        </div>
        <p className="text-xs text-neutral-500">Layanan resmi {brandName}</p>
      </section>

      {/* Konten Kanan */}
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
              Aktivasi Akun Portal
            </h1>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-neutral-500">
              Pasang PIN portal Anda untuk mulai mengakses layanan jamaah di {brandName}.
            </p>
          </div>

          {/* Login Card Style */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
            {/* 1. STATE MEMUAT */}
            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <svg className="animate-spin h-8 w-8 text-brand mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm font-medium text-neutral-600">Memeriksa link aktivasi...</p>
              </div>
            )}

            {/* 2. STATE TOKEN TIDAK VALID */}
            {status === 'invalid' && (
              <div className="text-center py-2 space-y-4">
                <div className="mb-4 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm text-left flex items-start gap-3">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Link aktivasi tidak valid atau sudah kedaluwarsa. Hubungi admin travel Anda untuk mendapatkan link baru.</span>
                </div>
                <Link
                  href="/portal/login"
                  className="w-full py-3 px-4 rounded-xl bg-brand text-white font-semibold text-sm hover:brightness-95 active:brightness-90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  Ke Halaman Login
                </Link>
              </div>
            )}

            {/* 3. STATE TOKEN VALID — 3 LANGKAH FORM */}
            {status === 'valid' && (
              <>
                {/* Indikator Langkah & Sapaan */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <p className="text-xs text-neutral-500 truncate">
                    Aktivasi akun untuk <span className="font-semibold text-neutral-800">{namaLengkap}</span>
                  </p>
                  <span className="text-xs font-medium text-neutral-400 shrink-0">
                    Langkah {step} dari 3
                  </span>
                </div>

                {/* Alert Error */}
                {errorMessage && (
                  <div className="mb-4 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* LANGKAH 1 — Tanggal Lahir */}
                {step === 1 && (
                  <form onSubmit={handleStep1Submit} className="space-y-4">
                    <div>
                      <label htmlFor="tanggal_lahir" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                        Tanggal Lahir
                      </label>
                      <input
                        id="tanggal_lahir"
                        type="date"
                        value={tanggalLahir}
                        onChange={(e) => setTanggalLahir(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!tanggalLahir || isSubmitting}
                      className="w-full py-3 px-4 rounded-xl bg-brand text-white font-semibold text-sm hover:brightness-95 active:brightness-90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <span>Lanjut</span>
                      )}
                    </button>
                  </form>
                )}

                {/* LANGKAH 2 — Buat PIN */}
                {step === 2 && (
                  <form onSubmit={handleStep2Submit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                        Buat 6 Digit PIN
                      </label>
                      <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <input
                            key={`pin_${index}`}
                            ref={(el) => { pinInputsRef.current[index] = el; }}
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            autoComplete={index === 0 ? 'one-time-code' : 'off'}
                            value={pinDigits[index] || ''}
                            onChange={(e) => handlePinChange(e, index, false)}
                            onKeyDown={(e) => handlePinKeyDown(e, index, false)}
                            onPaste={(e) => handlePinPaste(e, false)}
                            aria-label={`Digit PIN ke-${index + 1}`}
                            className="h-12 w-full text-center text-lg font-bold rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={portalPin.length !== 6}
                      className="w-full py-3 px-4 rounded-xl bg-brand text-white font-semibold text-sm hover:brightness-95 active:brightness-90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      <span>Lanjut</span>
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setErrorMessage(null);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        <span>Kembali</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* LANGKAH 3 — Konfirmasi PIN */}
                {step === 3 && (
                  <form onSubmit={handleFinalSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                        Konfirmasi PIN
                      </label>
                      <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <input
                            key={`confirm_${index}`}
                            ref={(el) => { confirmPinInputsRef.current[index] = el; }}
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            autoComplete="off"
                            value={confirmPinDigits[index] || ''}
                            onChange={(e) => handlePinChange(e, index, true)}
                            onKeyDown={(e) => handlePinKeyDown(e, index, true)}
                            onPaste={(e) => handlePinPaste(e, true)}
                            aria-label={`Digit Konfirmasi PIN ke-${index + 1}`}
                            className={`h-12 w-full text-center text-lg font-bold rounded-xl border text-neutral-900 focus:outline-none transition-all ${
                              isMatch
                                ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500'
                                : isMismatch
                                ? 'border-danger-500 focus:ring-2 focus:ring-danger-500'
                                : 'border-neutral-300 focus:ring-2 focus:ring-brand focus:border-transparent'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Realtime Match Indicator */}
                      {isMatch && (
                        <p className="text-xs font-medium text-emerald-600 mt-1.5 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>PIN cocok</span>
                        </p>
                      )}
                      {isMismatch && (
                        <p className="text-xs font-medium text-danger-600 mt-1.5 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>PIN belum cocok</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full py-3 px-4 rounded-xl bg-brand text-white font-semibold text-sm hover:brightness-95 active:brightness-90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Mengaktifkan...</span>
                        </>
                      ) : (
                        <span>Aktifkan Akun</span>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(2);
                          setErrorMessage(null);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        <span>Kembali</span>
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
                  <p className="text-xs text-neutral-500">
                    PIN akan digunakan untuk masuk ke Portal Jamaah. Jaga kerahasiaan PIN Anda.
                  </p>
                </div>
              </>
            )}

            {/* 4. STATE BERHASIL */}
            {status === 'success' && (
              <div className="text-center py-2 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm text-left flex items-start gap-3">
                  <svg className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Akun Anda sudah aktif.</p>
                    <p className="mt-0.5 text-xs text-emerald-700">Silakan masuk memakai PIN yang baru Anda buat.</p>
                  </div>
                </div>
                <Link
                  href="/portal/login"
                  className="w-full py-3 px-4 rounded-xl bg-brand text-white font-semibold text-sm hover:brightness-95 active:brightness-90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  Masuk ke Portal
                </Link>
              </div>
            )}
          </div>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link href="/portal/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Kembali ke Halaman Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortalAktivasiPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-[#f5f7fa]">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-neutral-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-neutral-500 font-medium">Memuat halaman...</p>
          </div>
        </div>
      }
    >
      <AktivasiContent />
    </Suspense>
  );
}
