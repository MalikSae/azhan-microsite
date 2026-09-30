'use client';
export default function InvoiceError({ reset }) {
 return <main className="max-w-lg mx-auto p-6 space-y-4" role="alert"><h1 className="text-xl font-bold">Invoice belum dapat dimuat</h1><p>Periksa koneksi dan coba lagi. Gangguan ini tidak membatalkan pemesanan Anda.</p><button className="min-h-11 px-4 rounded-lg bg-neutral-900 text-white" onClick={reset}>Coba lagi</button></main>;
}
