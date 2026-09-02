'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

export default function DigitalInvoiceView({ invoice }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [timeUnits, setTimeUnits] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';

  const brandColor = invoice.brand?.primary_color || '#990000';

  // Live countdown timer for seat hold
  useEffect(() => {
    if (!invoice.seat_hold_expires_at || invoice.status === 'dp' || invoice.status === 'lunas') return;

    const updateCountdown = () => {
      const target = new Date(invoice.seat_hold_expires_at).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeUnits({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUnits({ days, hours, minutes, seconds, isExpired: false });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [invoice.seat_hold_expires_at, invoice.status]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const brandLogoUrl = invoice.brand?.logo_url 
    ? (invoice.brand.logo_url.startsWith('http') ? invoice.brand.logo_url : `${apiBaseUrl}${invoice.brand.logo_url}`)
    : null;

  const showCountdown = invoice.status !== 'dp' && invoice.status !== 'lunas' && invoice.status !== 'batal';
  const regulerPaxCount = invoice.pax_items?.filter(p => p.pax_type === 'reguler').length || 1;
  const dpPerPax = (invoice.financial?.minimal_dp || 0) / regulerPaxCount;

  return (
    <div>
      {/* Sticky Seamless Top Navigation (Hidden on Print) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-40 print:hidden">
        <div className="container mx-auto px-3.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between max-w-3xl">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-600 transition-colors"
              title="Kembali ke Beranda"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="h-4 w-px bg-neutral-200 mx-0.5" />
            <span className="font-bold text-xs sm:text-sm text-neutral-900">
              Invoice Resmi Elektronik
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleCopy(window.location.href, 'url')}
              className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-neutral-700 transition-all cursor-pointer shadow-2xs"
              title={copiedKey === 'url' ? 'Link Tersalin!' : 'Bagikan Link'}
            >
              {copiedKey === 'url' ? (
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-white transition-all cursor-pointer shadow-sm hover:opacity-90 active:scale-95"
              style={{ backgroundColor: brandColor }}
              title="Cetak / Unduh PDF"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl space-y-4 sm:space-y-5 print:p-0 print:max-w-none">
        
        {/* Urgency Banner: TEKS DI KIRI, COUNTDOWN DI KANAN */}
        {showCountdown && (
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-3.5 sm:p-4.5 flex items-center justify-between gap-3 sm:gap-5 print:hidden">
            
            {/* 1. Teks Informasi di Kiri */}
            <div className="space-y-0.5 text-left min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">
                  Amankan Seat Sekarang
                </h4>
              </div>
              <p className="text-[10.5px] sm:text-xs text-neutral-500 leading-snug">
                Seat Anda diamankan sementara. Selesaikan pembayaran DP sebelum waktu berakhir.
              </p>
            </div>

            {/* 2. Countdown Tiles di Kanan */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {timeUnits.days > 0 && (
                <div className="w-11 sm:w-14 py-1.5 sm:py-2 px-0.5 rounded-xl bg-[#1e232d] text-white text-center shadow-xs">
                  <div className="font-mono font-bold text-sm sm:text-lg leading-none tracking-tight">
                    {String(timeUnits.days).padStart(2, '0')}
                  </div>
                  <div className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
                    HARI
                  </div>
                </div>
              )}
              <div className="w-11 sm:w-14 py-1.5 sm:py-2 px-0.5 rounded-xl bg-[#1e232d] text-white text-center shadow-xs">
                <div className="font-mono font-bold text-sm sm:text-lg leading-none tracking-tight">
                  {String(timeUnits.hours).padStart(2, '0')}
                </div>
                <div className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
                  JAM
                </div>
              </div>
              <div className="w-11 sm:w-14 py-1.5 sm:py-2 px-0.5 rounded-xl bg-[#1e232d] text-white text-center shadow-xs">
                <div className="font-mono font-bold text-sm sm:text-lg leading-none tracking-tight">
                  {String(timeUnits.minutes).padStart(2, '0')}
                </div>
                <div className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
                  MENIT
                </div>
              </div>
              <div className="w-11 sm:w-14 py-1.5 sm:py-2 px-0.5 rounded-xl bg-[#1e232d] text-white text-center shadow-xs">
                <div className="font-mono font-bold text-sm sm:text-lg leading-none tracking-tight text-amber-400">
                  {String(timeUnits.seconds).padStart(2, '0')}
                </div>
                <div className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
                  DETIK
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Digital Invoice Sheet */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 print:border-none print:shadow-none print:p-0 print:rounded-none">
          
          {/* Header & Kop Travel */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 sm:pb-6 border-b border-neutral-200">
            <div className="space-y-1.5">
              {brandLogoUrl ? (
                <img src={brandLogoUrl} alt={invoice.brand?.name} className="h-9 sm:h-12 w-auto object-contain" />
              ) : (
                <h1 className="text-base sm:text-xl font-black text-neutral-900 font-heading leading-tight">
                  {invoice.brand?.name}
                </h1>
              )}
              <div className="text-[11px] text-neutral-500 space-y-0.5">
                <div>
                  Izin PPIU No. {invoice.brand?.ppiu_number || '401/2020'} • Akreditasi {invoice.brand?.akreditasi || 'A'}
                </div>
                {(invoice.brand?.alamat || invoice.brand?.city) && (
                  <div className="text-neutral-400 max-w-[260px] leading-relaxed text-[10.5px]">
                    {invoice.brand?.alamat || invoice.brand?.city}
                  </div>
                )}
                {invoice.brand?.whatsapp_number && (
                  <div className="text-neutral-400">
                    WhatsApp: <span className="font-mono text-neutral-600 font-medium">+{invoice.brand.whatsapp_number.replace(/^\+/, '')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 sm:pt-0 border-t border-neutral-100 sm:border-t-0 sm:text-right space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                INVOICE DIGITAL
              </div>
              <div className="font-mono font-black text-lg sm:text-xl text-neutral-900 tracking-wider">
                #{invoice.booking_code}
              </div>
              <div>
                {invoice.status === 'dp' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    DP Terverifikasi
                  </span>
                ) : invoice.status === 'lunas' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Lunas
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse print:hidden"></span>
                    Menunggu Pembayaran DP
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Informasi Pendaftar & Rincian Paket */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm">
            <div className="space-y-1 sm:space-y-1.5">
              <span className="text-[10px] sm:text-[10.5px] font-bold text-neutral-400 uppercase tracking-wider block">
                Diterbitkan Untuk
              </span>
              <div className="font-bold text-neutral-900 text-sm sm:text-base">
                {invoice.pic?.nama_lengkap}
              </div>
              <div className="text-neutral-600 font-mono text-xs">
                WhatsApp: {invoice.pic?.no_hp_masked || '-'}
              </div>
              <div className="text-neutral-400 text-xs">
                Tanggal Booking: {formatDate(invoice.created_at)}
              </div>
            </div>

            <div className="space-y-1 sm:space-y-1.5 sm:text-right">
              <span className="text-[10px] sm:text-[10.5px] font-bold text-neutral-400 uppercase tracking-wider block">
                Detail Paket & Jadwal
              </span>
              <div className="font-bold text-neutral-900 text-sm sm:text-base">
                {invoice.schedule?.jadwal_nama}
              </div>
              <div className="text-neutral-600 text-xs">
                <strong>{formatDate(invoice.schedule?.berangkat_tanggal)}</strong> s/d <strong>{formatDate(invoice.schedule?.pulang_tanggal)}</strong>
              </div>
            </div>
          </div>

          {/* Tabel Rincian Jamaah & Kamar */}
          <div className="space-y-2 pt-1 sm:pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b-2 border-neutral-200 text-neutral-500 font-semibold text-[10.5px] sm:text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 pr-1 w-6 text-center">#</th>
                    <th className="py-2.5 px-2">Nama Jamaah</th>
                    <th className="py-2.5 px-2">Type Kamar</th>
                    <th className="py-2.5 pl-2 text-right whitespace-nowrap">Tarif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {invoice.pax_items && invoice.pax_items.length > 0 ? (
                    invoice.pax_items.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-2.5 sm:py-3 pr-1 text-center font-mono text-neutral-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 sm:py-3 px-2 font-semibold text-neutral-900">
                          {item.nama_lengkap}
                        </td>
                        <td className="py-2.5 sm:py-3 px-2 text-neutral-600 text-xs sm:text-sm font-medium">
                          {item.pax_type === 'infant' ? 'INFANT' : (item.room_type || 'Quad')}
                        </td>
                        <td className="py-2.5 sm:py-3 pl-2 text-right font-mono font-bold text-neutral-900 whitespace-nowrap text-xs sm:text-sm">
                          {formatRp(item.harga)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-neutral-400">
                        Tidak ada rincian data jamaah
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ringkasan Finansial & Catatan Pembayaran Desktop (2 Kolom di Desktop) */}
          <div className="pt-4 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-6 items-start">
            
            {/* Sisi Kiri (Desktop Only: hidden sm:block): Catatan Pembayaran */}
            <div className="hidden sm:block sm:col-span-7 space-y-2 text-xs">
              <span className="font-bold text-[10.5px] uppercase tracking-wider text-neutral-400 block">
                Catatan Pembayaran
              </span>
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2 text-neutral-700 leading-relaxed text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold text-sm leading-none mt-0.5">•</span>
                  <span>
                    Minimal DP sebesar <strong className="text-neutral-900 font-black">{formatRp(invoice.financial?.minimal_dp)}</strong> ({regulerPaxCount} x {formatRp(dpPerPax)}) untuk mengamankan alokasi kursi penerbangan.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-neutral-600">
                  <span className="text-neutral-400 font-bold text-sm leading-none mt-0.5">•</span>
                  <span>
                    Pelunasan sisa tagihan dapat dicicil hingga <strong>{invoice.financial?.jatuh_tempo_pelunasan}</strong>.
                  </span>
                </div>
              </div>
            </div>

            {/* Sisi Kanan (Desktop: sm:col-span-5 | Mobile: full width langsung di bawah tabel): Ringkasan Biaya */}
            <div className="sm:col-span-5 space-y-2 text-xs sm:text-sm self-start sm:pl-4">
              <span className="font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wider text-neutral-400 block sm:hidden">
                Ringkasan Biaya
              </span>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-neutral-600">
                  <span>Total Biaya Paket</span>
                  <span className="font-mono font-bold text-neutral-900 whitespace-nowrap">
                    {formatRp(invoice.financial?.total_harga)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-neutral-500 text-xs">
                  <span>Total Telah Dibayar</span>
                  <span className="font-mono font-semibold text-emerald-600 whitespace-nowrap">
                    {formatRp(invoice.financial?.total_dibayar)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-neutral-200 text-neutral-900 font-bold">
                  <span className="text-xs sm:text-sm">Sisa Tagihan</span>
                  <span className="font-mono font-black text-sm sm:text-base whitespace-nowrap">
                    {formatRp(invoice.financial?.sisa_tagihan)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rekening Pembayaran Resmi */}
          <div className="pt-6 sm:pt-8 border-t border-neutral-200 space-y-1.5">
            <span className="text-[10px] sm:text-[10.5px] font-bold text-neutral-400 uppercase tracking-wider block">
              Rekening Resmi Pembayaran Travel
            </span>

            <div className="divide-y divide-neutral-100">
              {invoice.bank_accounts && invoice.bank_accounts.length > 0 ? (
                invoice.bank_accounts.map((acc, i) => {
                  const accLogo = acc.logo_url
                    ? (acc.logo_url.startsWith('http') ? acc.logo_url : `${apiBaseUrl}${acc.logo_url}`)
                    : null;

                  return (
                    <div
                      key={acc.id || i}
                      className="pt-1 pb-2 flex items-center gap-3 sm:gap-4"
                    >
                      {accLogo ? (
                        <div className="w-12 h-8 sm:w-13 sm:h-9 bg-white border border-neutral-200/80 rounded-lg p-1 flex items-center justify-center shrink-0">
                          <img
                            src={accLogo}
                            alt={acc.bank_name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-neutral-900 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0">
                          {acc.bank_name}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm sm:text-lg text-neutral-900 tracking-wider select-all truncate">
                            {acc.account_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.account_number, `acc-${i}`)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-neutral-700 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer shadow-2xs print:hidden shrink-0"
                            title="Salin Nomor Rekening"
                          >
                            {copiedKey === `acc-${i}` ? (
                              <>
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-emerald-700">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-0.5 truncate">
                          Bank {acc.bank_name} • a.n. {acc.account_holder}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-2 text-xs text-neutral-500">
                  Rekening resmi travel belum diatur.
                </div>
              )}
            </div>
          </div>

          {/* Catatan Pembayaran (KHUSUS MOBILE: Render di bawah Info Rekening) */}
          <div className="block sm:hidden pt-4 border-t border-neutral-100 space-y-1.5 text-xs">
            <span className="font-bold text-[10px] uppercase tracking-wider text-neutral-400 block">
              Catatan Pembayaran
            </span>
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2 text-neutral-700 leading-relaxed text-xs">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 font-bold text-sm leading-none mt-0.5">•</span>
                <span>
                  Minimal DP sebesar <strong className="text-neutral-900 font-black">{formatRp(invoice.financial?.minimal_dp)}</strong> ({regulerPaxCount} x {formatRp(dpPerPax)}) untuk mengamankan alokasi kursi penerbangan.
                </span>
              </div>
              <div className="flex items-start gap-2 text-neutral-600">
                <span className="text-neutral-400 font-bold text-sm leading-none mt-0.5">•</span>
                <span>
                  Pelunasan sisa tagihan dapat dicicil hingga <strong>{invoice.financial?.jatuh_tempo_pelunasan}</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Footer Nota Resmi */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] sm:text-[10.5px] text-neutral-400">
            <div>
              Invoice resmi digital diterbitkan secara otomatis oleh sistem <strong>{invoice.brand?.name}</strong>.
            </div>
            <div className="font-mono text-[10px]">
              {formatDate(invoice.created_at)} • #{invoice.booking_code}
            </div>
          </div>
        </div>

        {/* CTA Portal Jamaah Box Khusus */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-4 print:hidden">
          <div className="space-y-0.5 sm:space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">
              Sudah Melakukan Pembayaran?
            </h4>
            <p className="text-[11px] sm:text-xs text-neutral-500 leading-relaxed">
              Upload bukti transfer dan lengkapi berkas paspor jamaah di Portal Jamaah resmi.
            </p>
          </div>

          <a
            href="/portal/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <span>Masuk ke Portal Jamaah</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </main>
    </div>
  );
}
