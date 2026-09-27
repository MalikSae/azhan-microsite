'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getMe, listJamaahSaya, buatBookingAgen } from '@/lib/portalApi';

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
function CustomSelect({ value, onChange, options: customOptions, placeholder = 'Pilih Jenis Kelamin' }) {
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

  const defaultOptions = [
    { value: 'L', label: 'Laki-laki' },
    { value: 'P', label: 'Perempuan' },
  ];

  const options = customOptions || defaultOptions;
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

export default function BookingWizard({
  schedule,
  brandName,
  brandColor,
  brandId,
  brandWhatsapp = '',
  brandPpiu = 'No. 484/2020',
  brandLegal = '',
  initialRoom = 'quad',
  initialBankAccounts = [],
  travelAccounts = [],
  // Mode agen (Jalur 1, screen A5): agen login membuat booking untuk
  // jamaahnya. Agen bukan PIC; tanpa cek nomor dan PIN; pax bisa dipilih
  // dari "Jamaah Saya" (repeat order). Dikirim ke /api/portal/agen/bookings.
  agenMode = false
}) {
  const router = useRouter();
  // Active step: 1 (Kamar), 2 (Data Jamaah), 3 (Konfirmasi), 4 (Pembayaran)
  const [step, setStep] = useState(1);

  // Room Counts - diinisialisasi dari query param room
  const [counts, setCounts] = useState(() => {
    const init = { quad: 0, triple: 0, double: 0, infant: 0 };
    const norm = String(initialRoom || 'quad').toLowerCase();
    if (norm === 'triple') init.triple = 1;
    else if (norm === 'double') init.double = 1;
    else init.quad = 1;
    return init;
  });

  // Pemesan / Jamaah 1 (Contact Person)
  const [picNama, setPicNama] = useState('');
  const [picGender, setPicGender] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [picEmail, setPicEmail] = useState('');
  const [picRoomType, setPicRoomType] = useState('');
  const [picSlotIndex, setPicSlotIndex] = useState(null);
  const [phoneCheckStatus, setPhoneCheckStatus] = useState('idle');
  // 'idle' | 'checking' | 'baru' | 'perlu_pin' | 'tanpa_pin' | 'error'
  const [lastCheckedPhone, setLastCheckedPhone] = useState('');

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
  const [picPinVerify, setPicPinVerify] = useState('');
  const [showPinVerify, setShowPinVerify] = useState(false);
  const [agree, setAgree] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('demo-turnstile-token');

  // UI States
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [pendingRoomSwap, setPendingRoomSwap] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const activeAccounts = (initialBankAccounts && initialBankAccounts.length > 0) ? initialBankAccounts : ((travelAccounts && travelAccounts.length > 0) ? travelAccounts : []);

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Mode agen: daftar jamaah milik agen + jamaah terpilih sebagai PIC.
  const [jamaahSaya, setJamaahSaya] = useState([]);
  const [picJamaahId, setPicJamaahId] = useState(null);

  useEffect(() => {
    if (!agenMode) return;
    listJamaahSaya().then(setJamaahSaya).catch(() => setJamaahSaya([]));
  }, [agenMode]);

  // Jamaah yang sudah dipakai di booking ini tidak ditawarkan lagi.
  const usedJamaahIds = new Set(
    [picJamaahId, ...jamaahQuad, ...jamaahTriple, ...jamaahDouble]
      .map((x) => (x && typeof x === 'object' ? x.jamaah_id : x))
      .filter(Boolean)
  );

  const pilihJamaahSaya = (onPick) => (
    <select
      value=""
      onChange={(e) => {
        const j = jamaahSaya.find((x) => String(x.id) === e.target.value);
        if (j) onPick(j);
      }}
      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white"
    >
      <option value="">Pilih dari Jamaah Saya (repeat order)...</option>
      {jamaahSaya.filter((j) => !usedJamaahIds.has(j.id)).map((j) => (
        <option key={j.id} value={j.id}>
          {j.nama_lengkap}{j.no_hp_masked ? ` · ${j.no_hp_masked}` : ''}
        </option>
      ))}
    </select>
  );

  const chipJamaahSaya = (nama, onReset) => (
    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
      <div className="min-w-0">
        <p className="text-sm font-bold text-neutral-900 truncate">{nama}</p>
        <p className="text-[11px] text-neutral-500">Jamaah Saya • repeat order</p>
      </div>
      <button type="button" onClick={onReset} className="text-[11px] font-semibold text-neutral-600 underline shrink-0 cursor-pointer">
        Ganti
      </button>
    </div>
  );

  // Slot anggota (kamar Quad/Triple/Double) di mode agen.
  const renderSlotJamaahSaya = (arr, setArr, idx) => {
    const row = arr[idx] || {};
    const set = (patch) => {
      const next = [...arr];
      next[idx] = { ...row, ...patch };
      setArr(next);
    };
    if (row.jamaah_id) {
      return chipJamaahSaya(row.nama, () => set({ jamaah_id: undefined, nama: '', jenis_kelamin: '', no_hp: '' }));
    }
    if (jamaahSaya.length === 0) return null;
    return pilihJamaahSaya((j) => set({ jamaah_id: j.id, nama: j.nama_lengkap, jenis_kelamin: j.jenis_kelamin || 'L', no_hp: '' }));
  };

  // Restore Step 4 state from sessionStorage on mount / refresh
  useEffect(() => {
    // Mode agen tidak memulihkan hasil booking publik dari sesi browser.
    if (agenMode) return;
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
  }, [schedule?.id, schedule?.harga_double, schedule?.harga_infant, schedule?.minimal_dp, initialBankAccounts, travelAccounts, agenMode]);

  // Auto-detect Portal Jamaah login session
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;
      // Mode agen: yang login adalah agen, bukan PIC booking.
      if (agenMode) return;
      const token = localStorage.getItem('portal_access_token');
      if (!token) return;

      try {
        const parts = token.split('.');
        if (parts.length !== 3) return;
        const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadStr);

        if (payload.exp && payload.exp < Date.now() / 1000) return;
        if (payload.type !== 'portal') return;

        const me = await getMe();
        if (me && me.id) {
          const targetBrandId = schedule?.brand_id || brandId;
          if (!targetBrandId || me.brand_id === targetBrandId) {
            setLoggedInUser(me);
            setPicNama(me.nama_lengkap || '');
            setPicPhone(me.no_hp || '');
            setPicGender(me.jenis_kelamin || 'L');
            if (me.email) setPicEmail(me.email);
            setPhoneCheckStatus('logged_in');
            setLastCheckedPhone(me.no_hp || '');
          }
        }
      } catch (err) {
        console.warn('Gagal membaca sesi portal login:', err);
      }
    };

    checkAuth();
  }, [schedule?.brand_id, brandId, agenMode]);

  const handleLogoutAuth = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portal_access_token');
    }
    setLoggedInUser(null);
    setPicNama('');
    setPicPhone('');
    setPicGender('');
    setPicEmail('');
    setPhoneCheckStatus('idle');
    setLastCheckedPhone('');
    setPicPin('');
    setPicPinConfirm('');
    setPicPinVerify('');
  };

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

  const durationDays = useMemo(() => {
    if (!schedule?.berangkat_tanggal || !schedule?.pulang_tanggal) return 0;
    const dep = new Date(schedule.berangkat_tanggal);
    const ret = new Date(schedule.pulang_tanggal);
    const diff = Math.round((ret - dep) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [schedule?.berangkat_tanggal, schedule?.pulang_tanggal]);

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

  // Change PIC Room Type & select first empty slot
  const handleRoomTypeChange = (newType) => {
    if (!newType) {
      setPicRoomType('');
      setPicSlotIndex(null);
      return;
    }

    let targetArr = [];
    let targetCount = 0;
    if (newType === 'Quad') {
      targetArr = jamaahQuad;
      targetCount = counts.quad;
    } else if (newType === 'Triple') {
      targetArr = jamaahTriple;
      targetCount = counts.triple;
    } else if (newType === 'Double') {
      targetArr = jamaahDouble;
      targetCount = counts.double;
    }

    let emptyIdx = -1;
    for (let i = 0; i < targetCount; i++) {
      const isCurrentPicSlot = picRoomType === newType && picSlotIndex === i;
      if (isCurrentPicSlot || !targetArr[i]?.nama?.trim()) {
        emptyIdx = i;
        break;
      }
    }

    if (emptyIdx !== -1) {
      setPicRoomType(newType);
      setPicSlotIndex(emptyIdx);
    } else {
      setPendingRoomSwap({
        newType,
        occupantName: targetArr[0]?.nama?.trim() || 'jamaah ini',
      });
    }
  };

  // Confirm room swap when target room type is full
  const handleConfirmRoomSwap = () => {
    if (!pendingRoomSwap) return;
    const { newType } = pendingRoomSwap;

    const emptyObj = { nama: '', jenis_kelamin: '', no_hp: '' };

    if (newType === 'Quad') {
      setJamaahQuad((prev) => {
        const next = [...prev];
        next[0] = { ...emptyObj };
        return next;
      });
    } else if (newType === 'Triple') {
      setJamaahTriple((prev) => {
        const next = [...prev];
        next[0] = { ...emptyObj };
        return next;
      });
    } else if (newType === 'Double') {
      setJamaahDouble((prev) => {
        const next = [...prev];
        next[0] = { ...emptyObj };
        return next;
      });
    }

    setPicRoomType(newType);
    setPicSlotIndex(0);
    setPendingRoomSwap(null);
  };

  // Check WhatsApp phone registration status
  const checkPhone = async (phone) => {
    const clean = (phone || '').replace(/\D/g, '');
    if (clean.length < 10) {
      setPhoneCheckStatus('idle');
      return;
    }

    setPhoneCheckStatus('checking');
    try {
      const targetBrandId = schedule?.brand_id || brandId || 1;
      const res = await fetch('/api/public/jamaah/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: targetBrandId,
          no_hp: clean,
        }),
      });

      if (!res.ok) {
        setPhoneCheckStatus('error');
        setLastCheckedPhone(clean);
        showAlert('Gagal memeriksa nomor, coba lagi sebentar lagi.');
        return;
      }

      const data = await res.json();
      setPhoneCheckStatus(data.status || 'error');
      setLastCheckedPhone(clean);
    } catch (err) {
      setPhoneCheckStatus('error');
      setLastCheckedPhone(clean);
      showAlert('Gagal memeriksa nomor, coba lagi sebentar lagi.');
    }
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

    if (totalReguler === 1) {
      const autoType = counts.quad === 1 ? 'Quad' : (counts.triple === 1 ? 'Triple' : 'Double');
      setPicRoomType(autoType);
      setPicSlotIndex(0);
    } else if (picRoomType) {
      let currentCount = 0;
      if (picRoomType === 'Quad') currentCount = counts.quad;
      else if (picRoomType === 'Triple') currentCount = counts.triple;
      else if (picRoomType === 'Double') currentCount = counts.double;

      if (currentCount === 0 || picSlotIndex >= currentCount) {
        setPicRoomType('');
        setPicSlotIndex(null);
      }
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation: Step 2 -> Step 3
  const goToStep3 = () => {
    if (!picRoomType) {
      showAlert('Pilih tipe kamar untuk Jamaah Utama.');
      return;
    }
    if (!picNama.trim()) {
      showAlert('Nama lengkap Pemesan (Jamaah 1) wajib diisi.');
      return;
    }
    if (!picGender) {
      showAlert('Jenis kelamin Pemesan (Jamaah 1) wajib dipilih.');
      return;
    }
    const cleanPhone = picPhone.replace(/\D/g, '');
    if (!(agenMode && picJamaahId) && cleanPhone.length < 9) {
      showAlert('Nomor WhatsApp Pemesan tidak valid (minimal 9 digit).');
      return;
    }

    // Validasi Jamaah Quad
    for (let i = 0; i < counts.quad; i++) {
      const isPic = picRoomType === 'Quad' && picSlotIndex === i;
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
      const isPic = picRoomType === 'Triple' && picSlotIndex === i;
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
      const isPic = picRoomType === 'Double' && picSlotIndex === i;
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
    if (agenMode) {
      // Booking agen: tanpa PIN; jamaah baru mengaktifkan akun portalnya sendiri.
    } else if (phoneCheckStatus === 'baru') {
      if (picPin.length !== 6 || !/^\d{6}$/.test(picPin)) {
        setStep(2);
        showAlert('PIN Portal Jamaah wajib 6 digit angka.');
        return;
      }
      if (picPin !== picPinConfirm) {
        setStep(2);
        showAlert('Konfirmasi PIN tidak sesuai.');
        return;
      }
    } else if (phoneCheckStatus === 'perlu_pin') {
      if (picPinVerify.length !== 6 || !/^\d{6}$/.test(picPinVerify)) {
        setStep(2);
        showAlert('PIN Portal Jamaah wajib 6 digit angka.');
        return;
      }
    } else if (phoneCheckStatus === 'tanpa_pin' || phoneCheckStatus === 'logged_in') {
      // Tidak ada validasi PIN
    } else {
      setStep(2);
      showAlert('Nomor WhatsApp belum terverifikasi.');
      return;
    }

    if (!agree) {
      showAlert('Anda harus menyetujui Syarat & Ketentuan pendaftaran.');
      return;
    }

    setLoading(true);

    try {
      const anggota = [];

      // Anggota Quad (selain PIC)
      for (let i = 0; i < counts.quad; i++) {
        if (picRoomType === 'Quad' && picSlotIndex === i) continue;
        anggota.push({
          pax_type: 'reguler',
          nama_lengkap: (jamaahQuad[i]?.nama || '').trim(),
          jamaah_id: agenMode ? jamaahQuad[i]?.jamaah_id : undefined,
          no_hp: jamaahQuad[i]?.no_hp ? jamaahQuad[i].no_hp.replace(/\D/g, '') : undefined,
          jenis_kelamin: jamaahQuad[i]?.jenis_kelamin || 'L',
          room_type: 'Quad',
        });
      }

      // Anggota Triple (selain PIC)
      for (let i = 0; i < counts.triple; i++) {
        if (picRoomType === 'Triple' && picSlotIndex === i) continue;
        anggota.push({
          pax_type: 'reguler',
          nama_lengkap: (jamaahTriple[i]?.nama || '').trim(),
          jamaah_id: agenMode ? jamaahTriple[i]?.jamaah_id : undefined,
          no_hp: jamaahTriple[i]?.no_hp ? jamaahTriple[i].no_hp.replace(/\D/g, '') : undefined,
          jenis_kelamin: jamaahTriple[i]?.jenis_kelamin || 'L',
          room_type: 'Triple',
        });
      }

      // Anggota Double (selain PIC)
      for (let i = 0; i < counts.double; i++) {
        if (picRoomType === 'Double' && picSlotIndex === i) continue;
        anggota.push({
          pax_type: 'reguler',
          nama_lengkap: (jamaahDouble[i]?.nama || '').trim(),
          jamaah_id: agenMode ? jamaahDouble[i]?.jamaah_id : undefined,
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
          portal_pin: agenMode ? '' : (phoneCheckStatus === 'baru' ? picPin : (phoneCheckStatus === 'perlu_pin' ? picPinVerify : '')),
          jamaah_id: agenMode && picJamaahId ? picJamaahId : undefined,
        },
        anggota: anggota,
      };

      let data;
      if (agenMode) {
        data = await buatBookingAgen(payload);
      } else {
        const token = typeof window !== 'undefined' ? localStorage.getItem('portal_access_token') : null;
        const requestHeaders = {
          'Content-Type': 'application/json',
        };
        if (token) {
          requestHeaders['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/public/book', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(payload),
        });

        data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Terjadi kesalahan saat memproses pendaftaran booking.');
        }
      }

      if (!agenMode && data.portal_token && typeof window !== 'undefined') {
        localStorage.setItem('portal_access_token', data.portal_token);
      }

      const resultData = {
        kode_booking: data.booking?.booking_code,
        total_harga: data.booking?.total_harga,
        nominal_dp: data.booking?.minimal_dp,
        portal_token: data.portal_token,
        bank_accounts: data.bank_accounts,
        pic_phone: picPhone.replace(/\D/g, ''),
      };

      if (!agenMode) try {
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
      const msg = err.message || 'Gagal mengirim formulir booking. Silakan coba lagi.';
      if (
        msg.includes('nomor atau PIN tidak cocok') ||
        msg.includes('nomor tidak dapat digunakan') ||
        msg.includes('nomor sudah terdaftar') ||
        msg.includes('Jamaah Saya')
      ) {
        setStep(2);
      }
      showAlert(msg);
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
    const isPic = picRoomType === 'Quad' && picSlotIndex === i;
    summaryJamaahList.push({
      num: paxIndex++,
      nama: isPic ? picNama : (jamaahQuad[i]?.nama || `Jamaah ${paxIndex - 1}`),
      sub: `Kamar Quad • ${(isPic ? picGender : jamaahQuad[i]?.jenis_kelamin) === 'L' ? 'Laki-laki' : 'Perempuan'}`,
      price: priceQuad,
    });
  }

  for (let i = 0; i < counts.triple; i++) {
    const isPic = picRoomType === 'Triple' && picSlotIndex === i;
    summaryJamaahList.push({
      num: paxIndex++,
      nama: isPic ? picNama : (jamaahTriple[i]?.nama || `Jamaah ${paxIndex - 1}`),
      sub: `Kamar Triple • ${(isPic ? picGender : jamaahTriple[i]?.jenis_kelamin) === 'L' ? 'Laki-laki' : 'Perempuan'}`,
      price: priceTriple,
    });
  }

  for (let i = 0; i < counts.double; i++) {
    const isPic = picRoomType === 'Double' && picSlotIndex === i;
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

      {/* Confirm Room Swap Modal */}
      {pendingRoomSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-neutral-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-neutral-800 leading-relaxed">
              Data {pendingRoomSwap.occupantName} akan dikosongkan. Lanjutkan?
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPendingRoomSwap(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRoomSwap}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-neutral-200 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-neutral-900 text-base">Keluar dari Akun?</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Anda akan keluar dari akun <strong>{loggedInUser?.nama_lengkap}</strong> dan data formulir Jamaah Utama akan dikosongkan untuk pendaftaran baru.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogoutAuth();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Header (HANYA tampil di Step 1, 2, 3) */}
      {step < 4 && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
          {[
            { num: 1, label: 'Kamar' },
            { num: 2, label: 'Data Jamaah' },
            { num: 3, label: 'Konfirmasi' },
          ].map((s, idx) => {
            const isPassed = step > s.num;
            const isCurrent = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-bold transition-all shrink-0 ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand text-white shadow-2xs'
                        : 'border border-neutral-300 bg-white text-neutral-400'
                    }`}
                  >
                    {isPassed ? (
                      <svg className="w-3 h-3 text-white stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-[11.5px] font-bold ${
                      isCurrent ? 'text-neutral-900' : isPassed ? 'text-neutral-700' : 'text-neutral-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-[1.5px] mx-2 ${step > idx + 1 ? 'bg-emerald-500' : 'bg-neutral-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Main Container */}
      <div className="w-full">
        {/* ─── STEP 1: PILIH KAMAR & JUMLAH JAMAAH ─── */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Card Ringkasan Paket Terintegrasi */}
            <div className="p-3.5 rounded-2xl bg-neutral-50/90 border border-neutral-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">
                    Paket Dipilih
                  </span>
                  <h2 className="text-[14px] font-extrabold text-neutral-900 leading-snug line-clamp-2">
                    {schedule?.jadwal_nama}
                  </h2>
                </div>
                {airlineLogoUrl ? (
                  <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200/80 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                    <img src={airlineLogoUrl} alt={schedule.maskapai?.name || 'Maskapai'} className="w-full h-full object-contain" />
                  </div>
                ) : null}
              </div>

              {/* Departure, Duration, Airline & Direct */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-600 font-medium pt-1.5 border-t border-neutral-200/70">
                <span className="font-semibold text-neutral-800">{formatDate(schedule?.berangkat_tanggal)}</span>
                {durationDays > 0 && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span className="font-bold text-brand">{durationDays} Hari</span>
                  </>
                )}
                {schedule?.maskapai?.name && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span>{schedule.maskapai.name}</span>
                  </>
                )}
                {schedule?.is_direct_flight && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span className="text-neutral-600 font-semibold">Direct</span>
                  </>
                )}
              </div>

              {/* Hotel Mekkah & Madinah with Adjacent Star Rating */}
              {(schedule?.hotel_mekkah || schedule?.hotel_madinah) && (
                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-neutral-200/70 text-[10.5px]">
                  {schedule?.hotel_mekkah && (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 font-bold text-neutral-500 text-[9.5px] uppercase">
                        <span>Mekkah</span>
                        {Boolean(schedule.hotel_mekkah.star_rating) && (
                          <span className="text-amber-500 font-bold">★ {schedule.hotel_mekkah.star_rating}</span>
                        )}
                      </div>
                      <span className="font-bold text-neutral-900 truncate block">
                        {schedule.hotel_mekkah.name}
                      </span>
                    </div>
                  )}
                  {schedule?.hotel_madinah && (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 font-bold text-neutral-500 text-[9.5px] uppercase">
                        <span>Madinah</span>
                        {Boolean(schedule.hotel_madinah.star_rating) && (
                          <span className="text-amber-500 font-bold">★ {schedule.hotel_madinah.star_rating}</span>
                        )}
                      </div>
                      <span className="font-bold text-neutral-900 truncate block">
                        {schedule.hotel_madinah.name}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-neutral-200/70">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  Izin PPIU {brandPpiu}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  100% Pasti Berangkat
                </span>
              </div>
            </div>

            <div>
              <h1 className="text-[16px] sm:text-[17px] font-bold text-neutral-900 font-heading tracking-tight">
                Pilih Kamar & Jumlah Jamaah
              </h1>
              <p className="text-[11.5px] text-neutral-500 mt-0.5 font-normal">
                Pilih tipe kamar dan tentukan jumlah pax jamaah.
              </p>
            </div>

            {/* List Room Cards */}
            <div className="space-y-3 pt-1">
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

              {/* Sticky Bottom Action Bar */}
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 backdrop-blur-md border-t border-x border-[#DDE2EC] px-4 py-3 shadow-lg flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-neutral-500 font-medium truncate">
                    {totalPax > 0 ? (
                      <>
                        {totalReguler > 0 ? `Total ${totalReguler} Pax Jamaah` : ''}
                        {counts.infant > 0 ? `${totalReguler > 0 ? ' + ' : 'Total '}${counts.infant} Infant` : ''}
                      </>
                    ) : (
                      'Pilih Kamar'
                    )}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-[17px] font-black text-neutral-900 leading-none tracking-tight">
                      {formatRp(totalPrice)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goToStep2}
                  disabled={totalReguler <= 0}
                  className="h-[42px] px-5 flex items-center justify-center gap-1.5 rounded-xl bg-brand text-white hover:brightness-110 active:scale-95 transition-all text-[12px] font-bold shadow-xs disabled:opacity-40 disabled:pointer-events-none shrink-0 cursor-pointer"
                >
                  <span>Isi Data Jamaah</span>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: DATA LENGKAP JAMAAH ─── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Mini Package Summary Chip */}
              <div className="p-3 rounded-2xl bg-neutral-50/90 border border-neutral-200/80 flex items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0">
                  <span className="font-bold text-neutral-900 truncate block text-[12px]">
                    {schedule?.jadwal_nama}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {totalReguler} Jamaah{counts.infant > 0 ? ` + ${counts.infant} Infant` : ''} • Total: {formatRp(totalPrice)}
                  </span>
                </div>
                <span className="text-[10.5px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full shrink-0">
                  {formatDate(schedule?.berangkat_tanggal)}
                </span>
              </div>

              <div>
                <h1 className="text-[16px] sm:text-[17px] font-bold text-neutral-900 font-heading tracking-tight">
                  Data Jamaah
                </h1>
                <p className="text-[11.5px] text-neutral-500 mt-0.5 font-normal">
                  Isi data jamaah sesuai identitas resmi KTP/Paspor.
                </p>
              </div>

              {/* Section Jamaah Utama */}
              <div id="section-jamaah-utama" className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-3.5">
                <div className="pb-2 border-b border-neutral-100">
                  <h3 className="font-bold text-neutral-800 text-sm">
                    Jamaah Utama
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Penanggung jawab booking dan pemegang akun Portal Jamaah.
                  </p>
                </div>

                {agenMode && (
                  picJamaahId
                    ? chipJamaahSaya(picNama, () => {
                        setPicJamaahId(null);
                        setPicNama('');
                        setPicGender('');
                      })
                    : (
                      <div className="space-y-1.5">
                        {jamaahSaya.length > 0 && pilihJamaahSaya((j) => {
                          setPicJamaahId(j.id);
                          setPicNama(j.nama_lengkap);
                          setPicGender(j.jenis_kelamin || 'L');
                          setPicPhone('');
                        })}
                        <p className="text-[11px] text-neutral-500 leading-relaxed">
                          Jamaah baru tercatat sebagai jamaah Anda. Nomor yang sudah terdaftar atas nama jamaah lain tidak bisa dipakai.
                        </p>
                      </div>
                    )
                )}

                {!(agenMode && picJamaahId) && (
                <>

                {loggedInUser && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-neutral-900">{loggedInUser.nama_lengkap}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-neutral-600 border border-neutral-200">
                            {loggedInUser.id_jamaah || 'Akun Aktif'}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          Terhubung ke akun Portal Jamaah Anda.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(true)}
                      className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 underline transition-colors shrink-0 cursor-pointer"
                    >
                      Bukan Anda? Keluar
                    </button>
                  </div>
                )}

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
                    No. WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={picPhone}
                      readOnly={Boolean(loggedInUser)}
                      onChange={(e) => {
                        if (loggedInUser) return;
                        const val = e.target.value.replace(/\D/g, '');
                        setPicPhone(val);
                        if (val !== lastCheckedPhone) {
                          setPhoneCheckStatus('idle');
                        }
                      }}
                      onBlur={() => !loggedInUser && !agenMode && checkPhone(picPhone)}
                      placeholder="08123456789"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand font-mono ${
                        loggedInUser ? 'bg-neutral-100 text-neutral-600 cursor-not-allowed pr-28' : 'bg-white'
                      }`}
                    />
                    {loggedInUser && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Terverifikasi</span>
                      </span>
                    )}
                  </div>
                  {loggedInUser && (
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Nomor akun terkunci agar pemesanan terhubung ke akun Anda.
                    </p>
                  )}
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
                </>
                )}

                {/* Cabang 1: Checking */}
                {phoneCheckStatus === 'checking' && (
                  <div className="pt-2 border-t border-neutral-100 flex items-center gap-2 text-xs text-neutral-500 py-1 animate-in fade-in duration-100">
                    <svg className="w-4 h-4 animate-spin text-neutral-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Memeriksa nomor...</span>
                  </div>
                )}

                {/* Cabang 2: Baru (Buat PIN + Konfirmasi PIN) */}
                {phoneCheckStatus === 'baru' && (
                  <div className="pt-2 border-t border-neutral-100 animate-in fade-in duration-150">
                    <div className="mb-3">
                      <h4 className="font-bold text-neutral-800 text-xs sm:text-sm">
                        Buat PIN Akun Portal Jamaah
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                        Akses informasi perjalanan, pembayaran, visa, tiket, manasik, dan persiapan umroh Anda dalam satu tempat.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                            placeholder="Masukkan 6 digit angka"
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
                )}

                {/* Cabang 3: Perlu PIN */}
                {phoneCheckStatus === 'perlu_pin' && (
                  <div className="pt-2 border-t border-neutral-100 space-y-2 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Masukkan PIN Portal Jamaah Anda <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPinVerify ? 'text' : 'password'}
                          maxLength={6}
                          value={picPinVerify}
                          onChange={(e) => setPicPinVerify(e.target.value.replace(/\D/g, ''))}
                          placeholder="Masukkan 6 digit angka"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white font-mono tracking-widest pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPinVerify(!showPinVerify)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                        >
                          {showPinVerify ? (
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
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Nomor ini sudah terdaftar. Masukkan PIN akun Anda untuk melanjutkan. Lupa PIN? Hubungi admin travel atau gunakan nomor lain.
                    </p>
                  </div>
                )}

                {/* Cabang 4: Tanpa PIN */}
                {phoneCheckStatus === 'tanpa_pin' && (
                  <div className="pt-2 border-t border-neutral-100 animate-in fade-in duration-150">
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Nomor ini sudah terdaftar. Akses Portal Jamaah akan diatur oleh admin travel setelah booking selesai.
                    </p>
                  </div>
                )}

                {/* Cabang 5: Logged In */}
                {phoneCheckStatus === 'logged_in' && (
                  <div className="pt-2 border-t border-neutral-100 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-medium">Sesi login terverifikasi. Tidak diperlukan input PIN.</span>
                    </div>
                  </div>
                )}

                {totalReguler > 1 && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Pilih Kamar <span className="text-red-500">*</span>
                    </label>
                    <CustomSelect
                      value={picRoomType}
                      onChange={(val) => handleRoomTypeChange(val)}
                      placeholder="-- Pilih Tipe Kamar --"
                      options={[
                        ...(counts.quad > 0 ? [{ value: 'Quad', label: 'QUAD (Sekamar ber-4)' }] : []),
                        ...(counts.triple > 0 ? [{ value: 'Triple', label: 'TRIPLE (Sekamar ber-3)' }] : []),
                        ...(counts.double > 0 ? [{ value: 'Double', label: 'DOUBLE (Sekamar ber-2)' }] : []),
                      ]}
                    />
                  </div>
                )}
              </div>

              {/* Grup Kamar QUAD */}
              {counts.quad > 0 && (
                <div className="space-y-3">
                  <span className="bg-neutral-900 text-white text-[11px] font-bold px-3 py-1 rounded-md inline-block uppercase">
                    QUAD (Sekamar ber-4)
                  </span>

                  {Array.from({ length: counts.quad }).map((_, idx) => {
                    const isPic = picRoomType === 'Quad' && picSlotIndex === idx;
                    return (
                      <div key={`q_${idx}`} className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                          <span className="font-bold text-neutral-800 text-sm">
                            Jamaah {idx + 1}
                          </span>
                          {isPic && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                              JAMAAH UTAMA
                            </span>
                          )}
                        </div>

                        {isPic ? (
                          <div>
                            <div className={`text-sm font-bold ${picNama.trim() ? 'text-neutral-900' : 'text-neutral-400 font-normal italic'}`}>
                              {picNama.trim() || 'Belum diisi'}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                              Data diisi di bagian Jamaah Utama di atas.{' '}
                              <button
                                type="button"
                                onClick={() => document.getElementById('section-jamaah-utama')?.scrollIntoView({ behavior: 'smooth' })}
                                className="font-semibold text-neutral-800 underline hover:text-neutral-950 cursor-pointer"
                              >
                                Ubah di Jamaah Utama
                              </button>
                            </p>
                          </div>
                        ) : (
                          <>
                            {agenMode && renderSlotJamaahSaya(jamaahQuad, setJamaahQuad, idx)}
                            {!jamaahQuad[idx]?.jamaah_id && (
                            <>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                Nama Lengkap (Sesuai KTP/Paspor) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={jamaahQuad[idx]?.nama || ''}
                                onChange={(e) => {
                                  const arr = [...jamaahQuad];
                                  arr[idx] = { ...arr[idx], nama: e.target.value };
                                  setJamaahQuad(arr);
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
                                  value={jamaahQuad[idx]?.jenis_kelamin || ''}
                                  onChange={(val) => {
                                    const arr = [...jamaahQuad];
                                    arr[idx] = { ...arr[idx], jenis_kelamin: val };
                                    setJamaahQuad(arr);
                                  }}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                  No. WhatsApp <span className="text-neutral-400 font-normal">(Opsional)</span>
                                </label>
                                <input
                                  type="tel"
                                  value={jamaahQuad[idx]?.no_hp || ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    const arr = [...jamaahQuad];
                                    arr[idx] = { ...arr[idx], no_hp: val };
                                    setJamaahQuad(arr);
                                  }}
                                  placeholder="08123456789"
                                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white font-mono"
                                />
                              </div>
                            </div>
                            </>
                            )}
                          </>
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
                    const isPic = picRoomType === 'Triple' && picSlotIndex === idx;
                    const paxNum = counts.quad + idx + 1;
                    return (
                      <div key={`t_${idx}`} className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                          <span className="font-bold text-neutral-800 text-sm">
                            Jamaah {paxNum}
                          </span>
                          {isPic && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                              JAMAAH UTAMA
                            </span>
                          )}
                        </div>

                        {isPic ? (
                          <div>
                            <div className={`text-sm font-bold ${picNama.trim() ? 'text-neutral-900' : 'text-neutral-400 font-normal italic'}`}>
                              {picNama.trim() || 'Belum diisi'}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                              Data diisi di bagian Jamaah Utama di atas.{' '}
                              <button
                                type="button"
                                onClick={() => document.getElementById('section-jamaah-utama')?.scrollIntoView({ behavior: 'smooth' })}
                                className="font-semibold text-neutral-800 underline hover:text-neutral-950 cursor-pointer"
                              >
                                Ubah di Jamaah Utama
                              </button>
                            </p>
                          </div>
                        ) : (
                          <>
                            {agenMode && renderSlotJamaahSaya(jamaahTriple, setJamaahTriple, idx)}
                            {!jamaahTriple[idx]?.jamaah_id && (
                            <>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                Nama Lengkap (Sesuai KTP/Paspor) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={jamaahTriple[idx]?.nama || ''}
                                onChange={(e) => {
                                  const arr = [...jamaahTriple];
                                  arr[idx] = { ...arr[idx], nama: e.target.value };
                                  setJamaahTriple(arr);
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
                                  value={jamaahTriple[idx]?.jenis_kelamin || ''}
                                  onChange={(val) => {
                                    const arr = [...jamaahTriple];
                                    arr[idx] = { ...arr[idx], jenis_kelamin: val };
                                    setJamaahTriple(arr);
                                  }}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                  No. WhatsApp <span className="text-neutral-400 font-normal">(Opsional)</span>
                                </label>
                                <input
                                  type="tel"
                                  value={jamaahTriple[idx]?.no_hp || ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    const arr = [...jamaahTriple];
                                    arr[idx] = { ...arr[idx], no_hp: val };
                                    setJamaahTriple(arr);
                                  }}
                                  placeholder="08123456789"
                                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white font-mono"
                                />
                              </div>
                            </div>
                            </>
                            )}
                          </>
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
                    const isPic = picRoomType === 'Double' && picSlotIndex === idx;
                    const paxNum = counts.quad + counts.triple + idx + 1;
                    return (
                      <div key={`d_${idx}`} className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                          <span className="font-bold text-neutral-800 text-sm">
                            Jamaah {paxNum}
                          </span>
                          {isPic && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                              JAMAAH UTAMA
                            </span>
                          )}
                        </div>

                        {isPic ? (
                          <div>
                            <div className={`text-sm font-bold ${picNama.trim() ? 'text-neutral-900' : 'text-neutral-400 font-normal italic'}`}>
                              {picNama.trim() || 'Belum diisi'}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                              Data diisi di bagian Jamaah Utama di atas.{' '}
                              <button
                                type="button"
                                onClick={() => document.getElementById('section-jamaah-utama')?.scrollIntoView({ behavior: 'smooth' })}
                                className="font-semibold text-neutral-800 underline hover:text-neutral-950 cursor-pointer"
                              >
                                Ubah di Jamaah Utama
                              </button>
                            </p>
                          </div>
                        ) : (
                          <>
                            {agenMode && renderSlotJamaahSaya(jamaahDouble, setJamaahDouble, idx)}
                            {!jamaahDouble[idx]?.jamaah_id && (
                            <>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                Nama Lengkap (Sesuai KTP/Paspor) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={jamaahDouble[idx]?.nama || ''}
                                onChange={(e) => {
                                  const arr = [...jamaahDouble];
                                  arr[idx] = { ...arr[idx], nama: e.target.value };
                                  setJamaahDouble(arr);
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
                                  value={jamaahDouble[idx]?.jenis_kelamin || ''}
                                  onChange={(val) => {
                                    const arr = [...jamaahDouble];
                                    arr[idx] = { ...arr[idx], jenis_kelamin: val };
                                    setJamaahDouble(arr);
                                  }}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                  No. WhatsApp <span className="text-neutral-400 font-normal">(Opsional)</span>
                                </label>
                                <input
                                  type="tel"
                                  value={jamaahDouble[idx]?.no_hp || ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    const arr = [...jamaahDouble];
                                    arr[idx] = { ...arr[idx], no_hp: val };
                                    setJamaahDouble(arr);
                                  }}
                                  placeholder="08123456789"
                                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg input-brand bg-white font-mono"
                                />
                              </div>
                            </div>
                            </>
                            )}
                          </>
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
                          </div>
                        </div>

                        {isOverAge && (
                          <p className="text-[11px] text-red-600 font-normal leading-relaxed">
                            ⚠️ Usia bayi &ge; 2 tahun pada tanggal keberangkatan ({formatDate(schedule?.berangkat_tanggal)}). Silakan pilih kamar reguler.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sticky Bottom Action Bar */}
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 backdrop-blur-md border-t border-x border-[#DDE2EC] px-4 py-3 shadow-lg flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-[42px] px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] transition-colors cursor-pointer shrink-0"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={goToStep3}
                  disabled={!picRoomType || (!agenMode && (phoneCheckStatus === 'idle' || phoneCheckStatus === 'checking' || phoneCheckStatus === 'error'))}
                  className="btn-brand-cta flex-1 h-[42px] rounded-xl font-bold text-white text-[12px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>Lanjut Konfirmasi</span>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: KONFIRMASI PENDAFTARAN ─── */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Mini Package Summary Chip */}
              <div className="p-3 rounded-2xl bg-neutral-50/90 border border-neutral-200/80 flex items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0">
                  <span className="font-bold text-neutral-900 truncate block text-[12px]">
                    {schedule?.jadwal_nama}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {totalReguler} Jamaah • Total: {formatRp(totalPrice)}
                  </span>
                </div>
                <span className="text-[10.5px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full shrink-0">
                  {formatDate(schedule?.berangkat_tanggal)}
                </span>
              </div>

              <div>
                <h1 className="text-[16px] sm:text-[17px] font-bold text-neutral-900 font-heading tracking-tight">
                  Konfirmasi Booking
                </h1>
                <p className="text-[11.5px] text-neutral-500 mt-0.5 font-normal">
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

                <div className="px-5 py-3 bg-neutral-50/50 border-t border-neutral-100 text-xs text-neutral-500">
                  <span>Akun Portal Jamaah untuk: </span>
                  <strong className="text-neutral-800">{picNama}</strong>
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

              {/* Sticky Bottom Action Bar */}
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 backdrop-blur-md border-t border-x border-[#DDE2EC] px-4 py-3 shadow-lg flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-[42px] px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] transition-colors cursor-pointer shrink-0"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={loading || !agree}
                  className="btn-brand-cta flex-1 h-[42px] rounded-xl font-bold text-white text-[12px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>{loading ? 'Memproses Booking...' : 'Konfirmasi & Bayar DP'}</span>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
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
    </div>
  );
}
