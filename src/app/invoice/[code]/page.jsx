import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import DigitalInvoiceView from '@/components/invoice/DigitalInvoiceView';
import { clientIpHeaders } from '@/lib/forwardClientIp';

// cache(): generateMetadata dan halaman memakai hasil yang sama dalam satu
// request, jadi API hanya dipanggil sekali per kunjungan.
const getInvoice = cache(async (code) => {
  if (!code) return null;
  const requestHeaders = await headers();
  const brandId = requestHeaders.get('x-brand-id');
  const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  try {
    const res = await fetch(`${baseUrl}/api/public/invoice/${encodeURIComponent(code)}?brand=${encodeURIComponent(brandId)}`, {
      cache: 'no-store',
      headers: clientIpHeaders(await headers()),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Invoice belum dapat dimuat. Silakan coba lagi.');
    const data = await res.json();
    return Number(data.brand?.id) === Number(brandId) ? data : null;
  } catch (err) {
    throw new Error('Invoice belum dapat dimuat. Silakan coba lagi.');
  }
});

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const invoice = await getInvoice(resolvedParams.code);
  if (!invoice) {
    return { title: 'Invoice Tidak Ditemukan', robots: { index: false, follow: false }, referrer: 'no-referrer' };
  }
  return {
    title: `Invoice #${invoice.booking_code} - ${invoice.brand?.name || 'ERP Azhan'}`,
    description: 'Dokumen pemesanan pribadi.',
    robots: { index: false, follow: false, noarchive: true, googleBot: { index: false, follow: false } },
    referrer: 'no-referrer',
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
