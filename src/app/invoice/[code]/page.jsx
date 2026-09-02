import { notFound } from 'next/navigation';
import DigitalInvoiceView from '@/components/invoice/DigitalInvoiceView';

async function getInvoice(code) {
  if (!code) return null;
  const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  try {
    const res = await fetch(`${baseUrl}/api/public/invoice/${encodeURIComponent(code)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const invoice = await getInvoice(resolvedParams.code);
  if (!invoice) {
    return { title: 'Invoice Tidak Ditemukan' };
  }
  return {
    title: `Invoice #${invoice.booking_code} - ${invoice.brand?.name || 'ERP Azhan'}`,
    description: `Invoice resmi pemesanan paket ${invoice.schedule?.jadwal_nama} a.n. ${invoice.pic?.nama_lengkap}`,
  };
}

export default async function InvoicePage({ params }) {
  const resolvedParams = await params;
  const invoice = await getInvoice(resolvedParams.code);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white text-neutral-800">
      <DigitalInvoiceView invoice={invoice} />
    </div>
  );
}
