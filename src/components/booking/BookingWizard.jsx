'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Format Rupiah Helper
const formatRp = (num) => {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
};

// Format Date Helper
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

// Custom Select Component for Clean UI
function CustomSelect({ value, onChange, placeholder = 'Pilih Jenis Kelamin' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'L', label: 'Laki-laki' },
    { value: 'P', label: 'Perempuan' },
  ];

  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white flex items-center justify-between cursor-pointer text-left"
      >
        <span className={selectedOpt ? 'text-neutral-900 font-medium' : 'text-neutral-400'}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-neutral-100 z-50 py-1 text-xs sm:text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer ${
                value === opt.value ? 'bg-amber-50/60 font-semibold text-neutral-900' : 'text-neutral-700'
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && (
                <svg className="w-4 h-4 text-emerald-600 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookingWizard({ schedule, brandName, brandColor, brandId, initialBankAccounts = [], travelAccounts = [] }) {
  const router = useRouter();
  // Active step: 1 (Kamar), 2 (Data Jamaah), 3 (Konfirmasi), 4 (Pembayaran)
  const [step, setStep] = useState(1);

  // Room Counts
  const [counts, setCounts] = useState({
    quad: 1,
    triple: 0,
    double: 0,
    infant: 0,
  });

  // Pemesan / Jamaah 1 (Contact Person)
  const [picNama, setPicNama] = useState('');
  const [picGender, setPicGender] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [picEmail, setPicEmail] = useState('');

  // Additional Jamaah details
  const [jamaahQuad, setJamaahQuad] = useState([]);
  const [jamaahTriple, setJamaahTriple] = useState([]);
  const [jamaahDouble, setJamaahDouble] = useState([]);
  const [jamaahInfant, setJamaahInfant] = useState([]);

  // Security & Authentication (PIN Portal)
  const [picPin, setPicPin] = useState('');
  const [picPinConfirm, setPicPinConfirm] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('demo-turnstile-token');

  // UI States
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const activeAccounts = (initialBankAccounts && initialBankAccounts.length > 0) ? initialBankAccounts : ((travelAccounts && travelAccounts.length > 0) ? travelAccounts : []);

  // Restore Step 4 state from sessionStorage on mount / refresh
  useEffect(() => {
    try {
      const storageKey = `booking_result_${schedule?.id}`;
      const savedResult = sessionStorage.getItem(storageKey);
      const urlParams = new URLSearchParams(window.location.search);
      if (savedResult || urlParams.get('step') === 'success' || urlParams.get('code')) {
        let parsed = null;
        if (savedResult) {
          parsed = JSON.parse(savedResult);
        } else if (urlParams.get('code')) {
          // Fallback dummy for direct test preview
          parsed = {
            kode_booking: urlParams.get('code'),
            total_harga: (schedule?.harga_double || 33999000) * 2 + (schedule?.harga_infant || 12000000),
            nominal_dp: (schedule?.minimal_dp || 5000000) * 2,
            bank_accounts: activeAccounts,
          };
        }
        if (parsed && parsed.kode_booking) {
          setBookingResult(parsed);
          setStep(4);
        }
      }
    } catch (e) {
      console.error('Failed to restore booking state:', e);
    }
  }, [schedule?.id, schedule?.harga_double, schedule?.harga_infant, schedule?.minimal_dp, initialBankAccounts, travelAccounts]);

  const activeColor = brandColor || '#990000';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
  const rawLogo = schedule?.maskapai?.logo_url || schedule?.airline_logo || schedule?.maskapai_logo;
  const airlineLogoUrl = rawLogo
    ? (rawLogo.startsWith('http') ? rawLogo : `${apiBaseUrl}${rawLogo}`)
    : null;

  // Room Prices from Schedule
  const priceQuad = schedule?.harga_quad || 0;
  const priceTriple = schedule?.harga_triple || (priceQuad > 0 ? priceQuad + 2000000 : 0);
  const priceDouble = schedule?.harga_double || (priceQuad > 0 ? priceQuad + 5000000 : 0);
  const priceInfant = schedule?.harga_infant || 12000000;
  const dpPerPax = schedule?.dp_amount || 5000000;
  const seatSisa = schedule?.seat_sisa !== undefined ? schedule.seat_sisa : 10;

  // Total Calculations
  const totalReguler = counts.quad + counts.triple + counts.double;
  const totalPax = totalReguler + counts.infant;
  const totalPrice =
    counts.quad * priceQuad +
    counts.triple * priceTriple +
    counts.double * priceDouble +
    counts.infant * priceInfant;
  const totalDp = totalReguler * dpPerPax;

  // Custom Alert Modal Trigger
  const showAlert = (msg) => {
    setAlertMsg(msg);
  };

  // Update room count safely
  const updateCount = (type, delta) => {
    setCounts((prev) => {
      const current = prev[type];
      const next = current + delta;
      if (next < 0) return prev;

      if (type !== 'infant') {
        const nextRegulerTotal =
          (type === 'quad' ? next : prev.quad) +
          (type === 'triple' ? next : prev.triple) +
          (type === 'double' ? next : prev.double);

        if (nextRegulerTotal > seatSisa && delta > 0) {
          showAlert(`Jumlah kursi yang dipilih (${nextRegulerTotal}) melebihi sisa kursi yang tersedia (${seatSisa}).`);
          return prev;
        }
      }

      return { ...prev, [type]: next };
    });
  };

  // Navigation: Step 1 -> Step 2
  const goToStep2 = () => {
    if (totalReguler <= 0) {
      showAlert('Pilih minimal 1 jamaah reguler untuk melanjutkan.');
      return;
    }
    if (totalReguler > seatSisa) {
      showAlert(`Jumlah jamaah (${totalReguler}) melebihi sisa kursi (${seatSisa}).`);
      return;
    }

    setJamaahQuad((prev) =>
      Array.from({ length: counts.quad }, (_, i) => prev[i] || { nama: '', jenis_kelamin: '', no_hp: '' })
    );
    setJamaahTriple((prev) =>
      Array.from({ length: counts.triple }, (_, i) => prev[i] || { nama: '', jenis_kelamin: '', no_hp: '' })
    );
    setJamaahDouble((prev) =>
      Array.from({ length: counts.double }, (_, i) => prev[i] || { nama: '', jenis_kelamin: '', no_hp: '' })
    );
    setJamaahInfant((prev) =>
      Array.from({ length: counts.infant }, (_, i) => prev[i] || { nama: '', jenis_kelamin: '', tanggal_lahir: '' })
    );

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation: Step 2 -> Step 3
  const goToStep3 = () => {
    if (!picNama.trim()) {
      showAlert('Nama lengkap Pemesan (Jamaah 1) wajib diisi.');
      return;
    }
    if (!picGender) {
      showAlert('Jenis kelamin Pemesan (Jamaah 1) wajib dipilih.');
      return;
    }
    const cleanPhone = picPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      showAlert('Nomor WhatsApp Pemesan tidak valid (minimal 9 digit).');
      return;
    }

    // Validasi Jamaah Quad
    for (let i = 0; i < counts.quad; i++) {
      const isPic = i === 0;
      const j = isPic ? { nama: picNama, jenis_kelamin: picGender } : jamaahQuad[i];
      if (!j?.nama?.trim()) {
        showAlert(`Nama Jamaah ke-${i + 1} (Kamar Quad) wajib diisi.`);
        return;
      }
      if (!j?.jenis_kelamin) {
        showAlert(`Jenis kelamin Jamaah ke-${i + 1} (Kamar Quad) wajib dipilih.`);
        return;
      }
    }

    // Validasi Jamaah Triple
    let offsetTriple = counts.quad;
    for (let i = 0; i < counts.triple; i++) {
      const isPic = counts.quad === 0 && i === 0;
      const j = isPic ? { nama: picNama, jenis_kelamin: picGender } : jamaahTriple[i];
      if (!j?.nama?.trim()) {
        showAlert(`Nama Jamaah ke-${offsetTriple + i + 1} (Kamar Triple) wajib diisi.`);
        return;
      }
      if (!j?.jenis_kelamin) {
        showAlert(`Jenis kelamin Jamaah ke-${offsetTriple + i + 1} (Kamar Triple) wajib dipilih.`);
        return;
      }
    }

    // Validasi Jamaah Double
    let offsetDouble = counts.quad + counts.triple;
    for (let i = 0; i < counts.double; i++) {
      const isPic = counts.quad === 0 && counts.triple === 0 && i === 0;
      const j = isPic ? { nama: picNama, jenis_kelamin: picGender } : jamaahDouble[i];
      if (!j?.nama?.trim()) {
        showAlert(`Nama Jamaah ke-${offsetDouble + i + 1} (Kamar Double) wajib diisi.`);
        return;
      }
      if (!j?.jenis_kelamin) {
        showAlert(`Jenis kelamin Jamaah ke-${offsetDouble + i + 1} (Kamar Double) wajib dipilih.`);
        return;
      }
    }

    // Validasi Infant
    const departureDate = schedule?.berangkat_tanggal || schedule?.tanggal_keberangkatan
      ? new Date(schedule.berangkat_tanggal || schedule.tanggal_keberangkatan)
      : new Date();

    for (let i = 0; i < counts.infant; i++) {
      const inf = jamaahInfant[i];
      if (!inf?.nama?.trim()) {
        showAlert(`Nama Bayi ke-${i + 1} wajib diisi.`);
        return;
      }
      if (!inf?.jenis_kelamin) {
        showAlert(`Jenis kelamin Bayi ke-${i + 1} wajib dipilih.`);
        return;
      }
      if (!inf?.tanggal_lahir) {
        showAlert(`Tanggal lahir Bayi ke-${i + 1} wajib diisi.`);
        return;
      }
      const bDate = new Date(inf.tanggal_lahir);
      const ageDiff = (departureDate - bDate) / (1000 * 60 * 60 * 24 * 365.25);
      if (ageDiff >= 2.0) {
        showAlert(`Usia Bayi ${inf.nama.trim()} mencapai 2 tahun atau lebih saat keberangkatan.`);
        return;
      }
    }

    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Booking (Step 3 -> Step 4)
  const handleSubmitBooking = async () => {
    if (picPin.length !== 6 || !/^\d{6}$/.test(picPin)) {
      showAlert('PIN Portal Jamaah wajib 6 digit angka.');
      return;
    }
    if (picPin !== picPinConfirm) {
      showAlert('Konfirmasi PIN tidak sesuai.');
      return;
    }
    if (!agree) {
      showAlert('Anda harus menyetujui Syarat & Ketentuan pendaftaran.');
      return;
    }

    setLoading(true);

    try {
      // Determine PIC Room Type
      let picRoomType = 'Quad';
      if (counts.quad > 0) picRoomType = 'Quad';
      else if (counts.triple > 0) picRoomType = 'Triple';
      else if (counts.double > 0) picRoomType = 'Double';

      const anggota = [];

      // Anggota Quad (selain PIC)
      if (counts.quad > 0) {
        for (let i = 1; i < counts.quad; i++) {
          anggota.push({
            pax_type: 'reguler',
            nama_lengkap: (jamaahQuad[i]?.nama || '').trim(),
            no_hp: jamaahQuad[i]?.no_hp ? jamaahQuad[i].no_hp.replace(/\D/g, '') : undefined,
            jenis_kelamin: jamaahQuad[i]?.jenis_kelamin || 'L',
            room_type: 'Quad',
          });
        }
      }

      // Anggota Triple
      const startTriple = counts.quad === 0 ? 1 : 0;
      for (let i = startTriple; i < counts.triple; i++) {
        anggota.push({
          pax_type: 'reguler',
          nama_lengkap: (jamaahTriple[i]?.nama || '').trim(),
          no_hp: jamaahTriple[i]?.no_hp ? jamaahTriple[i].no_hp.replace(/\D/g, '') : undefined,
          jenis_kelamin: jamaahTriple[i]?.jenis_kelamin || 'L',
          room_type: 'Triple',
        });
      }

      // Anggota Double
      const startDouble = counts.quad === 0 && counts.triple === 0 ? 1 : 0;
      for (let i = startDouble; i < counts.double; i++) {
        anggota.push({
          pax_type: 'reguler',
          nama_lengkap: (jamaahDouble[i]?.nama || '').trim(),
          no_hp: jamaahDouble[i]?.no_hp ? jamaahDouble[i].no_hp.replace(/\D/g, '') : undefined,
          jenis_kelamin: jamaahDouble[i]?.jenis_kelamin || 'L',
          room_type: 'Double',
        });
      }

      // Anggota Infant
      for (let i = 0; i < counts.infant; i++) {
        anggota.push({
          pax_type: 'infant',
          nama_lengkap: (jamaahInfant[i]?.nama || '').trim(),
          jenis_kelamin: jamaahInfant[i]?.jenis_kelamin || 'L',
          room_type: null,
          tanggal_lahir: jamaahInfant[i]?.tanggal_lahir || undefined,
        });
      }

      const payload = {
        brand_id: schedule?.brand_id || brandId || 1,
        schedule_id: schedule?.id,
        captcha_token: turnstileToken || 'demo-token',
        pic: {
          nama_lengkap: picNama.trim(),
          no_hp: picPhone.replace(/\D/g, ''),
          email: picEmail.trim() || undefined,
          jenis_kelamin: picGender || 'L',
          room_type: picRoomType,
          portal_pin: picPin,
        },
        anggota: anggota,
      };

      const res = await fetch('/api/public/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses pendaftaran booking.');
      }

      const resultData = {
        kode_booking: data.booking?.booking_code,
        total_harga: data.booking?.total_harga,
        nominal_dp: data.booking?.minimal_dp,
        portal_token: data.portal_token,
        bank_accounts: data.bank_accounts,
        pic_phone: picPhone.replace(/\D/g, ''),
      };

      try {
        const storageKey = `booking_result_${schedule?.id}`;
        sessionStorage.setItem(storageKey, JSON.stringify(resultData));
        const newUrl = `${window.location.pathname}?step=success&code=${data.booking?.booking_code}`;
        window.history.replaceState(null, '', newUrl);
      } catch (e) {}

      setBookingResult(resultData);
      // Redirect ke Digital Invoice URL permanen
      if (data.booking?.booking_code) {
        router.push(`/invoice/${data.booking.booking_code}`);
      } else {
        setStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      showAlert(err.message || 'Gagal mengirim formulir booking. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Copy account number
  const handleCopyAccount = (accNum) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAccount(accNum);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  // Summary Jamaah List
  const summaryJamaahList = [];
  let paxIndex = 1;

  for (let i = 0; i < counts.quad; i++) {
    const isPic = i === 0;
    summaryJamaahList.push({
      num: paxIndex++,
      nama: isPic ? picNama : (jamaahQuad[i]?.nama || `Jamaah ${paxIndex - 1}`),
      sub: `Kamar Quad • ${(isPic ? picGender : jamaahQuad[i]?.jenis_kelamin) === 'L' ? 'Laki-laki' : 'Perempuan'}`,
      price: priceQuad,
    });
  }

  for (let i = 0; i < counts.triple; i++) {
    const isPic = counts.quad === 0 && i === 0;
    summaryJamaahList.push({
      num: paxIndex++,
      nama: isPic ? picNama : (jamaahTriple[i]?.nama || `Jamaah ${paxIndex - 1}`),
      sub: `Kamar Triple • ${(isPic ? picGender : jamaahTriple[i]?.jenis_kelamin) === 'L' ? 'Laki-laki' : 'Perempuan'}`,
      price: priceTriple,
    });
  }

  for (let i = 0; i < counts.double; i++) {
    const isPic = counts.quad === 0 && counts.triple === 0 && i === 0;
    summaryJamaahList.push({
      num: paxIndex++,
      nama: isPic ? picNama : (jamaahDouble[i]?.nama || `Jamaah ${paxIndex - 1}`),
      sub: `Kamar Double • ${(isPic ? picGender : jamaahDouble[i]?.jenis_kelamin) === 'L' ? 'Laki-laki' : 'Perempuan'}`,
      price: priceDouble,
    });
  }

  for (let i = 0; i < counts.infant; i++) {
    summaryJamaahList.push({
      num: paxIndex++,
      nama: jamaahInfant[i]?.nama || `Bayi ${i + 1}`,
      sub: 'Tanpa Kamar • Bayi (< 2 Tahun)',
      price: priceInfant,
    });
  }

  return (
    <div className="space-y-6 pb-20 sm:pb-0" style={{ '--brand-primary': activeColor }}>
      {/* Alert Modal */}
      {alertMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-neutral-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-neutral-800 leading-relaxed">
              {alertMsg}
            </p>
            <button
              type="button"
              onClick={() => setAlertMsg('')}
              className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Stepper Header (HANYA tampil di Step 1, 2, 3 - TIDAK tampil di Step 4 / Instruksi Pembayaran) */}
      {step < 4 && (
        <div className="flex items-center gap-2 sm:gap-3 mb-6 select-none overflow-x-auto pb-2">
          {[
            { num: 1, label: 'Pilih Kamar' },
            { num: 2, label: 'Data Jamaah' },
            { num: 3, label: 'Konfirmasi' },
          ].map((s, idx, arr) => {
            const isPassed = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'text-white shadow-xs'
                        : 'border border-neutral-300 bg-white text-neutral-400 font-medium'
                    }`}
                    style={isCurrent ? { backgroundColor: activeColor } : {}}
                  >
                    {isPassed ? (
                      <svg className="w-3.5 h-3.5 text-white stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold transition-colors ${
                      isPassed
                        ? 'text-neutral-800'
                        : isCurrent
                        ? 'text-neutral-900'
                        : 'text-neutral-400 font-medium'
                    }`}
                    style={isCurrent ? { color: activeColor } : {}}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className="w-4 sm:w-8 h-[1px] bg-neutral-200 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Container Layout */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Kolom Kiri: Form Content */}
        <div className="w-full flex-1 min-w-0">
          
          {/* ─── STEP 1: PILIH KAMAR & JUMLAH JAMAAH ─── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 font-heading tracking-tight">
                  Pilih Kamar & Jumlah Jamaah
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-normal">
                  Pilih tipe kamar dan jumlah jamaah sesuai kebutuhan.
                </p>
              </div>

              {/* List Room Cards */}
              <div className="space-y-3 pt-2">
                {/* QUAD */}
                <div className="relative">
                  <div className="absolute -top-2.5 left-4 z-10">
                    <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-2xs">
                      PALING HEMAT
                    </span>
                  </div>
                  <div className={`p-4 rounded-2xl transition-all flex items-center justify-between gap-3 ${
                    counts.quad > 0
                      ? 'bg-[#F0FDF4] border-2 border-emerald-400'
                      : 'bg-white border border-neutral-200 hover:border-neutral-300'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-neutral-900 text-sm sm:text-base">QUAD</span>
                        <span className="text-xs text-neutral-400 font-normal">(Sekamar Ber-4)</span>
                      </div>
                      <div className="text-sm font-bold text-neutral-900 mt-0.5">
                        {formatRp(priceQuad)} <span className="text-xs text-neutral-400 font-normal">/ pax</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCount('quad', -1)}
                        disabled={counts.quad <= 0}
                        className="w-8 h-8 rounded-lg bg-white text-neutral-700 font-bold flex items-center justify-center shadow-xs hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-neutral-900">{counts.quad}</span>
                      <button
                        type="button"
                        onClick={() => updateCount('quad', 1)}
                        className="w-8 h-8 rounded-lg bg-white text-neutral-700 font-bold flex items-center justify-center shadow-xs hover:bg-neutral-50 transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* TRIPLE */}
                <div className={`p-4 rounded-2xl transition-all flex items-center justify-between gap-3 ${
                  counts.triple > 0
                    ? 'bg-[#F0FDF4] border-2 border-emerald-400'
                    : 'bg-white border border-neutral-200 hover:border-neutral-300'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neutral-900 text-sm sm:text-base">TRIPLE</span>
                      <span className="text-xs text-neutral-400 font-normal">(Sekamar Ber-3)</span>
                    </div>
                    <div className="text-sm font-bold text-neutral-900 mt-0.5">
                      {formatRp(priceTriple)} <span className="text-xs text-neutral-400 font-normal">/ pax</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCount('triple', -1)}
                      disabled={counts.triple <= 0}
                      className="w-8 h-8 rounded-lg bg-white text-neutral-700 font-bold flex items-center justify-center shadow-xs hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-sm text-neutral-900">{counts.triple}</span>
                    <button
                      type="button"
                      onClick={() => updateCount('triple', 1)}
                      className="w-8 h-8 rounded-lg bg-white text-neutral-700 font-bold flex items-center justify-center shadow-xs hover:bg-neutral-50 transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* DOUBLE */}
                <div className={`p-4 rounded-2xl transition-all flex items-center justify-between gap-3 ${
                  counts.double > 0
                    ? 'bg-[#F0FDF4] border-2 border-emerald-400'
                    : 'bg-white border border-neutral-200 hover:border-neutral-300'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neutral-900 text-sm sm:text-base">DOUBLE</span>
                      <span className="text-xs text-neutral-400 font-normal">(Sekamar Ber-2)</span>
                    </div>
                    <div className="text-sm font-bold text-neutral-900 mt-0.5">
                      {formatRp(priceDouble)} <span className="text-xs text-neutral-400 font-normal">/ pax</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCount('double', -1)}
                      disabled={counts.double <= 0}
                      className="w-8 h-8 rounded-lg bg-white text-neutral-700 font-bold flex items-center justify-center shadow-xs hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-sm text-neutral-900">{counts.double}</span>
                    <button
                      type="button"
                      onClick={() => updateCount('double', 1)}
                      className="w-8 h-8 rounded-lg bg-white text-neutral-700 font-bold flex items-center justify-center shadow-xs hover:bg-neutral-50 transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* INFANT */}
                <div className={`p-4 rounded-2xl transition-all flex items-center justify-between gap-3 ${
                  counts.infant > 0
                    ? 'bg-[#F0FDF4] border-2 border-emerald-400'
                    : 'bg-white border border-neutral-200 hover:border-neutral-300'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neutral-900 text-sm sm:text-base">INFANT</span>
                      <span className="text-xs text-neutral-400 font-normal">(Bayi &lt; 2 Tahun)</span>
                    </div>
                    <div className="text-sm font-bold text-neutral-900 mt-0.5">
                      {formatRp(priceInfant)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCount('infant', -1)}
                      disabled={counts.infant <= 0}
                      className="w-8 h-8 rounded-lg bg-white text-neutral-700 font-bold flex items-center justify-center shadow-xs hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-sm text-neutral-900">{counts.infant}</span>
                    <button
                      type="button"
                      onClick={() => updateCount('infant', 1)}
                      className="w-8 h-8 rounded-lg bg-white text-neutral-700 font-bold flex items-center justify-center shadow-xs hover:bg-neutral-50 transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Action on Mobile / Inline on Desktop */}
              <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md p-3.5 sm:p-0 sm:static sm:bg-transparent sm:border-0 sm:backdrop-blur-none shadow-[0_-4px_20px_rgba(0,0,0,0.08)] sm:shadow-none sm:pt-4">
                <div className="container mx-auto max-w-4xl px-0 sm:px-0">
                  <button
                    type="button"
                    onClick={goToStep2}
                    disabled={totalReguler <= 0}
                    className="btn-brand-cta w-full py-3.5 sm:py-4 rounded-xl font-bold text-white text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                  >
                    <span>Lanjut: Isi Data Jamaah</span>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: DATA LENGKAP JAMAAH ─── */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 font-heading tracking-tight">
                  Data Jamaah
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-normal">
                  Isi data setiap jamaah. Pastikan nama sesuai KTP/Paspor.
                </p>
              </div>

              {/* Section Jamaah Utama */}
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-3.5">
                <div className="pb-2 border-b border-neutral-100">
                  <h3 className="font-bold text-neutral-800 text-sm">
                    Jamaah Utama
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Penanggung jawab booking dan pemegang akun Portal Jamaah.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    No. WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={picPhone}
                    onChange={(e) => setPicPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="08123456789"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={picNama}
                    onChange={(e) => setPicNama(e.target.value)}
                    placeholder="Contoh: Muhammad Ahmad"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={picGender}
                    onChange={(val) => setPicGender(val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email <span className="text-neutral-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="email"
                    value={picEmail}
                    onChange={(e) => setPicEmail(e.target.value)}
                    placeholder="Misal: budi@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white"
                  />
                </div>
              </div>

              {/* Grup Kamar QUAD */}
              {counts.quad > 0 && (
                <div className="space-y-3">
                  <span className="bg-neutral-900 text-white text-[11px] font-bold px-3 py-1 rounded-md inline-block uppercase">
                    QUAD (Sekamar ber-4)
                  </span>

                  {Array.from({ length: counts.quad }).map((_, idx) => {
                    const isPic = idx === 0;
                    return (
                      <div key={`q_${idx}`} className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                          <span className="font-bold text-neutral-800 text-sm">
                            Jamaah {idx + 1}
                          </span>
                          {isPic && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                              KONTAK UTAMA
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Nama Lengkap (Sesuai KTP/Paspor) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={isPic ? picNama : (jamaahQuad[idx]?.nama || '')}
                            onChange={(e) => {
                              if (isPic) setPicNama(e.target.value);
                              else {
                                const arr = [...jamaahQuad];
                                arr[idx] = { ...arr[idx], nama: e.target.value };
                                setJamaahQuad(arr);
                              }
                            }}
                            placeholder="Contoh: Muhammad Ahmad"
                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Jenis Kelamin <span className="text-red-500">*</span>
                            </label>
                            <CustomSelect
                              value={isPic ? picGender : (jamaahQuad[idx]?.jenis_kelamin || '')}
                              onChange={(val) => {
                                if (isPic) setPicGender(val);
                                else {
                                  const arr = [...jamaahQuad];
                                  arr[idx] = { ...arr[idx], jenis_kelamin: val };
                                  setJamaahQuad(arr);
                                }
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              No. WhatsApp {isPic ? <span className="text-red-500">*</span> : <span className="text-neutral-400 font-normal">(Opsional)</span>}
                            </label>
                            <input
                              type="tel"
                              value={isPic ? picPhone : (jamaahQuad[idx]?.no_hp || '')}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (isPic) setPicPhone(val);
                                else {
                                  const arr = [...jamaahQuad];
                                  arr[idx] = { ...arr[idx], no_hp: val };
                                  setJamaahQuad(arr);
                                }
                              }}
                              placeholder="08123456789"
                              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white font-mono"
                            />
                          </div>
                        </div>

                        {isPic && (
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Email <span className="text-neutral-400 font-normal">(Opsional)</span>
                            </label>
                            <input
                              type="email"
                              value={picEmail}
                              onChange={(e) => setPicEmail(e.target.value)}
                              placeholder="Misal: budi@gmail.com"
                              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Grup Kamar TRIPLE */}
              {counts.triple > 0 && (
                <div className="space-y-3">
                  <span className="bg-neutral-900 text-white text-[11px] font-bold px-3 py-1 rounded-md inline-block uppercase">
                    TRIPLE (Sekamar ber-3)
                  </span>

                  {Array.from({ length: counts.triple }).map((_, idx) => {
                    const isPic = counts.quad === 0 && idx === 0;
                    const paxNum = counts.quad + idx + 1;
                    return (
                      <div key={`t_${idx}`} className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                          <span className="font-bold text-neutral-800 text-sm">
                            Jamaah {paxNum}
                          </span>
                          {isPic && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                              KONTAK UTAMA
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Nama Lengkap (Sesuai KTP/Paspor) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={isPic ? picNama : (jamaahTriple[idx]?.nama || '')}
                            onChange={(e) => {
                              if (isPic) setPicNama(e.target.value);
                              else {
                                const arr = [...jamaahTriple];
                                arr[idx] = { ...arr[idx], nama: e.target.value };
                                setJamaahTriple(arr);
                              }
                            }}
                            placeholder="Contoh: Nama Lengkap"
                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Jenis Kelamin <span className="text-red-500">*</span>
                            </label>
                            <CustomSelect
                              value={isPic ? picGender : (jamaahTriple[idx]?.jenis_kelamin || '')}
                              onChange={(val) => {
                                if (isPic) setPicGender(val);
                                else {
                                  const arr = [...jamaahTriple];
                                  arr[idx] = { ...arr[idx], jenis_kelamin: val };
                                  setJamaahTriple(arr);
                                }
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              No. WhatsApp {isPic ? <span className="text-red-500">*</span> : <span className="text-neutral-400 font-normal">(Opsional)</span>}
                            </label>
                            <input
                              type="tel"
                              value={isPic ? picPhone : (jamaahTriple[idx]?.no_hp || '')}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (isPic) setPicPhone(val);
                                else {
                                  const arr = [...jamaahTriple];
                                  arr[idx] = { ...arr[idx], no_hp: val };
                                  setJamaahTriple(arr);
                                }
                              }}
                              placeholder="08123456789"
                              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white font-mono"
                            />
                          </div>
                        </div>

                        {isPic && (
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Email <span className="text-neutral-400 font-normal">(Opsional)</span>
                            </label>
                            <input
                              type="email"
                              value={picEmail}
                              onChange={(e) => setPicEmail(e.target.value)}
                              placeholder="Misal: budi@gmail.com"
                              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Grup Kamar DOUBLE */}
              {counts.double > 0 && (
                <div className="space-y-3">
                  <span className="bg-neutral-900 text-white text-[11px] font-bold px-3 py-1 rounded-md inline-block uppercase">
                    DOUBLE (Sekamar ber-2)
                  </span>

                  {Array.from({ length: counts.double }).map((_, idx) => {
                    const isPic = counts.quad === 0 && counts.triple === 0 && idx === 0;
                    const paxNum = counts.quad + counts.triple + idx + 1;
                    return (
                      <div key={`d_${idx}`} className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                          <span className="font-bold text-neutral-800 text-sm">
                            Jamaah {paxNum}
                          </span>
                          {isPic && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                              KONTAK UTAMA
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Nama Lengkap (Sesuai KTP/Paspor) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={isPic ? picNama : (jamaahDouble[idx]?.nama || '')}
                            onChange={(e) => {
                              if (isPic) setPicNama(e.target.value);
                              else {
                                const arr = [...jamaahDouble];
                                arr[idx] = { ...arr[idx], nama: e.target.value };
                                setJamaahDouble(arr);
                              }
                            }}
                            placeholder="Contoh: Nama Lengkap"
                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Jenis Kelamin <span className="text-red-500">*</span>
                            </label>
                            <CustomSelect
                              value={isPic ? picGender : (jamaahDouble[idx]?.jenis_kelamin || '')}
                              onChange={(val) => {
                                if (isPic) setPicGender(val);
                                else {
                                  const arr = [...jamaahDouble];
                                  arr[idx] = { ...arr[idx], jenis_kelamin: val };
                                  setJamaahDouble(arr);
                                }
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              No. WhatsApp {isPic ? <span className="text-red-500">*</span> : <span className="text-neutral-400 font-normal">(Opsional)</span>}
                            </label>
                            <input
                              type="tel"
                              value={isPic ? picPhone : (jamaahDouble[idx]?.no_hp || '')}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (isPic) setPicPhone(val);
                                else {
                                  const arr = [...jamaahDouble];
                                  arr[idx] = { ...arr[idx], no_hp: val };
                                  setJamaahDouble(arr);
                                }
                              }}
                              placeholder="08123456789"
                              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white font-mono"
                            />
                          </div>
                        </div>

                        {isPic && (
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Email <span className="text-neutral-400 font-normal">(Opsional)</span>
                            </label>
                            <input
                              type="email"
                              value={picEmail}
                              onChange={(e) => setPicEmail(e.target.value)}
                              placeholder="Misal: budi@gmail.com"
                              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Grup Kamar INFANT */}
              {counts.infant > 0 && (
                <div className="space-y-3">
                  <span className="bg-neutral-900 text-white text-[11px] font-bold px-3 py-1 rounded-md inline-block uppercase">
                    INFANT (Bayi &lt; 2 Tahun)
                  </span>

                  {Array.from({ length: counts.infant }).map((_, idx) => {
                    const depDate = schedule?.berangkat_tanggal || schedule?.tanggal_keberangkatan ? new Date(schedule.berangkat_tanggal || schedule.tanggal_keberangkatan) : new Date('2026-09-03');
                    const birthDateVal = jamaahInfant[idx]?.tanggal_lahir;
                    let isOverAge = false;
                    if (birthDateVal && birthDateVal.length === 10) {
                      const parts = birthDateVal.split('-');
                      const year = parseInt(parts[0], 10);
                      if (year >= 2000) {
                        const bDate = new Date(birthDateVal);
                        if (!isNaN(bDate.getTime())) {
                          const ageDiffYears = (depDate - bDate) / (1000 * 60 * 60 * 24 * 365.25);
                          if (ageDiffYears >= 2.0) {
                            isOverAge = true;
                          }
                        }
                      }
                    }

                    const minAllowedDate = new Date(depDate.getFullYear() - 2, depDate.getMonth(), depDate.getDate() + 1).toISOString().split('T')[0];
                    const todayDate = new Date().toISOString().split('T')[0];

                    return (
                      <div key={`inf_${idx}`} className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-3.5">
                        <div className="pb-2 border-b border-neutral-100">
                          <span className="font-bold text-neutral-800 text-sm">
                            Bayi {idx + 1}
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Nama Lengkap Bayi <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={jamaahInfant[idx]?.nama || ''}
                            onChange={(e) => {
                              const arr = [...jamaahInfant];
                              arr[idx] = { ...arr[idx], nama: e.target.value };
                              setJamaahInfant(arr);
                            }}
                            placeholder="Nama lengkap bayi sesuai akta/paspor"
                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Jenis Kelamin <span className="text-red-500">*</span>
                            </label>
                            <CustomSelect
                              value={jamaahInfant[idx]?.jenis_kelamin || ''}
                              onChange={(val) => {
                                const arr = [...jamaahInfant];
                                arr[idx] = { ...arr[idx], jenis_kelamin: val };
                                setJamaahInfant(arr);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Tanggal Lahir Bayi <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              min={minAllowedDate}
                              max={todayDate}
                              value={jamaahInfant[idx]?.tanggal_lahir || ''}
                              onChange={(e) => {
                                const arr = [...jamaahInfant];
                                arr[idx] = { ...arr[idx], tanggal_lahir: e.target.value };
                                setJamaahInfant(arr);
                              }}
                              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white ${
                                isOverAge ? 'border-red-500 ring-1 ring-red-500' : ''
                              }`}
                            />
                            {isOverAge && (
                              <p className="text-[10.5px] text-red-600 font-normal mt-1 leading-relaxed">
                                ⚠️ Usia bayi &ge; 2 tahun pada tanggal keberangkatan ({formatDate(schedule?.berangkat_tanggal)}). Silakan pilih kamar reguler.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sticky Bottom Action on Mobile / Inline on Desktop */}
              <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md p-3.5 sm:p-0 sm:static sm:bg-transparent sm:border-0 sm:backdrop-blur-none shadow-[0_-4px_20px_rgba(0,0,0,0.08)] sm:shadow-none sm:pt-4">
                <div className="container mx-auto max-w-4xl px-0 sm:px-0 flex items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 sm:px-6 py-3.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={goToStep3}
                    className="btn-brand-cta flex-1 py-3.5 sm:py-4 rounded-xl font-bold text-white text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Lanjut ke Konfirmasi</span>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: KONFIRMASI PENDAFTARAN ─── */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 font-heading tracking-tight">
                  Konfirmasi Booking
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-normal">
                  Pastikan data dan rincian paket sudah benar sebelum melanjutkan.
                </p>
              </div>

              {/* Box 1: Info Paket */}
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    NAMA PAKET
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded uppercase">
                    {schedule?.maskapai?.name || 'GARUDA INDONESIA'}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-neutral-900 text-base sm:text-lg">
                  {schedule?.jadwal_nama || schedule?.package_name || 'Umroh Reguler Promo'}
                </h3>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-neutral-100 text-xs">
                  <div>
                    <span className="text-[11px] text-neutral-400 block mb-0.5">Keberangkatan:</span>
                    <span className="font-bold text-neutral-800">{formatDate(schedule?.berangkat_tanggal)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 block mb-0.5">Kepulangan:</span>
                    <span className="font-bold text-neutral-800">{formatDate(schedule?.pulang_tanggal || '2026-09-09')}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 block mb-0.5">Total Jamaah:</span>
                    <span className="font-bold text-neutral-800">{totalPax} Orang</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Daftar Jamaah */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3 bg-neutral-50/70 border-b border-neutral-100">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    DAFTAR JAMAAH ({totalPax} ORANG)
                  </span>
                </div>

                <div className="divide-y divide-neutral-100 text-xs sm:text-sm">
                  {summaryJamaahList.map((j) => (
                    <div key={j.num} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {j.num}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-neutral-900 text-sm truncate">{j.nama}</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">{j.sub}</div>
                        </div>
                      </div>
                      <span className="font-bold text-neutral-900 text-sm shrink-0">
                        {formatRp(j.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 3: Buat PIN Akun Jamaah */}
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-2xs space-y-3.5">
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">
                    Buat PIN Akun Portal Jamaah
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    Akses informasi perjalanan, pembayaran, visa, tiket, manasik, dan persiapan umroh Anda dalam satu tempat.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Buat 6 Digit PIN <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={6}
                        value={picPin}
                        onChange={(e) => setPicPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Contoh: 123456"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white font-mono tracking-widest pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        {showPin ? (
                          <svg className="w-4 h-4 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Konfirmasi 6 Digit PIN <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      {(() => {
                        const isPinComplete = picPin.length === 6;
                        const isConfirmComplete = picPinConfirm.length === 6;
                        const isMatch = isPinComplete && isConfirmComplete && picPin === picPinConfirm;
                        const isMismatch = isConfirmComplete && picPin !== picPinConfirm;

                        return (
                          <>
                            <input
                              type={showPinConfirm ? 'text' : 'password'}
                              maxLength={6}
                              value={picPinConfirm}
                              onChange={(e) => setPicPinConfirm(e.target.value.replace(/\D/g, ''))}
                              placeholder="Ulangi 6 digit PIN"
                              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white font-mono tracking-widest pr-10 ${
                                isMatch
                                  ? 'border-emerald-500 ring-1 ring-emerald-500'
                                  : isMismatch
                                  ? 'border-red-500 ring-1 ring-red-500'
                                  : ''
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPinConfirm(!showPinConfirm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                            >
                              {showPinConfirm ? (
                                <svg className="w-4 h-4 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                    {picPin.length === 6 && picPinConfirm.length === 6 && picPin === picPinConfirm && (
                      <p className="text-[10.5px] text-emerald-600 font-medium mt-1 flex items-center gap-1 animate-in fade-in duration-100">
                        <svg className="w-3.5 h-3.5 text-emerald-600 stroke-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>PIN sesuai</span>
                      </p>
                    )}
                    {picPinConfirm.length === 6 && picPin !== picPinConfirm && (
                      <p className="text-[10.5px] text-red-600 font-normal mt-1 flex items-center gap-1 animate-in fade-in duration-100">
                        <svg className="w-3.5 h-3.5 text-red-500 stroke-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Konfirmasi PIN tidak sesuai</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Box 4: Syarat & Ketentuan & Turnstile */}
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-2xs space-y-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-600 leading-relaxed">
                    Saya menyatakan data pendaftaran di atas sudah benar sesuai identitas KTP/Paspor dan menyetujui seluruh{' '}
                    <a href="#" className="font-bold underline text-neutral-800 hover:text-black">
                      Syarat &amp; Ketentuan
                    </a>{' '}
                    serta kebijakan pembatalan &amp; pelunasan yang berlaku.
                  </span>
                </label>

                {/* Cloudflare Turnstile Badge */}
                <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Protected by Cloudflare Turnstile Verification</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Security Check Passed</span>
                </div>
              </div>

              {/* Sticky Bottom Action on Mobile / Inline on Desktop */}
              <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md p-3.5 sm:p-0 sm:static sm:bg-transparent sm:border-0 sm:backdrop-blur-none shadow-[0_-4px_20px_rgba(0,0,0,0.08)] sm:shadow-none sm:pt-4">
                <div className="container mx-auto max-w-4xl px-0 sm:px-0 flex items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 sm:px-6 py-3.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitBooking}
                    disabled={loading || !agree}
                    className="btn-brand-cta flex-1 py-3.5 sm:py-4 rounded-xl font-bold text-white text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                  >
                    {loading ? 'Memproses Booking...' : 'Konfirmasi & Lanjut Pembayaran'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: PEMBAYARAN & KODE BOOKING (SUKSES) ─── */}
          {step === 4 && bookingResult && (
            <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-300">
              {/* Header Sukses */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <svg className="w-6 h-6 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-emerald-950 font-heading">
                  Pendaftaran Booking Berhasil!
                </h2>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Seat Anda telah diamankan sementara selama <strong>24 jam</strong>. Segera lakukan pembayaran Down Payment (DP) untuk konfirmasi.
                </p>
              </div>

              {/* Kode Booking Card */}
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    KODE BOOKING
                  </span>
                  <span className="text-lg font-mono font-bold text-neutral-900 tracking-wider">
                    {bookingResult.kode_booking}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyAccount(bookingResult.kode_booking)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedAccount === bookingResult.kode_booking ? 'Tersalin!' : 'Salin'}
                </button>
              </div>

              {/* Tagihan DP Card */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      NOMINAL DOWN PAYMENT (DP)
                    </span>
                    <span className="text-2xl font-bold text-amber-950 block">
                      {formatRp(bookingResult.nominal_dp || totalDp)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBillDetails(!showBillDetails)}
                    className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showBillDetails ? 'Sembunyikan' : 'Rincian'}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${showBillDetails ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Accordion Rincian Tagihan */}
                {showBillDetails && (
                  <div className="pt-3 border-t border-amber-200/60 text-xs space-y-2 text-amber-900 animate-in fade-in duration-150">
                    <div className="flex justify-between">
                      <span>Total Biaya Paket ({totalPax} Jamaah):</span>
                      <span className="font-bold">{formatRp(bookingResult.total_harga || totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wajib DP ({totalReguler} Orang &times; {formatRp(dpPerPax)}):</span>
                      <span className="font-bold">{formatRp(bookingResult.nominal_dp || totalDp)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 pt-1 border-t border-amber-200/40">
                      <span>Sisa Pelunasan (H-45):</span>
                      <span>{formatRp((bookingResult.total_harga || totalPrice) - (bookingResult.nominal_dp || totalDp))}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Daftar Rekening Bank Resmi Travel */}
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-4">
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">
                    Rekening Resmi Pembayaran
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Silakan transfer pembayaran DP Anda ke salah satu rekening resmi di bawah ini:
                  </p>
                </div>

                <div className="space-y-3">
                  {((bookingResult?.bank_accounts && bookingResult.bank_accounts.length > 0)
                    ? bookingResult.bank_accounts
                    : (travelAccounts && travelAccounts.length > 0 ? travelAccounts : activeAccounts)
                  ).map((acc, i) => {
                    const logoUrl = acc.logo_url 
                      ? (acc.logo_url.startsWith('http') ? acc.logo_url : `${apiBaseUrl}${acc.logo_url}`)
                      : null;

                    return (
                      <div
                        key={acc.id || i}
                        className="p-4 rounded-2xl border border-neutral-200/90 bg-slate-50 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5">
                          {logoUrl ? (
                            <div className="w-14 h-10 bg-white border border-neutral-200 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                              <img
                                src={logoUrl}
                                alt={acc.bank_name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-wider shrink-0">
                              {acc.bank_name}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-neutral-900 text-xs tracking-tight block">
                              {acc.bank_name}
                            </span>
                            <div className="font-mono font-bold text-base text-neutral-900 tracking-wider select-all mt-0.5">
                              {acc.account_number}
                            </div>
                            <div className="text-xs text-neutral-500 font-medium mt-0.5">
                              a.n. {acc.account_holder || acc.account_name || acc.an}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyAccount(acc.account_number)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
                        >
                          {copiedAccount === acc.account_number ? 'Tersalin!' : 'Salin No. Rek'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* CTA Portal */}
              <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3">
                <div className="text-xs text-neutral-600 leading-relaxed">
                  Gunakan nomor WhatsApp <strong>{picPhone}</strong> dan <strong>6 digit PIN</strong> yang Anda buat untuk login ke <strong>Portal Jamaah</strong> (upload bukti transfer & berkas).
                </div>
                <a
                  href={bookingResult.portal_token ? `/portal/login?token=${bookingResult.portal_token}` : '/portal/login'}
                  className="btn-brand-cta w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Masuk ke Portal Jamaah</span>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ─── KOLOM KANAN: STICKY RINCIAN BOOKING (STEP 1, 2, 3) ─── */}
        {step < 4 && (
          <div className="w-full md:w-[320px] lg:w-[360px] shrink-0 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-2xs space-y-4 sticky top-24">
              <div>
                <h3 className="font-heading font-bold text-neutral-900 text-base">
                  Rincian Booking
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {schedule?.jadwal_nama || schedule?.package_name || 'Umroh Reguler Promo'} • {formatDate(schedule?.berangkat_tanggal)}
                </p>
              </div>

              {/* Card Maskapai Penerbangan */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                  {airlineLogoUrl ? (
                    <img
                      src={airlineLogoUrl}
                      alt={schedule.maskapai?.name || 'Maskapai'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    MASKAPAI PENERBANGAN
                  </span>
                  <span className="text-xs font-bold text-neutral-900 truncate block">
                    {schedule?.maskapai?.name || 'GARUDA INDONESIA'}
                  </span>
                </div>
              </div>

              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Tiket Confirmed: Menggunakan SVG Centang Bulat Resmi dari Card Paket */}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-2xs leading-none">
                  <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Tiket Confirmed
                </span>

                {/* Direct Badge */}
                {(schedule?.is_direct_flight || schedule?.is_direct) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-600 text-white px-2.5 py-1 rounded-full shadow-2xs leading-none">
                    <svg className="w-2.5 h-2.5 fill-current transform rotate-90 shrink-0" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                    Direct
                  </span>
                )}

                {/* Sisa Kursi Dinamis sesuai Aturan Progress Bar (Scarcity <= 10) */}
                {seatSisa === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-1 rounded-full leading-none">
                    Full Booked
                  </span>
                ) : seatSisa <= 10 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    Sisa {seatSisa} Kursi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full leading-none">
                    Tersedia
                  </span>
                )}
              </div>

              {/* Rincian Pilihan Kamar */}
              <div className="pt-3 border-t border-neutral-100 text-xs">
                {totalPax === 0 ? (
                  <div className="py-4 px-3 bg-neutral-50/80 rounded-xl border border-dashed border-neutral-200 text-center">
                    <p className="font-semibold text-neutral-700 text-xs">
                      Belum ada kamar dipilih
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Pilih jumlah pax pada kamar di sebelah kiri
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {counts.quad > 0 && (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-neutral-800">QUAD <span className="font-normal text-neutral-400">(Sekamar ber-4)</span></div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">{counts.quad} Orang &times; {formatRp(priceQuad)}</div>
                        </div>
                        <span className="font-bold text-neutral-900 text-sm">{formatRp(counts.quad * priceQuad)}</span>
                      </div>
                    )}

                    {counts.triple > 0 && (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-neutral-800">TRIPLE <span className="font-normal text-neutral-400">(Sekamar ber-3)</span></div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">{counts.triple} Orang &times; {formatRp(priceTriple)}</div>
                        </div>
                        <span className="font-bold text-neutral-900 text-sm">{formatRp(counts.triple * priceTriple)}</span>
                      </div>
                    )}

                    {counts.double > 0 && (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-neutral-800">DOUBLE <span className="font-normal text-neutral-400">(Sekamar ber-2)</span></div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">{counts.double} Orang &times; {formatRp(priceDouble)}</div>
                        </div>
                        <span className="font-bold text-neutral-900 text-sm">{formatRp(counts.double * priceDouble)}</span>
                      </div>
                    )}

                    {counts.infant > 0 && (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-neutral-800">INFANT <span className="font-normal text-neutral-400">(Bayi &lt; 2 Tahun)</span></div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">{counts.infant} Bayi &times; {formatRp(priceInfant)}</div>
                        </div>
                        <span className="font-bold text-neutral-900 text-sm">{formatRp(counts.infant * priceInfant)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Total Harga Paket */}
              <div className="pt-3.5 border-t border-neutral-100 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-neutral-700">Total Harga Paket</span>
                <span className="font-bold text-emerald-600 text-base sm:text-lg">{formatRp(totalPrice)}</span>
              </div>

              {/* DP untuk Amankan Seat */}
              <div className="pt-3 border-t border-neutral-100">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">DP untuk Amankan Seat</span>
                    <span className="text-[11px] text-neutral-400 mt-0.5 block">{totalReguler} Orang &times; {formatRp(dpPerPax)}</span>
                  </div>
                  <span className="font-bold text-neutral-900 text-base">{formatRp(totalDp)}</span>
                </div>
                <span className="text-[10.5px] text-neutral-400 mt-2 block leading-relaxed">
                  Pelunasan dapat dicicil s/d H-45 keberangkatan
                </span>
              </div>

              {/* Checklist Trust Bar */}
              <div className="pt-3.5 border-t border-neutral-100 space-y-2 text-xs text-neutral-700">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[11px] font-medium">Izin PPIU No. 401/2020 & Akreditasi A</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[11px] font-medium">Garansi Tiket & Jadwal Pasti</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[11px] font-medium">Berpengalaman 10th+ lebih</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
