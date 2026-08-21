'use client';

import React, { useState } from 'react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Bagaimana cara mendaftar dan memesan paket umroh?',
      a: 'Pilih paket yang diinginkan pada katalog, lalu klik tombol "Booking & Konsultasi" untuk terhubung langsung dengan tim representatif kami melalui WhatsApp atau langsung login melalui Portal Jamaah.'
    },
    {
      q: 'Berapa besaran DP dan bagaimana sistem pelunasannya?',
      a: 'Pendaftaran cukup dengan setoran DP (sesuai ketentuan paket). Pelunasan dapat dilakukan secara bertahap dan fleksibel maksimal 30 hari sebelum jadwal keberangkatan.'
    },
    {
      q: 'Apa saja dokumen yang diperlukan untuk pendaftaran?',
      a: 'Dokumen utama mencakup Paspor asli dengan masa berlaku minimal 8 bulan, KTP, Kartu Keluarga, dan Buku Nikah (bagi suami-istri).'
    },
    {
      q: 'Apakah bisa memilih tipe kamar (Double / Triple / Quad)?',
      a: 'Tentu. Kami menyediakan pilihan kamar Quad (sekamar ber-4), Triple (sekamar ber-3), dan Double (sekamar ber-2) yang dapat Anda sesuaikan saat proses booking.'
    }
  ];

  return (
    <section className="py-14 md:py-20 bg-white border-t border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-10">
        <div className="text-left md:text-center md:max-w-2xl md:mx-auto space-y-1.5">
          <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-brand block">
            Informasi Praktis
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-neutral-900 leading-snug">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-lg mx-auto">
            Jawaban seputar pendaftaran, dokumen perjalanan, dan fasilitas ibadah umroh.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-neutral-50/60 rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden transition-all hover:border-neutral-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-neutral-900 select-none cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <svg
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-200/50 mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}