import React from 'react';
import Link from 'next/link';

export default function FooterSection({
  brandName = 'Travel Umroh',
  brandWhatsapp = '',
  fullLogoUrl = '',
  address = '',
  city = '',
  province = '',
  email = '',
  phone = '',
  gmapsUrl = '',
  legalInfo = '',
  socials = null,
}) {
  const currentYear = new Date().getFullYear();

  const formattedAddress = [address, city, province].filter(Boolean).join(', ');

  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-neutral-600">
          
          {/* Kolom 1: Profil Brand & Sosmed */}
          <div className="space-y-3.5 md:col-span-1">
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

            {/* Social Media Links */}
            {socials && Object.keys(socials).some((key) => Boolean(socials[key])) && (
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Ikuti Kami
                </span>
                <div className="flex items-center gap-2.5">
                  {socials.instagram && (
                    <a
                      href={socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-600 flex items-center justify-center transition-colors shadow-2xs"
                      aria-label={`${brandName} Instagram`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {socials.facebook && (
                    <a
                      href={socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-blue-50 hover:text-blue-600 text-neutral-600 flex items-center justify-center transition-colors shadow-2xs"
                      aria-label={`${brandName} Facebook`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.889C10.667 0 9 1.583 9 4.615V8z"/>
                      </svg>
                    </a>
                  )}
                  {socials.youtube && (
                    <a
                      href={socials.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-600 flex items-center justify-center transition-colors shadow-2xs"
                      aria-label={`${brandName} YouTube`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  )}
                  {socials.tiktok && (
                    <a
                      href={socials.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-600 flex items-center justify-center transition-colors shadow-2xs"
                      aria-label={`${brandName} TikTok`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01v8.51c0 1.95-.53 3.89-1.62 5.5-1.5 2.18-4.01 3.59-6.68 3.75-2.3.14-4.66-.54-6.49-1.99-2.09-1.64-3.32-4.16-3.35-6.8-.03-2.6 1.15-5.12 3.19-6.8 1.83-1.51 4.25-2.28 6.64-2.12v4.06c-1.3-.12-2.65.25-3.66 1.07-.99.8-1.59 2.05-1.57 3.34.02 1.29.65 2.51 1.68 3.28 1.05.77 2.45.98 3.7.67 1.25-.32 2.27-1.27 2.67-2.48.24-.72.32-1.49.32-2.26V.02z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Kolom 2: Kantor & Alamat Fisik (Local NAP) */}
          <div className="space-y-3.5 md:col-span-1">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 font-heading">
              Kantor & Lokasi
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm">
              {formattedAddress ? (
                <p className="text-neutral-600 leading-relaxed">
                  {formattedAddress}
                </p>
              ) : (
                <p className="text-neutral-500 italic">
                  Layanan Nasional & Konsultasi Online Siaga
                </p>
              )}

              {gmapsUrl && (
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline pt-1"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Petunjuk Arah Google Maps</span>
                </a>
              )}

              {phone && (
                <div className="flex items-center gap-2 pt-1 text-xs text-neutral-700">
                  <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Telp Kantor: <strong>{phone}</strong></span>
                </div>
              )}

              {email && (
                <div className="flex items-center gap-2 text-xs text-neutral-700">
                  <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${email}`} className="hover:underline text-neutral-700">
                    {email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Kolom 3: Layanan Jamaah */}
          <div className="space-y-3.5 md:col-span-1">
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

          {/* Kolom 4: Kontak WhatsApp & Legalitas */}
          <div className="space-y-3.5 md:col-span-1">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 font-heading">
              Kontak & Izin Resmi
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Konsultasi WA:</span>
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
              <div className="pb-2 border-b border-neutral-100">
                <span className="text-neutral-500 block mb-0.5">Izin Kemenag RI:</span>
                <span className="font-medium text-neutral-900">
                  {legalInfo || 'PPIU Resmi Terdaftar'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Program:</span>
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