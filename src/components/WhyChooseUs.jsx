import React from 'react';

export default function WhyChooseUs({ brandName = 'Travel Umroh' }) {
  const points = [
    {
      title: 'Pasti Berangkat & Tiket Konfirm',
      desc: 'Setiap paket memiliki kejelasan maskapai, jadwal rute terencana, dan kepastian seat terisi sejak pendaftaran.',
      icon: (
        <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Hotel Pilihan Dekat Masjid',
      desc: 'Akomodasi Makkah dan Madinah dengan jarak terukur agar pelaksanaan ibadah sholat 5 waktu tetap ringan dan nyaman.',
      icon: (
        <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: 'Bimbingan Ibadah Sesuai Sunnah',
      desc: 'Didampingi pembimbing (Muthawif) bersertifikasi dan berpengalaman sejak proses manasik hingga tuntas beribadah.',
      icon: (
        <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-14 md:py-20 bg-white border-y border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-10">
        <div className="text-left md:text-center md:max-w-2xl md:mx-auto space-y-1.5">
          <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-brand block">
            Keunggulan Layanan
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-neutral-900 leading-snug">
            Mengapa Memilih {brandName}?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-lg mx-auto">
            Komitmen kami menghadirkan pengalaman ibadah umroh yang aman, nyaman, dan berkesan bagi seluruh jamaah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {points.map((point, idx) => (
            <div
              key={idx}
              className="p-6 md:p-7 bg-neutral-50/60 hover:bg-neutral-50 rounded-2xl md:rounded-3xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col items-start gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0 shadow-2xs">
                {point.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm md:text-base font-bold font-heading text-neutral-900 leading-snug">
                  {point.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {point.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}