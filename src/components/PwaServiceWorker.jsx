'use client';

import { useEffect } from 'react';

export default function PwaServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      // PWA bersifat progressive: kegagalan registrasi tidak boleh mengganggu situs.
      console.warn('[PWA] Service worker gagal didaftarkan:', error);
    });
  }, []);

  return null;
}
