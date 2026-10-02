'use client';
import { mediaUrl } from '@/lib/mediaUrl';
import { packagePricing, scheduleBelongsToBrand, roomSavings } from '@/lib/packagePolicy.mjs';
import { TERMS_VERSION, paymentTerms, validPhone, validInfant } from '@/lib/checkoutPolicy.mjs';
import useDialogFocus from '@/components/ui/useDialogFocus';
import CustomDropdown from '@/components/ui/CustomDropdown';
import useBookingAccessibility from './useBookingAccessibility';
import BookingTermsContent from './BookingTermsContent';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getMe, listJamaahSaya, buatBookingAgen } from '@/lib/portalApi';
import Turnstile from '@/components/ui/Turnstile';

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

// Dropdown form wizard: memakai CustomDropdown (bawaan: jenis kelamin).
function CustomSelect({ value, onChange, options, placeholder = 'Pilih jenis kelamin' }) {
  return (
    <CustomDropdown
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      options={options || [{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]}
    />
  );
}
export default function BookingWizard({
  schedule,
  brandName,
  brandColor,
  brandId,
  brandWhatsapp = '',
  brandPpiu = '',
  brandLegal = '',
  initialRoom = 'quad',
  initialBankAccounts = [],
  travelAccounts = [],
  // Mode agen (Jalur 1, screen A5): agen login membuat booking untuk
  // jamaahnya. Agen bukan PIC; tanpa cek nomor dan PIN; pax bisa dipilih
  // dari "Jamaah Saya" (repeat order). Dikirim ke /api/portal/agen/bookings.
  agenMode = false,
  draftOwnerId = null,
  onQuoteChanged = null
}) {
  const router = useRouter();
  // Active step: 1 (Kamar), 2 (Data Jamaah), 3 (Konfirmasi), 4 (Pembayaran)
  const [step, setStep] = useState(1);
  // Tandai langkah aktif di <html> agar header halaman (server component) bisa
  // menyembunyikan ikon kembali di luar langkah 1 lewat CSS (.booking-back-link).
  useEffect(() => {
    document.documentElement.dataset.bookingStep = String(step);
    return () => { delete document.documentElement.dataset.bookingStep; };
  }, [step]);
  const formRef = useBookingAccessibility(step);
  const requestKey = useRef(null);
  const phoneRequest = useRef(0);

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
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef(null);

  // UI States
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [pendingRoomSwap, setPendingRoomSwap] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [showPaketDetail, setShowPaketDetail] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const activeAccounts = (initialBankAccounts && initialBankAccounts.length > 0) ? initialBankAccounts : ((travelAccounts && travelAccounts.length > 0) ? travelAccounts : []);

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // Drawer syarat & ketentuan: dibaca tanpa meninggalkan halaman checkout.
  const [showTerms, setShowTerms] = useState(false);
  // Draf formulir disimpan otomatis (sessionStorage: tab ini saja, 30 menit,
  // PIN tidak disimpan). Saat halaman dibuka dan ada draf milik pemesan yang
  // sama, tampil banner "Lanjutkan isian sebelumnya?". Simpan otomatis baru
  // aktif setelah pilihan banner, agar draf lama tidak tertimpa formulir kosong.
  const [authChecked, setAuthChecked] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const draftKey = `booking_draft_${brandId}_${schedule?.id}`;
  const draftOwner = draftOwnerId || loggedInUser?.id || null;
  const readDraft = () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (!saved || saved.expires <= Date.now() || saved.mode !== agenMode || saved.owner !== draftOwner) {
        sessionStorage.removeItem(draftKey);
        return null;
      }
      return saved;
    } catch {
      return null;
    }
  };
  useEffect(() => {
    try { sessionStorage.removeItem(`booking_result_${schedule?.id}`); } catch {}
  }, [schedule?.id]);
  // Pemilik draf bergantung pada sesi login, jadi diputuskan setelah checkAuth selesai.
  useEffect(() => {
    if (!authChecked || draftReady || draftPrompt) return;
    if (readDraft()) setDraftPrompt(true);
    else setDraftReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, draftKey, draftOwner]);
  const restoreDraft = () => {
    const saved = readDraft();
    setDraftPrompt(false);
    setDraftReady(true);
    if (!saved) { setAlertMsg('Isian sebelumnya sudah kedaluwarsa.'); return; }
    const f = saved.fields;
    setCounts(f.counts); setPicNama(f.picNama); setPicGender(f.picGender); setPicPhone(f.picPhone); setPicEmail(f.picEmail); setPicRoomType(f.picRoomType); setPicSlotIndex(f.picSlotIndex);
    setJamaahQuad(f.jamaahQuad); setJamaahTriple(f.jamaahTriple); setJamaahDouble(f.jamaahDouble); setJamaahInfant(f.jamaahInfant); setPicJamaahId(f.picJamaahId);
    setPhoneCheckStatus(loggedInUser ? 'logged_in' : 'idle'); setAgree(false); setStep(1);
  };
  const discardDraft = () => {
    try { sessionStorage.removeItem(draftKey); } catch {}
    setDraftPrompt(false);
    setDraftReady(true);
  };
  const alertRef = useDialogFocus(Boolean(alertMsg));
  const swapRef = useDialogFocus(Boolean(pendingRoomSwap));
  const logoutRef = useDialogFocus(showLogoutModal);
  const termsRef = useDialogFocus(showTerms);
  useEffect(() => {
    const close = e => { if (e.key === 'Escape') { setAlertMsg(''); setPendingRoomSwap(null); setShowLogoutModal(false); setShowTerms(false); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  // Mode agen: daftar jamaah milik agen + jamaah terpilih sebagai PIC.
  const [jamaahSaya, setJamaahSaya] = useState([]);
  const [picJamaahId, setPicJamaahId] = useState(null);

  // Simpan otomatis draf (langkah 1-3). Isian kosong, termasuk data PIC yang
  // hanya terisi otomatis dari profil login, tidak disimpan.
  useEffect(() => {
    if (!draftReady || step >= 4) return undefined;
    const timer = setTimeout(() => {
      const paxDiisi = [jamaahQuad, jamaahTriple, jamaahDouble, jamaahInfant]
        .some((list) => list.some((p) => p && (p.nama || p.no_hp || p.tanggal_lahir || p.jamaah_id)));
      const picDiisi = loggedInUser
        ? picNama !== (loggedInUser.nama_lengkap || '') || picPhone !== (loggedInUser.no_hp || '') || picEmail !== (loggedInUser.email || '')
        : Boolean(picNama || picPhone || picEmail);
      if (!paxDiisi && !picDiisi && !picJamaahId) return;
      try {
        const fields = { counts, picNama, picGender, picPhone, picEmail, picRoomType, picSlotIndex, jamaahQuad, jamaahTriple, jamaahDouble, jamaahInfant, picJamaahId };
        sessionStorage.setItem(draftKey, JSON.stringify({ expires: Date.now() + 30 * 60 * 1000, fields, mode: agenMode, owner: draftOwner }));
      } catch {
        // Penyimpanan diblokir perangkat: formulir tetap berjalan tanpa draf.
      }
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftReady, step, counts, picNama, picGender, picPhone, picEmail, picRoomType, picSlotIndex, jamaahQuad, jamaahTriple, jamaahDouble, jamaahInfant, picJamaahId, draftKey, draftOwner]);

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
    <CustomDropdown
      value=""
      onChange={(id) => {
        const j = jamaahSaya.find((x) => String(x.id) === String(id));
        if (j) onPick(j);
      }}
      placeholder="Pilih dari Jamaah Saya (repeat order)"
      options={jamaahSaya.filter((j) => !usedJamaahIds.has(j.id)).map((j) => ({
        value: j.id,
        label: j.nama_lengkap,
        sublabel: j.no_hp_masked || undefined,
      }))}
    />
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

    checkAuth().finally(() => setAuthChecked(true));
  }, [schedule?.brand_id, brandId, agenMode]);

  const handleLogoutAuth = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portal_access_token');
      sessionStorage.removeItem(`booking_draft_${brandId}_${schedule?.id}`);
      sessionStorage.removeItem(`booking_result_${schedule?.id}`);
    }
    requestKey.current = null;
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
  const rawLogo = schedule?.maskapai?.logo_url || schedule?.airline_logo || schedule?.maskapai_logo;
  const airlineLogoUrl = rawLogo
    ? mediaUrl(rawLogo)
    : null;

  // Room Prices from Schedule
  const priceQuad = schedule?.harga_quad || 0;
  const priceTriple = schedule?.harga_triple ?? 0;
  const priceDouble = schedule?.harga_double ?? 0;
  const { infantAvailable, infantPrice: priceInfant, dp: effectiveDP } = packagePricing(schedule);
  const dpPerPax = effectiveDP ?? 0;
  const pricingReady = effectiveDP !== null && effectiveDP >= 0 && effectiveDP <= Math.min(priceQuad, priceTriple, priceDouble);
  const brandMatches = scheduleBelongsToBrand(schedule, brandId);
  const seatSisa = schedule?.seat_sisa ?? 0;
  // Promo (harga coret) hanya untuk Quad; berlaku sampai promo_until pukul 23.59 WIB.
  const hariIniWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const promoAktif = Boolean(schedule?.is_promo) && !(schedule?.promo_until && String(schedule.promo_until).slice(0, 10) < hariIniWIB);
  const hematQuad = promoAktif ? roomSavings(schedule, 'quad') : 0;

  // Total Calculations
  const totalReguler = counts.quad + counts.triple + counts.double;
  const totalPax = totalReguler + counts.infant;
  const totalPrice =
    counts.quad * priceQuad +
    counts.triple * priceTriple +
    counts.double * priceDouble +
    counts.infant * priceInfant;
  const { minimum: totalDp, fullPayment } = paymentTerms(schedule, totalReguler, totalPrice);

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
    if (type === 'infant' && !infantAvailable && delta > 0) return;
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
    if (clean === lastCheckedPhone && ['baru','perlu_pin','tanpa_pin'].includes(phoneCheckStatus)) return;
    const sequence = ++phoneRequest.current;
    if (!validPhone(clean)) {
      setPhoneCheckStatus('idle');
      return;
    }

    setPhoneCheckStatus('checking');
    try {
      const targetBrandId = Number(brandId);
      const res = await fetch('/api/public/jamaah/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: targetBrandId,
          no_hp: clean,
        }),
      });
      if (sequence !== phoneRequest.current) return;

      if (!res.ok) {
        setPhoneCheckStatus('error');
        const error = await res.json().catch(() => ({}));
        showAlert(error.error || 'Gagal memeriksa nomor, coba lagi sebentar lagi.');
        return;
      }

      const data = await res.json();
      setPhoneCheckStatus(data.status || 'error');
      setLastCheckedPhone(clean);
    } catch (err) {
      if (sequence !== phoneRequest.current) return;
      setPhoneCheckStatus('error');
      setLastCheckedPhone(clean);
      showAlert('Gagal memeriksa nomor, coba lagi sebentar lagi.');
    }
  };

  // Cek otomatis setelah jeda mengetik, dan saat nomor terisi dari draf. Tanpa
  // ini tombol Lanjut terkunci sampai field di-blur, padahal tombol yang
  // disabled tidak mengambil fokus saat diketuk.
  useEffect(() => {
    if (step !== 2 || loggedInUser || agenMode || phoneCheckStatus !== 'idle' || !validPhone(picPhone)) return undefined;
    const timer = setTimeout(() => checkPhone(picPhone), 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, picPhone, phoneCheckStatus, loggedInUser, agenMode]);

  // Navigation: Step 1 -> Step 2
  const goToStep2 = () => {
    if (!pricingReady || !brandMatches) { showAlert('Paket atau konfigurasi harga tidak tersedia. Muat ulang halaman atau hubungi admin.'); return; }
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

    // Hanya satu tipe kamar reguler dipilih: kamar jamaah utama sudah pasti,
    // jadi diisi otomatis (field "Pilih Kamar" tidak ditampilkan).
    const tipeDipilih = [['Quad', counts.quad], ['Triple', counts.triple], ['Double', counts.double]].filter(([, n]) => n > 0);
    if (tipeDipilih.length === 1) {
      const [autoType, autoCount] = tipeDipilih[0];
      const slotMasihValid = picRoomType === autoType && picSlotIndex !== null && picSlotIndex < autoCount;
      setPicRoomType(autoType);
      if (!slotMasihValid) setPicSlotIndex(0);
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

  // Nomor jamaah di form: pemesan selalu 1, lainnya berurutan Quad -> Triple
  // -> Double melewati slot pemesan (sama dengan urutan pax di invoice).
  const nomorJamaah = (type, idx) => {
    if (picRoomType === type && picSlotIndex === idx) return 1;
    let n = picRoomType ? 1 : 0;
    for (const [t, c] of [['Quad', counts.quad], ['Triple', counts.triple], ['Double', counts.double]]) {
      for (let i = 0; i < c; i++) {
        if (picRoomType === t && picSlotIndex === i) continue;
        n += 1;
        if (t === type && i === idx) return n;
      }
    }
    return n;
  };

  // Navigation: Step 2 -> Step 3
  const goToStep3 = () => {
    const invalid = formRef.current?.querySelector('input:invalid,select:invalid');
    if (invalid) { invalid.reportValidity(); invalid.focus(); return; }
    if (!picRoomType) {
      showAlert(agenMode ? 'Pilih kamar penanggung jawab rombongan.' : 'Pilih kamar Anda.');
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
    if (!(agenMode && picJamaahId) && !validPhone(cleanPhone)) {
      showAlert('Nomor WhatsApp Pemesan harus 10–15 digit.');
      return;
    }
    if (!agenMode && phoneCheckStatus === 'baru' && (!/^\d{6}$/.test(picPin) || picPin !== picPinConfirm)) { showAlert('Isi PIN 6 digit angka dan konfirmasi yang sama.'); return; }
    if (!agenMode && phoneCheckStatus === 'perlu_pin' && !/^\d{6}$/.test(picPinVerify)) { showAlert('PIN portal harus 6 digit angka.'); return; }

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
      if (!validInfant(inf.tanggal_lahir, schedule.berangkat_tanggal)) {
        showAlert(`Usia Bayi ${inf.nama.trim()} mencapai 2 tahun atau lebih saat keberangkatan.`);
        return;
      }
    }

    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Booking (Step 3 -> Step 4)
  const handleSubmitBooking = async () => {
    if (loading) return;
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
        terms_version: TERMS_VERSION,
        terms_accepted: agree,
        expected_total: totalPrice,
        expected_dp: totalDp,
        brand_id: Number(brandId),
        schedule_id: schedule?.id,
        captcha_token: agenMode ? '' : turnstileToken,
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
      if (!requestKey.current) requestKey.current = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');
      payload.request_key = requestKey.current;

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
        try { localStorage.setItem('portal_access_token', data.portal_token); } catch {}
      }

      const resultData = {
        kode_booking: data.booking?.booking_code,
        total_harga: data.booking?.total_harga,
        nominal_dp: data.booking?.minimal_dp,
        portal_token: data.portal_token,
        bank_accounts: data.bank_accounts,
        pic_phone: picPhone.replace(/\D/g, ''),
        invoice_token: data.booking?.invoice_token,
      };

      try {
        const storageKey = `booking_result_${schedule?.id}`;
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem(`booking_draft_${brandId}_${schedule?.id}`);
      } catch (e) {}

      setBookingResult(resultData);
      // Redirect ke Digital Invoice URL permanen
      if (data.booking?.invoice_token) {
        router.push(`/invoice/${data.booking.invoice_token}`);
      } else {
        setStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      // Token Turnstile sekali pakai: minta token baru untuk percobaan berikutnya.
      turnstileRef.current?.reset();
      const msg = err.message || 'Gagal mengirim formulir booking. Silakan coba lagi.';
      if (msg.includes('kunci pemesanan')) requestKey.current = null;
      if (msg.includes('harga atau DP berubah')) {
        setAgree(false);
        requestKey.current = null;
        if (onQuoteChanged) await onQuoteChanged();
        else router.refresh();
      }
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
      isPic,
      num: paxIndex++,
      nama: isPic ? picNama : (jamaahQuad[i]?.nama || `Jamaah ${paxIndex - 1}`),
      sub: `Kamar Quad • ${(isPic ? picGender : jamaahQuad[i]?.jenis_kelamin) === 'L' ? 'Laki-laki' : 'Perempuan'}`,
      price: priceQuad,
    });
  }

  for (let i = 0; i < counts.triple; i++) {
    const isPic = picRoomType === 'Triple' && picSlotIndex === i;
    summaryJamaahList.push({
      isPic,
      num: paxIndex++,
      nama: isPic ? picNama : (jamaahTriple[i]?.nama || `Jamaah ${paxIndex - 1}`),
      sub: `Kamar Triple • ${(isPic ? picGender : jamaahTriple[i]?.jenis_kelamin) === 'L' ? 'Laki-laki' : 'Perempuan'}`,
      price: priceTriple,
    });
  }

  for (let i = 0; i < counts.double; i++) {
    const isPic = picRoomType === 'Double' && picSlotIndex === i;
    summaryJamaahList.push({
      isPic,
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

  // Pemesan selalu nomor 1 (sama dengan langkah 2 dan urutan pax di invoice).
  summaryJamaahList.sort((a, b) => Number(Boolean(b.isPic)) - Number(Boolean(a.isPic)));
  summaryJamaahList.forEach((j, i) => {
    j.num = i + 1;
    if (j.isPic) j.nama = `${j.nama} (${agenMode ? 'penanggung jawab' : 'Anda'})`;
  });

  return (
    <div ref={formRef} className="space-y-6 pb-20 sm:pb-0" style={{ '--brand-primary': activeColor }}>
      {/* Judul langkah tetap ada untuk pembaca layar & fokus; secara visual stepper sudah menunjukkannya. */}
      <h2 data-step-heading tabIndex={-1} className="sr-only">Langkah {step}: {['','Pilih kamar','Data jamaah','Periksa dan setujui','Hasil pemesanan'][step]}</h2>
      {step >= 2 && (
        <div role="note" className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{fullPayment ? 'Keberangkatan dalam 45 hari: pelunasan penuh diperlukan dalam 24 jam.' : 'Reservasi awal 24 jam. DP nol berarti tanpa minimum nominal, bukan biaya perjalanan gratis.'}</p>
        </div>
      )}
      {step < 4 && draftPrompt && (
        <div role="status" className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Lanjutkan isian sebelumnya?</p>
            <p className="text-xs text-neutral-600">Data pemesanan yang belum selesai masih tersimpan di perangkat ini.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={discardDraft} className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-700">Mulai baru</button>
            <button type="button" onClick={restoreDraft} className="rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-white">Lanjutkan</button>
          </div>
        </div>
      )}
      {(agenMode || phoneCheckStatus === 'tanpa_pin') && <p className="text-sm p-3 bg-amber-50 rounded-lg">PIC belum memiliki PIN? Setelah booking, hubungi admin untuk melengkapi tanggal lahir dan memperoleh link aktivasi. Bukti transfer dapat disampaikan melalui kontak resmi travel.</p>}
      {/* Alert Modal */}
      {alertMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div ref={alertRef} role="alertdialog" aria-modal="true" aria-label="Periksa formulir" tabIndex={-1} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-neutral-200 text-center space-y-4">
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
          <div ref={swapRef} role="dialog" aria-modal="true" aria-label="Konfirmasi ganti kamar" tabIndex={-1} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-neutral-200 text-center space-y-4">
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
          <div ref={logoutRef} role="dialog" aria-modal="true" aria-label="Konfirmasi keluar" tabIndex={-1} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-neutral-200 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-neutral-900 text-base">Keluar dari Akun?</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Anda akan keluar dari akun <strong>{loggedInUser?.nama_lengkap}</strong> dan data Anda di formulir akan dikosongkan untuk pendaftaran baru.
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
            {/* Ringkasan paket: satu baris, tanpa kartu. Detail (hotel, izin, tiket) bisa dibuka. */}
            <div className="pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{schedule?.jadwal_nama}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {[formatDate(schedule?.berangkat_tanggal), durationDays > 0 ? `${durationDays} hari` : null, schedule?.maskapai?.name].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaketDetail((v) => !v)}
                  aria-expanded={showPaketDetail}
                  aria-controls="paket-detail"
                  className="-mr-2 px-2 py-1.5 flex items-center gap-1 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100 shrink-0 cursor-pointer"
                >
                  Detail
                  <svg className={`w-4 h-4 transition-transform duration-200 ${showPaketDetail ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {showPaketDetail && (
                <dl id="paket-detail" className="mt-3 space-y-2 text-xs">
                  {[
                    ['Hotel Mekkah', schedule?.hotel_mekkah && `${schedule.hotel_mekkah.name}${schedule.hotel_mekkah.star_rating ? ` · ★ ${schedule.hotel_mekkah.star_rating}` : ''}`],
                    ['Hotel Madinah', schedule?.hotel_madinah && `${schedule.hotel_madinah.name}${schedule.hotel_madinah.star_rating ? ` · ★ ${schedule.hotel_madinah.star_rating}` : ''}`],
                    ['Penerbangan', [schedule?.maskapai?.name, schedule?.is_direct_flight ? 'Direct' : 'Transit'].filter(Boolean).join(' · ')],
                  ].filter(([, nilai]) => nilai).map(([label, nilai]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-neutral-500 shrink-0">{label}</dt>
                      <dd className="text-neutral-900 font-medium text-right">{nilai}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <div>
              <h1 className="text-base font-bold text-neutral-900 font-heading">Pilih kamar</h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Harga per orang
                {seatSisa > 0 && (
                  <>
                    {' · '}
                    {/* Label kelangkaan kursi: >=20 terbatas, <20 hampir habis, <10 jumlah pasti. */}
                    <span className="font-semibold text-danger-600">
                      {seatSisa < 10 ? `Sisa ${seatSisa} seat lagi!` : seatSisa < 20 ? 'Seat hampir habis!' : 'Seat terbatas!'}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Daftar kamar: baris dengan garis pemisah, tanpa kartu */}
            <ul className="divide-y divide-neutral-100">
              {[
                { key: 'quad', nama: 'Quad', ket: 'Sekamar 4 orang', harga: priceQuad, tag: 'Paling hemat', bisaTambah: totalReguler < seatSisa, hemat: hematQuad, coret: hematQuad > 0 ? schedule?.harga_coret : null },
                { key: 'triple', nama: 'Triple', ket: 'Sekamar 3 orang', harga: priceTriple, bisaTambah: totalReguler < seatSisa },
                { key: 'double', nama: 'Double', ket: 'Sekamar 2 orang', harga: priceDouble, bisaTambah: totalReguler < seatSisa },
                { key: 'infant', nama: 'Infant', ket: 'Bayi di bawah 2 tahun', harga: infantAvailable ? priceInfant : null, bisaTambah: infantAvailable },
              ].map((r) => {
                const jumlah = counts[r.key];
                const tidakTersedia = r.key === 'infant' && !infantAvailable;
                return (
                  <li key={r.key} className="flex items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">
                        {r.nama}
                        {r.tag && <span className="ml-2 text-xs font-medium text-emerald-700">{r.tag}</span>}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {r.ket} · {tidakTersedia ? 'belum tersedia, hubungi admin' : (
                          <span className="font-semibold text-neutral-900 whitespace-nowrap">{formatRp(r.harga)}</span>
                        )}
                      </p>
                      {r.hemat > 0 && (
                        <>
                          <p className="text-xs text-neutral-400 line-through whitespace-nowrap">{formatRp(r.coret)}</p>
                          <p className="text-xs font-medium text-emerald-700">
                            Hemat {r.hemat % 1000000 === 0 ? `Rp${r.hemat / 1000000} jt` : formatRp(r.hemat)}
                            {schedule?.promo_until
                              ? ` s.d. ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(`${String(schedule.promo_until).slice(0, 10)}T00:00:00+07:00`))}`
                              : ''}
                          </p>
                        </>
                      )}
                    </div>
                    {!tidakTersedia && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCount(r.key, -1)}
                          aria-label={`Kurangi jamaah ${r.nama}`}
                          disabled={jumlah <= 0}
                          className="relative p-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 disabled:border-neutral-100 disabled:text-neutral-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer after:absolute after:-inset-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" d="M5 12h14" />
                          </svg>
                        </button>
                        <span aria-live="polite" className={`w-6 text-center text-sm font-semibold tabular-nums ${jumlah > 0 ? 'text-brand' : 'text-neutral-500'}`}>{jumlah}</span>
                        <button
                          type="button"
                          onClick={() => updateCount(r.key, 1)}
                          aria-label={`Tambah jamaah ${r.nama}`}
                          disabled={!r.bisaTambah}
                          className="relative p-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 disabled:border-neutral-100 disabled:text-neutral-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer after:absolute after:-inset-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

              {(!pricingReady || !brandMatches || seatSisa <= 0) && <p role="alert" className="p-3 text-danger-700">{seatSisa <= 0 ? 'Kuota paket penuh. Hubungi admin untuk alternatif.' : 'Konfigurasi paket belum tersedia. Muat ulang atau hubungi admin.'}</p>}
              {/* Sticky Bottom Action Bar */}
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white border-t border-neutral-100 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-neutral-500 truncate">
                    {totalPax > 0 ? (
                      <>
                        {totalReguler > 0 ? `${totalReguler} jamaah` : ''}
                        {counts.infant > 0 ? `${totalReguler > 0 ? ' + ' : 'Total '}${counts.infant} infant` : ''}
                      </>
                    ) : (
                      'Belum ada kamar dipilih'
                    )}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-bold text-neutral-900 leading-none">
                      {formatRp(totalPrice)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goToStep2}
                  disabled={totalReguler <= 0 || totalReguler > seatSisa || !pricingReady || !brandMatches}
                  className="px-5 py-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand text-white hover:brightness-110 active:scale-95 transition-all text-sm font-semibold disabled:opacity-40 disabled:pointer-events-none shrink-0 cursor-pointer"
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

              <div>
                <h1 className="text-base font-bold text-neutral-900 font-heading">
                  Data Jamaah
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Isi data jamaah sesuai identitas resmi KTP/Paspor.
                </p>
              </div>

              {/* Section Jamaah Utama */}
              <div id="section-jamaah-utama" className="rounded-2xl bg-neutral-50 p-4 space-y-3.5">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0" aria-hidden="true"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></span>
                  <div>
                  <h3 className="font-bold text-neutral-800 text-sm">
                    {agenMode ? 'Penanggung jawab rombongan' : 'Data Anda'}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {agenMode
                      ? 'Ikut berangkat dan menjadi kontak utama booking ini.'
                      : 'Anda ikut berangkat. Nomor WhatsApp dipakai untuk akun Portal Jamaah.'}
                  </p></div>
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
                        <p className="text-xs text-neutral-500 leading-relaxed">
                          Jamaah baru tercatat sebagai jamaah Anda. Nomor yang sudah terdaftar atas nama jamaah lain tidak bisa dipakai.
                        </p>
                      </div>
                    )
                )}

                {!(agenMode && picJamaahId) && (
                <>

                {loggedInUser && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-neutral-900">{loggedInUser.nama_lengkap}</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white text-neutral-600 border border-neutral-200">
                            {loggedInUser.id_jamaah || 'Akun Aktif'}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Terhubung ke akun Portal Jamaah Anda.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(true)}
                      className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 underline transition-colors shrink-0 cursor-pointer"
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
                    className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white"
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
                        phoneRequest.current++;
                        if (val !== lastCheckedPhone) {
                          setPhoneCheckStatus('idle');
                        }
                      }}
                      onBlur={() => !loggedInUser && !agenMode && checkPhone(picPhone)}
                      placeholder="08123456789"
                      className={`w-full h-11 px-3.5 text-sm rounded-lg input-brand font-mono ${
                        loggedInUser ? 'bg-neutral-100 text-neutral-600 cursor-not-allowed pr-28' : 'bg-white'
                      }`}
                    />
                    {loggedInUser && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Terverifikasi</span>
                      </span>
                    )}
                  </div>
                  {loggedInUser && (
                    <p className="text-xs text-neutral-400 mt-1">
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
                    className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white"
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
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
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
                            className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white font-mono tracking-widest pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
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
                                  className={`w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white font-mono tracking-widest pr-10 ${
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
                                  aria-label={showPinConfirm ? 'Sembunyikan konfirmasi PIN' : 'Tampilkan konfirmasi PIN'}
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
                          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1 animate-in fade-in duration-100">
                            <svg className="w-3.5 h-3.5 text-emerald-600 stroke-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>PIN sesuai</span>
                          </p>
                        )}
                        {picPinConfirm.length === 6 && picPin !== picPinConfirm && (
                          <p className="text-xs text-red-600 font-normal mt-1 flex items-center gap-1 animate-in fade-in duration-100">
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
                          className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white font-mono tracking-widest pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPinVerify(!showPinVerify)}
                          aria-label={showPinVerify ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
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
                    <p className="text-xs text-neutral-500 leading-relaxed">
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

                {/* Hanya ditanyakan bila tipe kamar lebih dari satu; bila satu tipe, diisi otomatis. */}
                {[counts.quad, counts.triple, counts.double].filter((n) => n > 0).length > 1 && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      {agenMode ? 'Kamar penanggung jawab' : 'Kamar Anda'} <span className="text-red-500">*</span>
                    </label>
                    <CustomSelect
                      value={picRoomType}
                      onChange={(val) => handleRoomTypeChange(val)}
                      placeholder="Pilih tipe kamar"
                      options={[
                        ...(counts.quad > 0 ? [{ value: 'Quad', label: 'Quad · sekamar 4 orang' }] : []),
                        ...(counts.triple > 0 ? [{ value: 'Triple', label: 'Triple · sekamar 3 orang' }] : []),
                        ...(counts.double > 0 ? [{ value: 'Double', label: 'Double · sekamar 2 orang' }] : []),
                      ]}
                    />
                  </div>
                )}
              </div>

              {/* Grup Kamar QUAD */}
              {counts.quad > 0 && (
                <div className="rounded-2xl bg-neutral-50 p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0" aria-hidden="true"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0 4v-6a3 3 0 00-3-3h-7v6M7 11.5a2 2 0 100-4 2 2 0 000 4z" /></svg></span>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">Kamar Quad</p>
                      <p className="text-xs text-neutral-500">Sekamar 4 orang</p>
                    </div>
                  </div>

                  {Array.from({ length: counts.quad }).map((_, idx) => {
                    const isPic = picRoomType === 'Quad' && picSlotIndex === idx;
                    return (
                      <div key={`q_${idx}`} className="pt-4 border-t border-neutral-200/70 space-y-3.5">
                        {isPic ? (
                          <p className="rounded-xl bg-white px-3 py-2.5 text-sm text-neutral-900">
                            <span className="font-semibold">1. {picNama.trim() || 'Nama belum diisi'}</span>{' '}
                            <span className="text-neutral-500">({agenMode ? 'penanggung jawab' : 'Anda'})</span>
                          </p>
                        ) : (
                          <>
                            <span className="block font-bold text-neutral-800 text-sm">Jamaah {nomorJamaah('Quad', idx)}</span>

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
                                className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white"
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
                                  className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white font-mono"
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
                <div className="rounded-2xl bg-neutral-50 p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0" aria-hidden="true"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0 4v-6a3 3 0 00-3-3h-7v6M7 11.5a2 2 0 100-4 2 2 0 000 4z" /></svg></span>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">Kamar Triple</p>
                      <p className="text-xs text-neutral-500">Sekamar 3 orang</p>
                    </div>
                  </div>

                  {Array.from({ length: counts.triple }).map((_, idx) => {
                    const isPic = picRoomType === 'Triple' && picSlotIndex === idx;
                    return (
                      <div key={`t_${idx}`} className="pt-4 border-t border-neutral-200/70 space-y-3.5">
                        {isPic ? (
                          <p className="rounded-xl bg-white px-3 py-2.5 text-sm text-neutral-900">
                            <span className="font-semibold">1. {picNama.trim() || 'Nama belum diisi'}</span>{' '}
                            <span className="text-neutral-500">({agenMode ? 'penanggung jawab' : 'Anda'})</span>
                          </p>
                        ) : (
                          <>
                            <span className="block font-bold text-neutral-800 text-sm">Jamaah {nomorJamaah('Triple', idx)}</span>

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
                                className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white"
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
                                  className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white font-mono"
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
                <div className="rounded-2xl bg-neutral-50 p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0" aria-hidden="true"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0 4v-6a3 3 0 00-3-3h-7v6M7 11.5a2 2 0 100-4 2 2 0 000 4z" /></svg></span>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">Kamar Double</p>
                      <p className="text-xs text-neutral-500">Sekamar 2 orang</p>
                    </div>
                  </div>

                  {Array.from({ length: counts.double }).map((_, idx) => {
                    const isPic = picRoomType === 'Double' && picSlotIndex === idx;
                    return (
                      <div key={`d_${idx}`} className="pt-4 border-t border-neutral-200/70 space-y-3.5">
                        {isPic ? (
                          <p className="rounded-xl bg-white px-3 py-2.5 text-sm text-neutral-900">
                            <span className="font-semibold">1. {picNama.trim() || 'Nama belum diisi'}</span>{' '}
                            <span className="text-neutral-500">({agenMode ? 'penanggung jawab' : 'Anda'})</span>
                          </p>
                        ) : (
                          <>
                            <span className="block font-bold text-neutral-800 text-sm">Jamaah {nomorJamaah('Double', idx)}</span>

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
                                className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white"
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
                                  className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white font-mono"
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
                <div className="rounded-2xl bg-neutral-50 p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0" aria-hidden="true"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">Bayi</p>
                      <p className="text-xs text-neutral-500">Di bawah 2 tahun, tanpa kamar</p>
                    </div>
                  </div>

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
                          if (!validInfant(birthDateVal, schedule.berangkat_tanggal)) {
                            isOverAge = true;
                          }
                        }
                      }
                    }

                    const minAllowedDate = new Date(depDate.getFullYear() - 2, depDate.getMonth(), depDate.getDate() + 1).toISOString().split('T')[0];
                    const todayDate = new Date().toISOString().split('T')[0];

                    return (
                      <div key={`inf_${idx}`} className="pt-4 border-t border-neutral-200/70 space-y-3.5">
                        <div>
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
                            className="w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white"
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
                              className={`w-full h-11 px-3.5 text-sm rounded-lg input-brand bg-white ${
                                isOverAge ? 'border-red-500 ring-1 ring-red-500' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {isOverAge && (
                          <p className="text-xs text-red-600 font-normal leading-relaxed">
                            ⚠️ Usia bayi &ge; 2 tahun pada tanggal keberangkatan ({formatDate(schedule?.berangkat_tanggal)}). Silakan pilih kamar reguler.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sticky Bottom Action Bar */}
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white border-t border-neutral-100 px-4 py-3 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm transition-colors cursor-pointer shrink-0"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={goToStep3}
                  disabled={!picRoomType || (!agenMode && (phoneCheckStatus === 'idle' || phoneCheckStatus === 'checking' || phoneCheckStatus === 'error'))}
                  className="btn-brand-cta flex-1 px-5 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:pointer-events-none"
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
              <div>
                <h1 className="text-base font-bold text-neutral-900 font-heading">Periksa pesanan</h1>
                <p className="text-xs text-neutral-500 mt-0.5">Pastikan data dan rincian paket sudah benar sebelum memesan.</p>
              </div>

              {/* Panel paket: hanya data yang tersedia, tanpa nilai cadangan palsu */}
              <div className="rounded-2xl bg-neutral-50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0" aria-hidden="true">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500">Paket</p>
                    <p className="text-sm font-bold text-neutral-900">{schedule?.jadwal_nama || '-'}</p>
                  </div>
                </div>
                <dl className="space-y-2 text-sm">
                  {[
                    ['Berangkat', schedule?.berangkat_tanggal && formatDate(schedule.berangkat_tanggal)],
                    ['Durasi', durationDays > 0 && `${durationDays} hari`],
                    ['Maskapai', schedule?.maskapai?.name && `${schedule.maskapai.name} · ${schedule?.is_direct_flight ? 'Direct' : 'Transit'}`],
                  ].filter(([, nilai]) => nilai).map(([label, nilai]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-neutral-500">{label}</dt>
                      <dd className="font-medium text-neutral-900 text-right">{nilai}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Panel jamaah + total */}
              <div className="rounded-2xl bg-neutral-50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0" aria-hidden="true">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <p className="text-sm font-bold text-neutral-900">Jamaah ({totalPax} orang)</p>
                </div>

                <ul className="divide-y divide-neutral-200/70">
                  {summaryJamaahList.map((j) => (
                    <li key={j.num} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">{j.num}. {j.nama}</p>
                        <p className="text-xs text-neutral-500">{j.sub.replace(/ • /g, ' · ')}</p>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 shrink-0 tabular-nums">{formatRp(j.price)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-200">
                  <span className="text-sm font-semibold text-neutral-900">Total</span>
                  <span className="text-base font-bold text-neutral-900 tabular-nums">{formatRp(totalPrice)}</span>
                </div>

                {!agenMode && picNama && (
                  <p className="text-xs text-neutral-500">Akun Portal Jamaah atas nama <span className="font-medium text-neutral-700">{picNama}</span>.</p>
                )}
              </div>

              {/* Persetujuan: tanpa kartu, checkbox lebih besar dengan area sentuh luas */}
              <label className="flex items-start gap-3 py-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 w-5 h-5 shrink-0 rounded border-neutral-300 accent-brand cursor-pointer"
                />
                <span className="text-sm text-neutral-700 leading-relaxed">
                  Data di atas sudah sesuai KTP/paspor, dan saya menyetujui{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                    className="font-semibold underline text-neutral-900 cursor-pointer"
                  >
                    Syarat &amp; Ketentuan
                  </button>{' '}
                  serta kebijakan pembatalan dan pelunasan.
                </span>
              </label>

              {/* Cloudflare Turnstile (booking agen tidak butuh: endpoint sudah terautentikasi) */}
              {!agenMode && (
                <Turnstile ref={turnstileRef} onToken={setTurnstileToken} action="booking" />
              )}

              {/* Drawer syarat & ketentuan (bottom sheet): tidak berpindah halaman saat checkout */}
              {showTerms && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/50 pt-16" onClick={() => setShowTerms(false)}>
                  <section
                    ref={termsRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="judul-ketentuan"
                    tabIndex={-1}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md max-h-full flex flex-col rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                      <h2 id="judul-ketentuan" className="text-base font-bold text-neutral-900">Syarat &amp; Ketentuan</h2>
                      <button type="button" onClick={() => setShowTerms(false)} aria-label="Tutup" className="p-2 -mr-2 rounded-xl text-neutral-500 hover:bg-neutral-100 cursor-pointer">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm text-neutral-700 leading-relaxed">
                      <BookingTermsContent />
                    </div>
                    <div className="border-t border-neutral-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => { setAgree(true); setShowTerms(false); }}
                        className="w-full px-5 py-3 rounded-xl bg-brand text-white text-sm font-semibold cursor-pointer"
                      >
                        Saya setuju
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {/* Sticky Bottom Action Bar */}
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white border-t border-neutral-100 px-4 py-3 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 rounded-xl font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm transition-colors cursor-pointer shrink-0"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={loading || !agree || (!agenMode && !turnstileToken)}
                  className="btn-brand-cta flex-1 px-5 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>{loading ? 'Memproses...' : 'Konfirmasi Pemesanan'}</span>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
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
                      MINIMUM PEMBAYARAN AWAL
                    </span>
                    <span className="text-2xl font-bold text-amber-950 block">
                      {formatRp(bookingResult.nominal_dp ?? totalDp)}
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
                      <span className="font-bold">{formatRp(bookingResult.total_harga ?? totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum pembayaran:</span>
                      <span className="font-bold">{formatRp(bookingResult.nominal_dp ?? totalDp)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 pt-1 border-t border-amber-200/40">
                      <span>Sisa pelunasan:</span>
                      <span>{formatRp((bookingResult.total_harga ?? totalPrice) - (bookingResult.nominal_dp ?? totalDp))}</span>
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
                      ? mediaUrl(acc.logo_url)
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
