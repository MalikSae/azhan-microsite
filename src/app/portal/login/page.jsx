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
      setErrorMessage('Nomor WhatsApp atau ID Jamaah wajib diisi');
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
      setErrorMessage(err.message || 'Nomor WhatsApp atau PIN tidak cocok');
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

  const inputClass = 'h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-60';

  return (
    <main className="min-h-dvh bg-[#EEF2F6]">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white border-x border-neutral-100">
        <header className="sticky top-0 z-30 flex h-[54px] shrink-0 items-center gap-2.5 border-b border-neutral-100 bg-white/95 px-4 backdrop-blur-md">
          <Link href="/" aria-label="Kembali ke beranda" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
          </Link>
          {fullIconUrl ? <img src={fullIconUrl} alt="" className="h-8 w-8 shrink-0 rounded-xl object-contain" /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-light font-bold text-brand">{brandName?.charAt(0) || 'A'}</span>}
          <div className="min-w-0"><p className="truncate text-sm font-bold text-neutral-900">{brandName}</p><p className="text-[10px] text-neutral-500">Portal Jamaah</p></div>
        </header>

        <section className="flex-1 px-5 py-8 sm:px-6" aria-labelledby="login-title">
          <div className="mb-7">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8m8 0l2 2 3-3" /></svg>
            </span>
            <h1 id="login-title" className="text-2xl font-bold tracking-tight text-neutral-900">Masuk ke akun Anda</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">Pantau perjalanan, pembayaran, dan informasi jamaah dalam satu tempat.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isSubmitting}>
            <div className="space-y-2">
              <label htmlFor="login-identifier" className="block text-sm font-semibold text-neutral-800">Nomor WhatsApp atau ID Jamaah</label>
              <input id="login-identifier" name="identifier" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required disabled={isSubmitting}
                value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Contoh: 081234567890" className={inputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="login-pin" className="block text-sm font-semibold text-neutral-800">PIN akun</label>
              <div className="relative">
                <input id="login-pin" name="pin" type={showPin ? 'text' : 'password'} inputMode="numeric" autoComplete="current-password" pattern="[0-9]{6}" maxLength={6} required disabled={isSubmitting}
                  value={pin} onChange={handlePinChange} placeholder="Masukkan 6 digit PIN" aria-describedby="pin-hint" className={`${inputClass} pr-24`} />
                <button type="button" onClick={() => setShowPin(!showPin)} aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'} aria-pressed={showPin}
                  className="absolute right-1 top-0 flex h-12 items-center px-3 text-xs font-semibold text-neutral-600 focus-visible:outline-brand">{showPin ? 'Sembunyikan' : 'Tampilkan'}</button>
              </div>
              <p id="pin-hint" className="text-xs text-neutral-500">Gunakan PIN yang dibuat saat aktivasi akun.</p>
            </div>
            {errorMessage && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}
            <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-bold text-white transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Sedang masuk...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-7 border-t border-neutral-100 pt-5">
            <h2 className="text-sm font-semibold text-neutral-800">Belum punya PIN atau lupa PIN?</h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">Hubungi admin untuk bantuan akses atau mendapatkan link aktivasi akun.</p>
            {cleanWhatsapp && <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand">Hubungi admin via WhatsApp <span aria-hidden="true">↗</span></a>}
          </div>
        </section>
        <footer className="px-5 pb-6 pt-3 text-center text-xs text-neutral-400">© {new Date().getFullYear()} {brandName}</footer>
      </div>
    </main>
  );
}
