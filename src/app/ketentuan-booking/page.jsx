import BookingTermsContent from '@/components/booking/BookingTermsContent';

export const metadata = { title: 'Ketentuan Pemesanan' };
export default function BookingTerms() {
  return <main className="max-w-2xl mx-auto p-6 space-y-5 text-base leading-relaxed">
    <h1 className="text-2xl font-bold">Ketentuan pemesanan online</h1>
    <BookingTermsContent />
  </main>;
}
