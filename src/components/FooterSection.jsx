import React from 'react';
import Link from 'next/link';

export default function FooterSection({ brandName = 'Travel Umroh', brandWhatsapp = '', fullLogoUrl = '' }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-neutral-600">
          {/* Kolom 1: Profil Brand */}
          <div className="space-y-3.5">
            {fullLogoUrl ? (
              <img
                src={fullLogoUrl}
                alt={`${brandName} Logo`}
                className="h-9 max-w-[190px] w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-base shadow-xs">
                  {brandName.charAt(0)}
                </div>
                <span className="text-base font-bold text-neutral-900 font-heading">
                  {brandName}
                </span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-sm">
              Penyelenggara Perjalanan Ibadah Umroh (PPIU) dan Haji Khusus terpercaya dengan komitmen kenyamanan akomodasi dan bimbingan ibadah sesuai Sunnah.
            </p>
          </div>

          {/* Kolom 2: Akses Portal Jamaah */}
          <div className="space-y-3.5">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 font-heading">
              Layanan Jamaah
            </h3>
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2.5 max-w-sm">
              <p className="text-xs text-neutral-500 leading-relaxed">
                Akses status booking, upload dokumen paspor, dan riwayat pembayaran Anda secara aman melalui portal.
              </p>
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 text-xs font-bold text-neutral-900 bg-white border border-neutral-200 px-3.5 py-2 rounded-xl hover:bg-neutral-100 transition-colors shadow-2xs"
              >
                <span>Buka Portal Jamaah</span>
                <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Kolom 3: Kontak & Legalitas */}
          <div className="space-y-3.5">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 font-heading">
              Kontak & Legalitas
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Konsultasi WhatsApp:</span>
                {brandWhatsapp ? (
                  <a
                    href={`https://wa.me/${brandWhatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-neutral-900 hover:underline"
                  >
                    +{brandWhatsapp}
                  </a>
                ) : (
                  <span className="font-semibold text-neutral-700">Tersedia Siaga</span>
                )}
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Izin Kemenag RI:</span>
                <span className="font-medium text-neutral-800">PPIU Resmi Terdaftar</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Layanan:</span>
                <span className="font-medium text-neutral-800">Umroh, Haji Khusus, Badal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Baris Copyright */}
        <div className="mt-10 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-400">
          <span>© {currentYear} {brandName}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}