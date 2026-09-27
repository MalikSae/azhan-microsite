'use client';

import React, { useState } from 'react';

// Daftar rekening resmi brand dengan tombol salin nomor rekening.
// Dipakai halaman pembayaran booking dan pembayaran pendaftaran agen Syiar.
export default function BankAccountList({ accounts = [] }) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  if (!accounts || accounts.length === 0) {
    return (
      <div className="py-2 text-xs text-neutral-400 text-center">
        Rekening resmi travel belum diatur.
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100">
      {accounts.map((acc, i) => {
        const accLogo = acc.logo_url
          ? (acc.logo_url.startsWith('http') ? acc.logo_url : `${apiBaseUrl}${acc.logo_url}`)
          : null;

        return (
          <div
            key={acc.id || i}
            className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {accLogo ? (
                <div className="w-12 h-7 sm:w-14 sm:h-8 bg-white border border-neutral-200/80 rounded-lg p-1 flex items-center justify-center shrink-0 shadow-2xs">
                  <img
                    src={accLogo}
                    alt={acc.bank_name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white text-[9px] font-bold uppercase tracking-wider shrink-0">
                  {acc.bank_name}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-mono font-bold text-sm sm:text-base text-neutral-900 tracking-wide select-all truncate block leading-tight">
                  {acc.account_number}
                </span>
                <p className="text-[11px] text-neutral-500 font-medium mt-0.5 truncate leading-tight">
                  a.n. {acc.account_holder}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(acc.account_number, `acc-${i}`)}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10.5px] font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              {copiedKey === `acc-${i}` ? (
                <span className="text-success-700 font-bold">Tersalin!</span>
              ) : (
                <span>Salin</span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
