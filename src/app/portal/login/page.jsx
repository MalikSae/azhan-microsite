'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import { usePortalAuth } from '@/context/PortalAuthContext';

export default function PortalLoginPage() {
  const router = useRouter();
  const { brandId, brandName, brandLogo, brandIcon, brandWhatsapp } = useBrand();
  const { jamaah, isLoading, login } = usePortalAuth();

  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && jamaah) {
      router.replace('/portal');
    }
  }, [isLoading, jamaah, router]);

  const handlePinChange = (e) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 6);
    setPin(digitsOnly);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      setErrorMessage('ID Jamaah atau No. WhatsApp wajib diisi');
      return;
    }

    if (pin.length !== 6) {
      setErrorMessage('PIN harus 6 digit angka');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(brandId, cleanIdentifier, pin);
      router.push('/portal');
    } catch (err) {
      setErrorMessage(err.message || 'ID jamaah, nomor WhatsApp, atau PIN tidak cocok');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || jamaah) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm text-neutral-500 font-medium">
        Memuat...
      </div>
    );
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const targetIcon = brandIcon || brandLogo;
  const fullIconUrl = targetIcon ? (targetIcon.startsWith('http') ? targetIcon : `${apiBaseUrl}${targetIcon}`) : null;

  const cleanWhatsapp = (brandWhatsapp || '').replace(/[^0-9]/g, '');
  const waUrl = cleanWhatsapp
    ? cleanWhatsapp.startsWith('0')
      ? `https://wa.me/62${cleanWhatsapp.slice(1)}`
      : `https://wa.me/${cleanWhatsapp}`
    : '#';

  return (
    <div className="min-h-dvh w-full bg-white sm:bg-neutral-100 flex justify-center items-center overflow-x-hidden">
      {/* Frame Kontainer Utama */}
      <div className="w-full max-w-[420px] min-h-dvh sm:max-h-[920px] bg-white sm:border-x sm:border-neutral-200/80 sm:shadow-lg flex flex-col justify-between overflow-hidden">
        {/* Konten Atas & Form */}
        <div className="flex flex-col flex-1">
          {/* Header Image Ka'bah */}
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
                  <div className="w-full h-full bg-brand text-white font-extrabold text-2xl flex items-center justify-center">
                    {brandName?.charAt(0) || 'A'}
                  </div>
                )}
              </div>
            </div>

            {/* Judul & Subteks */}
            <div className="relative z-10 space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading drop-shadow-md">
                Selamat Datang
              </h1>
              <p className="text-xs sm:text-sm text-white/95 font-medium drop-shadow-sm">
                Di Portal Jamaah {brandName}
              </p>
            </div>
          </header>

          {/* Form Sheet: Full Width dengan Radius Sudut Kiri & Kanan Atas */}
          <section className="w-full bg-white rounded-t-3xl sm:rounded-t-[2rem] -mt-6 relative z-10 px-6 sm:px-8 pt-7 pb-6 flex-1 flex flex-col justify-between shadow-xs">
            <div className="w-full max-w-[340px] mx-auto flex flex-col">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Field 1: ID Jamaah dengan Icon User */}
                <div>
                  <label htmlFor="identifier" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    ID Jamaah atau No. WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="HN-2608000001"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all bg-neutral-50/40 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Field 2: PIN Portal dengan Icon Key-Round & Toggle Password */}
                <div>
                  <label htmlFor="pin" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    PIN Portal
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
                        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                      </svg>
                    </div>
                    <input
                      id="pin"
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={pin}
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

                {errorMessage && (
                  <p className="text-xs text-danger-600 font-medium pt-0.5">
                    {errorMessage}
                  </p>
                )}

                {/* Tombol Login Timbul dengan Efek Gradient Ringan & Panah */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(180deg, var(--brand-primary, #990000) 0%, color-mix(in srgb, var(--brand-primary, #990000) 78%, black) 100%)',
                  }}
                  className="w-full py-3 px-4 text-sm font-bold text-white rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.32),0_4px_14px_rgba(0,0,0,0.2)] hover:brightness-105 active:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <svg className="w-4 h-4 text-white/90 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* CTA Bantuan WhatsApp & Navigasi Kembali ke Home */}
              <div className="pt-6 text-center space-y-3.5">
                <a
                  href={waUrl}
                  target={cleanWhatsapp ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current text-[#25D366]" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                  <span>Butuh bantuan? Hubungi kami via WhatsApp</span>
                </a>

                <div>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 transition-colors py-1 font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Kembali ke Beranda</span>
                  </Link>
                </div>
              </div>
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
