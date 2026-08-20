import React from 'react';

export const metadata = {
  title: 'Situs Tidak Ditemukan',
};

export default function BrandNotFoundPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full bg-white rounded-3xl shadow-sm border border-neutral-200 p-6 text-center">
        <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-neutral-800 mb-2">Situs Tidak Ditemukan</h1>
        <p className="text-neutral-600 text-sm mb-6">
          Domain yang Anda akses belum terdaftar atau tidak terhubung ke travel manapun.
        </p>
        <div className="text-xs text-neutral-400 border-t border-neutral-100 pt-4">
          ERP Azhan Grup • Multi-brand Platform
        </div>
      </div>
    </div>
  );
}
