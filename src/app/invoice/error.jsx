'use client';
export default function InvoiceError({ reset }) {
 return <main className="max-w-lg mx-auto p-6 space-y-4" role="alert"><h1 className="text-xl font-bold">Invoice belum dapat dimuat</h1><p>Periksa koneksi dan coba lagi. Gangguan ini tidak membatalkan pemesanan Anda.</p><button className="px-4 py-2 text-sm font-semibold rounded-lg bg-neutral-900 text-white" onClick={reset}>Coba lagi</button></main>;
}
