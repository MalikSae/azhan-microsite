'use client';

import { useEffect, useState } from 'react';

const isStandalone = () => (
  window.matchMedia?.('(display-mode: standalone)').matches
  || window.navigator.standalone === true
);

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export default function PwaInstallBanner({ brandName = 'Travel Umroh', brandId = 'default', brandLogoUrl = '' }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const brandIconUrl = `/brand-icon?brand=${encodeURIComponent(brandId)}`;
  const imageUrl = brandLogoUrl && !logoFailed ? brandLogoUrl : brandIconUrl;

  useEffect(() => {
    if (isStandalone()) return undefined;

    setVisible(true);
    setIosDevice(isIos());

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setVisible(false);
      setShowHelp(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowHelp(true);
      return;
    }

    const result = await installPrompt.prompt();
    if (result?.outcome === 'accepted') setVisible(false);
    setInstallPrompt(null);
  };

  return (
    <aside className="border-b border-neutral-200 bg-brand-soft px-4 py-3 sm:px-6 md:hidden" aria-label="Install aplikasi">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
        <div className="flex h-11 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white px-2 py-1.5 shadow-sm sm:h-12 sm:w-24" aria-hidden="true">
          {iconFailed ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          ) : (
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-contain"
              onError={() => {
                if (brandLogoUrl && !logoFailed) setLogoFailed(true);
                else setIconFailed(true);
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold leading-5 text-neutral-900 sm:text-sm">
            Install {brandName}, lebih praktis
          </p>
          <p className="text-[11px] leading-4 text-neutral-600 sm:text-xs sm:leading-5">
            Cek jadwal, booking, dan info perjalanan lebih cepat—cukup satu ketukan.
          </p>
          <div className="mt-1 hidden items-center gap-2 text-[10px] font-semibold text-brand sm:flex">
            <span>Akses 1 ketukan</span>
            <span className="text-neutral-300">•</span>
            <span>Tampilan seperti aplikasi</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="basis-full rounded-lg bg-brand px-3 py-2 text-[11px] font-bold text-white transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 sm:basis-auto sm:px-4 sm:text-xs"
        >
          {installPrompt ? 'Install sekarang' : 'Lihat cara install'}
        </button>
      </div>

      {showHelp && (
        <div className="mx-auto mt-2 max-w-7xl rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs leading-5 text-neutral-700 shadow-sm sm:text-sm">
          {iosDevice ? (
            <p>Install gratis dalam beberapa detik: tekan <strong>Bagikan</strong> di browser, lalu pilih <strong>Tambahkan ke Layar Utama</strong>.</p>
          ) : (
            <p>Install gratis: buka menu browser (⋮), pilih <strong>Install aplikasi</strong> atau <strong>Add to Home screen</strong>, lalu akses {brandName} langsung dari ikon.</p>
          )}
        </div>
      )}
    </aside>
  );
}
