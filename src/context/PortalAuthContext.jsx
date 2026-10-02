'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { portalLogin, portalLogout, getMe } from '@/lib/portalApi';
const PortalAuthContext = createContext({ jamaah: null, accessToken: null, isLoading: true });
export function PortalAuthProvider({ children }) {
  const [jamaah, setJamaah] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const clearSession = useCallback(() => {
    try { localStorage.removeItem('portal_access_token'); } catch {}
    try { Object.keys(sessionStorage).filter(k => k.startsWith('booking_draft_') || k.startsWith('booking_result_')).forEach(k => sessionStorage.removeItem(k)); } catch {}
    setAccessToken(null); setJamaah(null); setAuthError(null); setIsLoading(false);
  }, []);
  useEffect(() => {
    window.addEventListener('portal-session-expired', clearSession);
    return () => window.removeEventListener('portal-session-expired', clearSession);
  }, [clearSession]);
  useEffect(() => {
    let live = true;
    async function initialize() {
      setIsLoading(true); setAuthError(null);
      let token;
      try { token = localStorage.getItem('portal_access_token'); }
      catch { if (live) { setAuthError('Penyimpanan browser tidak tersedia. Izinkan penyimpanan situs lalu coba lagi.'); setIsLoading(false); } return; }
      if (!token) { if (live) setIsLoading(false); return; }
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.type !== 'portal' || !payload.exp || payload.exp <= Date.now() / 1000) { clearSession(); return; }
      } catch { clearSession(); return; }
      try { const me = await getMe(); if (live) { setAccessToken(token); setJamaah(me); } }
      catch (error) { if (live && error.status !== 401) setAuthError('Akun belum dapat dimuat. Periksa koneksi, lalu coba lagi.'); }
      finally { if (live) setIsLoading(false); }
    }
    initialize();
    return () => { live = false; };
  }, [attempt, clearSession]);
  useEffect(() => {
    if (!accessToken) return;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const timer = setTimeout(clearSession, Math.max(0, payload.exp * 1000 - Date.now()));
      return () => clearTimeout(timer);
    } catch { clearSession(); }
  }, [accessToken, clearSession]);
  const login = async (brandId, identifier, pin) => {
    const data = await portalLogin(brandId, identifier, pin);
    try { localStorage.setItem('portal_access_token', data.access_token); }
    catch { throw new Error('Penyimpanan browser tidak tersedia. Izinkan penyimpanan situs untuk masuk.'); }
    setAccessToken(data.access_token);
    try { setJamaah(await getMe()); } catch (error) { if (error.status === 401) throw error; setJamaah(data.jamaah); }
    return data;
  };
  const logout = async () => { await portalLogout(); clearSession(); };
  return <PortalAuthContext.Provider value={{ jamaah, accessToken, isLoading, login, logout }}>
    {authError ? <div role="alert" className="p-6 space-y-4 text-sm"><p>{authError}</p><button type="button" className="px-4 py-2 text-sm border rounded-xl" onClick={() => setAttempt(n => n + 1)}>Coba lagi</button></div> : children}
  </PortalAuthContext.Provider>;
}
export function usePortalAuth() { return useContext(PortalAuthContext); }
