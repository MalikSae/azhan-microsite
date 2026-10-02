'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import { usePortalAuth } from '@/context/PortalAuthContext';
import Turnstile from '@/components/ui/Turnstile';

// Screen A0 — daftar akun untuk calon Agen Syiar yang belum punya akun jamaah
// (agen-azhan.md 3.6.2). Setelah akun dibuat, pemohon langsung masuk ke portal
// dan melanjutkan ke Lengkapi Data Agen.

const inputClass =
  'w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all bg-neutral-50/40 focus:bg-white';

const onlyDigits = (value) => value.replace(/\D/g, '').slice(0, 6);

export default function DaftarAgenPage() {
  const router = useRouter();
  const { brandId, brandName } = useBrand();
  const { jamaah, isLoading, login } = usePortalAuth();

  const [namaLengkap, setNamaLengkap] = useState('');
  const [noHp, setNoHp] = useState('');
  const [pin, setPin] = useState('');
  const [pinKonfirmasi, setPinKonfirmasi] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [nomorTerdaftar, setNomorTerdaftar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sudah login: ajukan keagenan langsung dari menu Syiar.
  useEffect(() => {
    if (!isLoading && jamaah && !isSubmitting) router.replace('/portal/syiar');
  }, [isLoading, jamaah, isSubmitting, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setNomorTerdaftar(false);

    const nama = namaLengkap.trim();
    const hp = noHp.trim();
    if (nama.length < 2) {
      setErrorMessage('Nama lengkap wajib diisi');
      return;
    }
    if (hp.replace(/\D/g, '').length < 9) {
      setErrorMessage('Nomor WhatsApp tidak valid');
      return;
    }
    if (pin.length !== 6) {
      setErrorMessage('PIN harus 6 digit angka');
      return;
    }
    if (pin !== pinKonfirmasi) {
      setErrorMessage('Konfirmasi PIN tidak sama');
      return;
    }
    if (!captchaToken) {
      setErrorMessage('Selesaikan verifikasi keamanan terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/public/agen/daftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: Number(brandId),
          nama_lengkap: nama,
          no_hp: hp,
          portal_pin: pin,
          captcha_token: captchaToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Token Turnstile sekali pakai.
        turnstileRef.current?.reset();
        if (res.status === 409) setNomorTerdaftar(true);
        setErrorMessage(data.error || 'Pendaftaran gagal, silakan coba lagi');
        setIsSubmitting(false);
        return;
      }

      await login(brandId, hp, pin);
      router.replace('/portal/syiar/kelengkapan-agen');
    } catch (err) {
      turnstileRef.current?.reset();
      setErrorMessage(err.message || 'Pendaftaran gagal, silakan coba lagi');
      setIsSubmitting(false);
    }
  };

  if (isLoading || (jamaah && !isSubmitting)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm text-neutral-500 font-medium">
        Memuat...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#EEF2F6] pb-20 md:pb-6">
      <div className="max-w-md mx-auto min-h-screen bg-white border-x border-neutral-100 shadow-2xl shadow-neutral-300/30 flex flex-col">
        <header className="px-6 pt-8 pb-5 border-b border-neutral-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Agen Syiar {brandName}</p>
          <h1 className="mt-1 text-xl font-bold text-neutral-900 font-heading">Daftar Jadi Agen</h1>
          <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
            Buat akun terlebih dahulu. Setelah itu lengkapi data agen, lalu Admin Travel akan meninjau pengajuan Anda.
          </p>
        </header>

        <section className="px-6 py-6 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-[340px] mx-auto">
            <div>
              <label htmlFor="nama_lengkap" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Nama Lengkap
              </label>
              <input
                id="nama_lengkap"
                type="text"
                autoComplete="name"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                placeholder="Sesuai KTP"
                maxLength={150}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="no_hp" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Nomor WhatsApp
              </label>
              <input
                id="no_hp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="081234567890"
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pin" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  PIN Portal
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="new-password"
                  value={pin}
                  onChange={(e) => setPin(onlyDigits(e.target.value))}
                  placeholder="6 digit"
                  required
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label htmlFor="pin_konfirmasi" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Ulangi PIN
                </label>
                <input
                  id="pin_konfirmasi"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="new-password"
                  value={pinKonfirmasi}
                  onChange={(e) => setPinKonfirmasi(onlyDigits(e.target.value))}
                  placeholder="6 digit"
                  required
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 -mt-1">PIN dipakai untuk masuk ke Portal Jamaah.</p>

            <Turnstile ref={turnstileRef} onToken={setCaptchaToken} action="daftar_agen" />

            {errorMessage && (
              <div className="text-xs text-danger-600 font-medium">
                <p>{errorMessage}</p>
                {nomorTerdaftar && (
                  <Link href="/portal/login" className="mt-1 inline-block font-semibold text-brand underline">
                    Masuk ke portal
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !captchaToken}
              className="w-full py-3 px-4 text-sm font-bold text-white bg-brand rounded-2xl hover:brightness-105 active:brightness-95 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Memproses...' : 'Daftar & Lanjutkan'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-500">
            Sudah punya akun?{' '}
            <Link href="/portal/login" className="font-semibold text-brand">
              Masuk
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
