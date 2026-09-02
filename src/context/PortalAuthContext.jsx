'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { portalLogin, getMe } from '@/lib/portalApi';

const PortalAuthContext = createContext({
  jamaah: null,
  accessToken: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function PortalAuthProvider({ children }) {
  const [jamaah, setJamaah] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portal_access_token');
    }
    setAccessToken(null);
    setJamaah(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('portal_access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Decode JWT payload
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Token format invalid');
        }
        const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadStr);

        const isExpired = payload.exp && payload.exp < Date.now() / 1000;
        if (isExpired || payload.type !== 'portal') {
          throw new Error('Token expired');
        }

        setAccessToken(token);
        const me = await getMe();
        setJamaah(me);
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (brandId, idJamaah, portalPin) => {
    const data = await portalLogin(brandId, idJamaah, portalPin);
    if (typeof window !== 'undefined') {
      localStorage.setItem('portal_access_token', data.access_token);
    }
    setAccessToken(data.access_token);
    
    // Fetch full jamaah profile
    try {
      const me = await getMe();
      setJamaah(me);
    } catch {
      setJamaah(data.jamaah);
    }

    return data;
  };

  return (
    <PortalAuthContext.Provider value={{ jamaah, accessToken, isLoading, login, logout }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  return useContext(PortalAuthContext);
}
