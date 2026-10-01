'use client';
import { useEffect } from 'react';
import useDialogFocus from './useDialogFocus';

export default function PortalDialog({ open, onClose, title, children, busy = false }) {
  const ref = useDialogFocus(open);
  useEffect(() => {
    if (!open) return;
    const close = event => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open, busy, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-neutral-950/60 flex items-center justify-center p-4">
    <section ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="w-full max-w-lg max-h-full overflow-y-auto rounded-2xl bg-white p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between gap-3"><h2 className="text-base sm:text-lg font-bold">{title}</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Tutup dialog" className="px-4 py-2 text-sm border rounded-xl">Tutup</button></div>
      {children}
    </section>
  </div>;
}
