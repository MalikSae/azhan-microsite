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
  const imageUrl = !iconFailed
    ? brandIconUrl
    : (brandLogoUrl && !logoFailed ? brandLogoUrl : '');

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
    <aside className="border-b border-neutral-200 bg-brand-soft px-3 py-2.5 md:hidden" aria-label="Install aplikasi">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white" aria-hidden="true">
          {!imageUrl ? (
            <svg viewBox="0 0 24 24" className="size-5 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          ) : (
            <img
              src={imageUrl}
              alt=""
              className="size-full object-contain"
              onError={() => {
                if (!iconFailed) setIconFailed(true);
                else setLogoFailed(true);
              }}
            />
          )}
        </div>
        <p className="line-clamp-2 min-w-0 text-pretty text-xs font-semibold leading-4 text-neutral-800">
          Akses jadwal dan booking lebih praktis.
        </p>
        <button
          type="button"
          onClick={handleInstall}
          className="min-h-11 shrink-0 rounded-lg bg-brand px-4 text-xs font-bold text-white transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          Install
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
