'use client';

export default function PackageError({ reset }) {
  return <main className="mx-auto max-w-xl p-6" role="alert">
    <h1 className="text-xl font-bold">Paket belum dapat dimuat</h1>
    <p className="my-3">Layanan sedang bermasalah. Silakan coba lagi atau hubungi admin travel.</p>
    <button onClick={reset} className="min-h-11 rounded-xl bg-brand px-4 text-white">Coba lagi</button>
  </main>;
}
