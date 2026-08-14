import React from 'react';

export const metadata = {
  title: 'Situs Tidak Ditemukan',
};

export default function BrandNotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Situs Tidak Ditemukan</h1>
        <p className="text-slate-600 text-sm mb-6">
          Domain yang Anda akses belum terdaftar atau tidak terhubung ke travel manapun.
        </p>
        <div className="text-xs text-slate-400 border-t border-slate-100 pt-4">
          ERP Azhan Grup • Multi-brand Platform
        </div>
      </div>
    </div>
  );
}
