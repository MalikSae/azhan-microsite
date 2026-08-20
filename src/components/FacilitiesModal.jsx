'use client';

import { useEffect } from 'react';

function FacilityList({ items, variant }) {
  const isIncluded = variant === 'included';

  return (
    <ul className="space-y-1.5" role="list">
      {items.map((item, index) => (
        <li
          key={`${variant}-${index}-${item}`}
          className={`flex items-start gap-1.5 rounded-lg border p-2 text-[11px] ${
            isIncluded
              ? 'border-success-200 bg-success-50 text-success-900'
              : 'border-neutral-200 bg-neutral-50 text-neutral-700'
          }`}
        >
          <span
            className={`mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
              isIncluded ? 'bg-success-600 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
            aria-hidden="true"
          >
            {isIncluded ? '✓' : '–'}
          </span>
          <span className="leading-4">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function FacilitiesModal({ packageName, includeItems = [], excludeItems = [], isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const included = Array.isArray(includeItems) ? includeItems.filter(Boolean) : [];
  const excluded = Array.isArray(excludeItems) ? excludeItems.filter(Boolean) : [];
  const hasFacilities = included.length > 0 || excluded.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="facilities-title"
        className="flex max-h-[92dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
          <div className="min-w-0">
            <h2 id="facilities-title" className="text-lg font-bold text-neutral-900">Fasilitas Paket</h2>
            <p className="truncate text-xs text-neutral-500">{packageName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup fasilitas paket"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="grow overflow-y-auto overscroll-contain p-3 pb-5">
          {!hasFacilities ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center">
              <p className="font-semibold text-neutral-800">Fasilitas belum tersedia</p>
              <p className="mt-1 text-sm text-neutral-500">Hubungi admin travel untuk rincian fasilitas paket.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 items-start gap-2.5">
              <section aria-labelledby="excluded-title" className="order-2 min-w-0">
                <div className="mb-2 min-h-10 border-b border-neutral-200 pb-2">
                  <h3 id="excluded-title" className="text-xs font-bold leading-4 text-neutral-900">Belum Termasuk</h3>
                  <span className="text-[10px] font-semibold text-neutral-500">{excluded.length} item</span>
                </div>
                {excluded.length > 0 ? (
                  <FacilityList items={excluded} variant="excluded" />
                ) : (
                  <p className="rounded-lg bg-neutral-50 p-2 text-[11px] text-neutral-500">Tidak ada item.</p>
                )}
              </section>

              <section aria-labelledby="included-title" className="order-1 min-w-0">
                <div className="mb-2 min-h-10 border-b border-success-200 pb-2">
                  <h3 id="included-title" className="text-xs font-bold leading-4 text-neutral-900">Sudah Termasuk</h3>
                  <span className="text-[10px] font-semibold text-success-700">{included.length} fasilitas</span>
                </div>
                {included.length > 0 ? (
                  <FacilityList items={included} variant="included" />
                ) : (
                  <p className="rounded-lg bg-neutral-50 p-2 text-[11px] text-neutral-500">Belum ada fasilitas.</p>
                )}
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
