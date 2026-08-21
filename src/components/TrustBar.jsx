import React from 'react';

export default function TrustBar() {
  const trustItems = [
    {
      title: 'Kepastian Berangkat',
      desc: 'Jadwal, tiket, dan visa 100% pasti terjamin.',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          <circle cx="13" cy="13" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: 'Layanan Jamaah 24/7',
      desc: 'Siaga membantu Anda kapan pun dan di mana pun.',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zm-18 0a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" />
        </svg>
      ),
    },
    {
      title: 'Transaksi Aman & Terpercaya',
      desc: 'Legalitas resmi PPIU Kemenag & pembayaran aman.',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Fasilitas & Muthawif Pilihan',
      desc: 'Hotel nyaman dekat masjid & bimbingan sunnah.',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="mt-10 md:mt-14 mb-8 md:mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-neutral-200/90 items-center">
        {trustItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3.5 sm:gap-4 py-3.5 sm:py-2 lg:py-0 px-0 sm:px-4 lg:px-6 first:lg:pl-0 last:lg:pr-0"
          >
            {/* Circular Icon Container dengan Warna Brand Light yang jelas */}
            <div className="w-12 h-12 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0 shadow-2xs">
              {item.icon}
            </div>

            {/* Text Block */}
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 font-heading leading-snug truncate">
                {item.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-500 leading-normal mt-0.5 line-clamp-2">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}