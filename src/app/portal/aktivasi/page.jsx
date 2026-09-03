'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import Button from '@/components/ui/Button';

function AktivasiContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { brandName, brandLogo, brandIcon } = useBrand();

  const [status, setStatus] = useState('loading'); // 'loading' | 'invalid' | 'valid' | 'success'
  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [namaLengkap, setNamaLengkap] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [portalPin, setPortalPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Check Token saat Mount
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

  // Handler Input PIN 6 Digit Numerik
  const handlePinChange = (e) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 6);
    setPortalPin(digitsOnly);
  };

  const handleConfirmPinChange = (e) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 6);
    setConfirmPin(digitsOnly);
  };

  // Step 1: Submit Tanggal Lahir
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

  // Step 2: Lanjut ke Konfirmasi PIN (Validasi Lokal 6 Digit)
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

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const targetIcon = brandIcon || brandLogo;
  const fullIconUrl = targetIcon ? (targetIcon.startsWith('http') ? targetIcon : `${apiBaseUrl}${targetIcon}`) : null;

  return (
    <div className="min-h-dvh w-full bg-white sm:bg-neutral-100 flex justify-center items-center overflow-x-hidden">
      {/* Frame Kontainer Utama */}
      <div className="w-full max-w-[420px] min-h-dvh sm:max-h-[920px] bg-white sm:border-x sm:border-neutral-200/80 sm:shadow-lg flex flex-col justify-between overflow-hidden">
        {/* Konten Atas & Form */}
        <div className="flex flex-col flex-1">
          {/* Header Image Ka'bah (Zona Atas) */}
          <header className="relative w-full overflow-hidden pt-9 pb-13 sm:pt-10 sm:pb-15 px-6 text-white flex flex-col items-center text-center">
            {/* Background Image & Gradient */}
            <div className="absolute inset-0 z-0">
              <img
                src="/images/bg-kaaba.webp"
                alt="Latar Belakang Ka'bah"
                className="w-full h-full object-cover object-center scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/65" />
            </div>

            {/* Icon Brand Bulat dengan Efek Cahaya Ringan */}
            <div className="relative z-10 shrink-0 mb-3 flex items-center justify-center">
              <div className="absolute -inset-3.5 rounded-full bg-white/30 blur-xl pointer-events-none" />
              <div className="absolute -inset-1.5 rounded-full bg-white/20 blur-md pointer-events-none" />

              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                {fullIconUrl ? (
                  <img
                    src={fullIconUrl}
                    alt={brandName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white text-brand font-extrabold text-2xl flex items-center justify-center">
                    {brandName?.charAt(0) || 'A'}
                  </div>
                )}
              </div>
            </div>

            {/* Judul & Subteks Dinamis Berdasarkan Status */}
            <div className="relative z-10 space-y-1">
              {(status === 'loading' || status === 'invalid') && (
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading drop-shadow-md">
                  Aktivasi Akun
                </h1>
              )}

              {status === 'valid' && (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading drop-shadow-md">
                    Halo, {namaLengkap}
                  </h1>
                  <p className="text-xs sm:text-sm text-white/95 font-medium drop-shadow-sm">
                    Langkah {step} dari 3
                  </p>
                </>
              )}

              {status === 'success' && (
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading drop-shadow-md">
                  Akun Aktif
                </h1>
              )}
            </div>
          </header>

          {/* Form Sheet: Full Width dengan Radius Sudut Kiri & Kanan Atas (Zona Bawah) */}
          <section className="w-full bg-white rounded-t-3xl sm:rounded-t-[2rem] -mt-6 relative z-10 px-6 sm:px-8 pt-7 pb-6 flex-1 flex flex-col justify-between shadow-xs">
            <div className="w-full max-w-[340px] mx-auto flex flex-col flex-1 justify-between">
              <div>
                {/* Alert Error Message */}
                {errorMessage && (
                  <p className="text-xs text-danger-600 font-medium mb-3">
                    {errorMessage}
                  </p>
                )}

                {/* 1. STATE LOADING */}
                {status === 'loading' && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <svg className="animate-spin h-8 w-8 text-brand mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-xs font-medium text-neutral-600">Memeriksa link aktivasi...</p>
                  </div>
                )}

                {/* 2. STATE INVALID */}
                {status === 'invalid' && (
                  <div className="text-center py-2 space-y-4">
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Link aktivasi tidak valid atau sudah kedaluwarsa. Hubungi admin travel Anda untuk mendapatkan link baru.
                    </p>
                    <Link href="/portal/login" className="block w-full">
                      <Button variant="primary" className="w-full py-2.5 text-sm font-semibold rounded-xl">
                        Ke Halaman Login
                      </Button>
                    </Link>
                  </div>
                )}

                {/* 3. STATE VALID — STEP 1: TANGGAL LAHIR */}
                {status === 'valid' && step === 1 && (
                  <form onSubmit={handleStep1Submit} className="space-y-4">
                    <div>
                      <label htmlFor="tanggal_lahir" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Tanggal Lahir
                      </label>
                      <input
                        id="tanggal_lahir"
                        type="date"
                        value={tanggalLahir}
                        onChange={(e) => setTanggalLahir(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all bg-neutral-50/40 focus:bg-white"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!tanggalLahir || isSubmitting}
                      className="w-full py-2.5 text-sm font-semibold rounded-xl mt-1 shadow-xs"
                    >
                      {isSubmitting ? 'Memverifikasi...' : 'Lanjut'}
                    </Button>
                  </form>
                )}

                {/* 3. STATE VALID — STEP 2: BUAT PIN PORTAL */}
                {status === 'valid' && step === 2 && (
                  <form onSubmit={handleStep2Submit} className="space-y-4">
                    <div>
                      <label htmlFor="portal_pin" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Buat PIN Portal
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
                            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                          </svg>
                        </div>
                        <input
                          id="portal_pin"
                          type={showPin ? 'text' : 'password'}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={portalPin}
                          onChange={handlePinChange}
                          placeholder="6 digit PIN"
                          required
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono bg-neutral-50/40 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none p-0.5 cursor-pointer"
                          aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                        >
                          {showPin ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={portalPin.length !== 6 || isSubmitting}
                      className="w-full py-2.5 text-sm font-semibold rounded-xl mt-1 shadow-xs"
                    >
                      Lanjut
                    </Button>

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

                {/* 3. STATE VALID — STEP 3: KONFIRMASI PIN */}
                {status === 'valid' && step === 3 && (
                  <form onSubmit={handleFinalSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="confirm_pin" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Konfirmasi PIN
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
                            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                          </svg>
                        </div>
                        <input
                          id="confirm_pin"
                          type={showConfirmPin ? 'text' : 'password'}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={confirmPin}
                          onChange={handleConfirmPinChange}
                          placeholder="6 digit PIN"
                          required
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono bg-neutral-50/40 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPin(!showConfirmPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none p-0.5 cursor-pointer"
                          aria-label={showConfirmPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                        >
                          {showConfirmPin ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
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

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!isMatch || isSubmitting}
                      className="w-full py-2.5 text-sm font-semibold rounded-xl mt-1 shadow-xs"
                    >
                      {isSubmitting ? 'Mengaktifkan...' : 'Aktifkan Akun'}
                    </Button>

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

                {/* 4. STATE SUCCESS */}
                {status === 'success' && (
                  <div className="text-center py-2 space-y-4">
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Akun Anda sudah aktif. Silakan masuk memakai PIN yang baru Anda buat.
                    </p>
                    <Link href="/portal/login" className="block w-full">
                      <Button variant="primary" className="w-full py-2.5 text-sm font-semibold rounded-xl">
                        Masuk ke Portal
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Kembali ke Halaman Login Link (Hanya tampil saat status valid) */}
              {status === 'valid' && (
                <div className="pt-6 text-center">
                  <Link
                    href="/portal/login"
                    className="inline-flex items-center justify-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Kembali ke Halaman Login</span>
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer Copyright */}
        <footer className="pt-6 pb-4 text-center border-t border-neutral-100 mt-auto px-6">
          <p className="text-[11px] text-neutral-400">
            &copy; {new Date().getFullYear()} {brandName}. Seluruh hak cipta dilindungi.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function PortalAktivasiPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh w-full flex items-center justify-center bg-white">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-brand mb-3" fill="none" viewBox="0 0 24 24">
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
