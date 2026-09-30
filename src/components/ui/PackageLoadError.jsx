'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function PackageLoadError() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4">
    <p>Daftar paket gagal dimuat. Filter Anda tetap tersimpan.</p>
    <button disabled={pending} onClick={() => startTransition(() => router.refresh())}
      className="mt-3 min-h-11 rounded-lg bg-brand px-4 text-white disabled:opacity-50">
      {pending ? 'Memuat...' : 'Coba lagi'}
    </button>
  </div>;
}
