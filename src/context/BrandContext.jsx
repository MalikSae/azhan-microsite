'use client';

import React, { createContext, useContext } from 'react';

const BrandContext = createContext({
  brandId: null,
  brandName: 'Travel Umroh',
  brandColor: '#B87A3A',
  brandLogo: '',
  brandWhatsapp: '',
});

export function BrandProvider({ value, children }) {
  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
