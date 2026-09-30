import { TERMS_VERSION } from '@/lib/checkoutPolicy.mjs';

export const metadata = { title: 'Ketentuan Pemesanan' };
export default function BookingTerms() {
  return <main className="max-w-2xl mx-auto p-6 space-y-5 text-base leading-relaxed">
    <h1 className="text-2xl font-bold">Ketentuan pemesanan online</h1>
    <p>Versi {TERMS_VERSION}. Ringkasan harga dan ketentuan pembayaran dicatat saat pemesanan disetujui.</p>
    <ol className="list-decimal pl-6 space-y-4">
      <li>Data jamaah harus sesuai identitas. Infant berusia di bawah dua tahun pada tanggal keberangkatan dan tidak mengambil kursi reguler. Hubungi admin untuk koreksi identitas.</li>
      <li>Reservasi awal menahan kursi selama 24 jam. Minimum pembayaran mengikuti ringkasan pemesanan. DP nol berarti tidak ada minimum nominal, bukan perjalanan gratis; reservasi tetap sementara sampai ada pembayaran yang diverifikasi.</li>
      <li>Untuk keberangkatan lebih dari 45 hari lagi, batas pelunasan adalah H-45. Untuk keberangkatan dalam 45 hari, pelunasan penuh diperlukan sebelum reservasi awal berakhir. Pendaftaran online ditutup kurang dari 14 hari sebelum keberangkatan.</li>
      <li>Bukti transfer yang diterima sebelum batas reservasi memberi satu tambahan waktu verifikasi, maksimal 24 jam setelah batas awal. Mengunggah bukti bukan konfirmasi pembayaran. Hubungi admin bila verifikasi belum selesai; setelah batas tambahan habis, ketersediaan kursi harus diperiksa kembali.</li>
      <li>Jika harga berubah sebelum pemesanan disimpan, Anda harus memeriksa dan menyetujui ringkasan terbaru. Jangan mentransfer untuk reservasi batal atau kedaluwarsa sebelum admin memastikan ketersediaan.</li>
      <li>Pembatalan, penggantian jamaah, serta pengembalian dana ditangani admin berdasarkan komponen layanan yang telah dipesan dan ketentuan tertulis travel. Halaman ini tidak menjanjikan pengembalian dana otomatis atau menetapkan biaya pembatalan. Minta rincian tertulis sebelum transfer bila membutuhkan kepastian.</li>
      <li>PIC menjadi kontak utama rombongan. Untuk booking oleh agen atau PIC tanpa PIN, admin membantu melengkapi tanggal lahir dan memberikan link aktivasi sebelum akses portal. Bukti transfer juga dapat disampaikan kepada admin melalui kontak resmi travel.</li>
      <li>Tautan invoice bersifat pribadi. Bagikan hanya kepada pihak yang memerlukan. Draf pada perangkat bersifat opsional, berlaku 30 menit, dan tidak menyimpan PIN.</li>
    </ol>
  </main>;
}
