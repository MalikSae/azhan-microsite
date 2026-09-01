"use client";
import { useEffect, useRef } from 'react';

export default function Turnstile({ siteKey, onVerify, theme = 'light' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    // For MVP/Local testing, if siteKey is missing or dummy, we mock it.
    if (!siteKey || siteKey === 'dummy-key') {
      console.log('Turnstile mock: auto verifying');
      const timer = setTimeout(() => {
        if (onVerify) onVerify('dummy-turnstile-token-12345');
      }, 500);
      return () => clearTimeout(timer);
    }

    // Real Turnstile initialization
    const loadTurnstile = () => {
      if (window.turnstile && containerRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          theme: theme,
        });
      }
    };

    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = loadTurnstile;
      document.head.appendChild(script);
    } else {
      loadTurnstile();
    }

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey, theme, onVerify]);

  return <div ref={containerRef}></div>;
}
