'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Widget Cloudflare Turnstile. Token dikirim ke parent lewat onToken; token
// kosong ('') berarti belum lolos, kedaluwarsa, atau error. Token hanya bisa
// dipakai sekali, jadi parent memanggil ref.reset() setelah submit gagal.
//
// Tanpa NEXT_PUBLIC_TURNSTILE_SITE_KEY:
// - development: token 'dev-turnstile-token' (backend tanpa TURNSTILE_SECRET_KEY
//   menerimanya), supaya pengembangan lokal tidak butuh Cloudflare;
// - production: tidak ada token sama sekali dan pesan konfigurasi tampil,
//   sehingga salah konfigurasi langsung terlihat, bukan diam-diam lolos.

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const DEV_TOKEN = 'dev-turnstile-token';

let scriptPromise = null;
function loadScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Turnstile gagal dimuat'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

const Turnstile = forwardRef(function Turnstile(
  { onToken, action, siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenRef = useRef(onToken);
  const [loadError, setLoadError] = useState(false);
  const devMode = !siteKey && process.env.NODE_ENV !== 'production';

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reset() {
      if (devMode) return;
      onTokenRef.current?.('');
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }), [devMode]);

  useEffect(() => {
    if (!siteKey) {
      onTokenRef.current?.(devMode ? DEV_TOKEN : '');
      return undefined;
    }
    let cancelled = false;
    loadScript()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: 'light',
          callback: (token) => onTokenRef.current?.(token),
          'expired-callback': () => onTokenRef.current?.(''),
          'error-callback': () => onTokenRef.current?.(''),
        });
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, action, devMode]);

  if (!siteKey) {
    return devMode ? (
      <p className="text-[11px] text-neutral-400">Verifikasi keamanan nonaktif (mode pengembangan).</p>
    ) : (
      <p className="text-xs text-danger-700">Verifikasi keamanan belum dikonfigurasi. Silakan hubungi admin.</p>
    );
  }

  return (
    <div className="min-h-[65px]">
      <div ref={containerRef} />
      {loadError && (
        <p className="text-xs text-danger-700">Verifikasi keamanan gagal dimuat. Periksa koneksi lalu muat ulang halaman.</p>
      )}
    </div>
  );
});

export default Turnstile;
