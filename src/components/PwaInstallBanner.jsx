'use client';

import { useEffect, useState } from 'react';

const isStandalone = () => (
  window.matchMedia?.('(display-mode: standalone)').matches
  || window.navigator.standalone === true
);

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export default function PwaInstallBanner({ brandName = 'Travel Umroh' }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);

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
    <aside className="border-b border-neutral-200 bg-brand-soft px-4 py-2.5 sm:px-6" aria-label="Install aplikasi">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </div>
        <p className="min-w-0 flex-1 text-xs leading-5 text-neutral-700 sm:text-sm">
          <span className="font-bold text-neutral-900">Pasang {brandName}</span>
          <span className="hidden sm:inline"> untuk akses lebih cepat seperti aplikasi.</span>
        </p>
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 sm:px-4"
        >
          {installPrompt ? 'Install' : 'Cara install'}
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Tutup banner install"
          className="shrink-0 rounded-md p-1 text-neutral-500 transition hover:bg-white/70 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {showHelp && (
        <div className="mx-auto mt-2 max-w-7xl rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs leading-5 text-neutral-700 shadow-sm sm:text-sm">
          {iosDevice ? (
            <p>Di iPhone/iPad: tekan tombol <strong>Bagikan</strong> di browser, lalu pilih <strong>Tambahkan ke Layar Utama</strong>.</p>
          ) : (
            <p>Buka menu browser (⋮), lalu pilih <strong>Install aplikasi</strong> atau <strong>Add to Home screen</strong>.</p>
          )}
        </div>
      )}
    </aside>
  );
}
