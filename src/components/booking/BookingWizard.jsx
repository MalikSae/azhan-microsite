"use client";

import { useState } from 'react';
import Turnstile from '@/components/ui/Turnstile';
import Link from 'next/link';

export default function BookingWizard({ schedule, brandName, brandColor, brandId }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  
  const showAlert = (msg) => setAlertMsg(msg);
  
  // State PIC
  const [picName, setPicName] = useState('');
  const [picGender, setPicGender] = useState('L');
  const [picPhone, setPicPhone] = useState('');
  const [picRoomType, setPicRoomType] = useState('quad');

  // State Anggota
  const [members, setMembers] = useState([]);
  
  // State Security
  const [pin, setPin] = useState('');
  const [agree, setAgree] = useState(false);

  // Result
  const [bookingResult, setBookingResult] = useState(null);

  const priceQuad = schedule.harga_quad || 0;
  const priceTriple = schedule.harga_triple || 0;
  const priceDouble = schedule.harga_double || 0;

  const getPriceByRoomType = (type) => {
    if (type === 'triple') return priceTriple;
    if (type === 'double') return priceDouble;
    return priceQuad;
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const picPrice = getPriceByRoomType(picRoomType);
  const membersTotal = members.reduce((sum, m) => sum + (m.type === 'reguler' ? getPriceByRoomType(m.roomType) : 0), 0);
  const totalPrice = picPrice + membersTotal;
  
  const regulerCount = 1 + members.filter(m => m.type === 'reguler').length;
  const dpPerPax = schedule.minimal_dp || 0;
  const totalDp = dpPerPax * regulerCount;

  const addMember = () => {
    if (members.length >= 8) {
        showAlert("Maksimal 8 jamaah tambahan!");
        return;
    }
    setMembers([...members, { type: 'reguler', name: '', gender: 'L', roomType: 'quad', birthDate: '' }]);
  };

  const updateMember = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(today.getFullYear() - 2);
  const minInfantDate = twoYearsAgo.toISOString().split('T')[0];

  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!agree) {
        showAlert('Anda harus menyetujui syarat & ketentuan.');
        return;
    }
    if (pin.length !== 6) {
        showAlert('PIN Portal harus 6 digit.');
        return;
    }
    if (!turnstileToken) {
        showAlert('Mohon tunggu validasi keamanan selesai.');
        return;
    }

    setLoading(true);
    setError(null);

    const payload = {
        brand_id: Number(brandId) || 0,
        schedule_id: schedule.id,
        captcha_token: turnstileToken,
        pic: {
            nama_lengkap: picName,
            no_hp: picPhone,
            jenis_kelamin: picGender,
            room_type: picRoomType.charAt(0).toUpperCase() + picRoomType.slice(1),
            portal_pin: pin
        },
        anggota: members.map(m => ({
            pax_type: m.type,
            nama_lengkap: m.name,
            jenis_kelamin: m.gender,
            room_type: m.type === 'reguler' ? (m.roomType.charAt(0).toUpperCase() + m.roomType.slice(1)) : null,
            tanggal_lahir: m.type === 'infant' ? m.birthDate : null
        }))
    };

    try {
        let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl || baseUrl.includes('localhost')) {
            baseUrl = `http://${window.location.hostname}:9090`;
        }
        const res = await fetch(`${baseUrl}/api/public/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brand-id': brandId.toString() },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Terjadi kesalahan saat pendaftaran');
        }

        setBookingResult(data);
        setStep(3); // Moved to Step 3 (Selesai)
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* KIRI - Form Area */}
      <div className="w-full md:flex-1 bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
        
        {/* Step Indicator */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-neutral-900 mb-6">Formulir Booking</h1>
          <div className="flex items-center justify-between relative px-8">
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-neutral-100 rounded-full z-0"></div>
            <div className="absolute left-8 top-1/2 -translate-y-1/2 h-1 rounded-full z-0 transition-all duration-300" style={{ width: `calc(${((step - 1) / 2) * 100}%)`, backgroundColor: brandColor }}></div>
            
            {[1, 2, 3].map((s) => (
              <div key={s} className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border-2 transition-colors ${step >= s ? 'border-transparent text-white' : 'bg-white border-neutral-200 text-neutral-400'}`} style={step >= s ? { backgroundColor: brandColor } : {}}>
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold text-neutral-400 px-4">
            <span className={step >= 1 ? 'text-neutral-900' : ''}>Data Jamaah</span>
            <span className={step >= 2 ? 'text-neutral-900' : ''}>Review</span>
            <span className={step >= 3 ? 'text-neutral-900' : ''}>Selesai</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-10">
            {/* PIC SECTION */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-neutral-900">Data Pemesan (Jamaah 1)</h2>
                <p className="text-sm text-neutral-500">Anda bertindak sebagai kontak utama sekaligus jamaah pertama.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nama Lengkap (Sesuai KTP)</label>
                  <input type="text" className="w-full border border-neutral-300 rounded-lg p-3 text-sm focus:ring-2 outline-none" value={picName} onChange={e => setPicName(e.target.value)} placeholder="Misal: Budi Santoso" style={{ '--tw-ring-color': brandColor }} />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">No. WhatsApp</label>
                  <input type="tel" className="w-full border border-neutral-300 rounded-lg p-3 text-sm focus:ring-2 outline-none" value={picPhone} onChange={e => setPicPhone(e.target.value)} placeholder="Misal: 081234567890" style={{ '--tw-ring-color': brandColor }} />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">Jenis Kelamin</label>
                  <select className="w-full border border-neutral-300 rounded-lg p-3 text-sm focus:ring-2 outline-none" value={picGender} onChange={e => setPicGender(e.target.value)} style={{ '--tw-ring-color': brandColor }}>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Pilih Tipe Kamar</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[{id: 'quad', label: 'Quad', price: priceQuad, desc: 'Sekamar Ber-4'}, {id: 'triple', label: 'Triple', price: priceTriple, desc: 'Sekamar Ber-3'}, {id: 'double', label: 'Double', price: priceDouble, desc: 'Sekamar Ber-2'}].map(room => (
                      <div 
                        key={room.id}
                        onClick={() => setPicRoomType(room.id)}
                        className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${picRoomType === room.id ? 'border-amber-400 bg-amber-50' : 'border-neutral-200 hover:border-amber-200'}`}
                        style={picRoomType === room.id ? { borderColor: brandColor } : {}}
                      >
                        <div className="font-bold text-neutral-800">{room.label}</div>
                        <div className="text-xs text-neutral-500 mb-2">{room.desc}</div>
                        <div className="text-sm font-bold text-neutral-900">{formatRp(room.price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* DIVIDER */}
            <hr className="border-neutral-100 border-2" />

            {/* MEMBERS SECTION */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-neutral-900">Jamaah Tambahan</h2>
                <p className="text-sm text-neutral-500">Mendaftar bersama keluarga atau kerabat? Tambahkan di sini.</p>
              </div>

              {members.length > 0 && (
                <div className="space-y-4 mb-4">
                  {members.map((m, idx) => (
                    <div key={idx} className="p-4 border border-neutral-200 rounded-xl relative bg-neutral-50">
                      <button onClick={() => removeMember(idx)} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1 rounded-md text-xs font-semibold">Hapus</button>
                      <div className="mb-3 font-semibold text-neutral-800">Jamaah {idx + 2}</div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Tipe Jamaah</label>
                          <select className="w-full border border-neutral-300 rounded-lg p-2 text-sm outline-none bg-white" value={m.type} onChange={e => updateMember(idx, 'type', e.target.value)}>
                            <option value="reguler">Reguler</option>
                            <option value="infant">Infant (Bayi &lt; 2 Thn)</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold mb-1">Nama Lengkap</label>
                          <input type="text" className="w-full border border-neutral-300 rounded-lg p-2 text-sm outline-none bg-white" value={m.name} onChange={e => updateMember(idx, 'name', e.target.value)} placeholder="Nama Lengkap" />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1">Jenis Kelamin</label>
                          <select className="w-full border border-neutral-300 rounded-lg p-2 text-sm outline-none bg-white" value={m.gender} onChange={e => updateMember(idx, 'gender', e.target.value)}>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                          </select>
                        </div>

                        {m.type === 'infant' ? (
                          <div>
                            <label className="block text-xs font-semibold mb-1">Tgl Lahir (Wajib Infant)</label>
                            <input 
                              type="date" 
                              lang="id-ID"
                              min={minInfantDate} 
                              max={maxDate} 
                              className="w-full border border-neutral-300 rounded-lg p-2 text-sm outline-none bg-white" 
                              value={m.birthDate} 
                              onChange={e => updateMember(idx, 'birthDate', e.target.value)} 
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val && val.length === 10) {
                                  const bDate = new Date(val);
                                  if (bDate.getFullYear() > 2000) {
                                    const twoYearsAgo = new Date();
                                    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                                    if (bDate < twoYearsAgo) {
                                      showAlert("Maaf, usia Jamaah tipe Infant (Bayi) tidak boleh lebih dari 2 tahun.");
                                      updateMember(idx, 'birthDate', '');
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-semibold mb-1">Tipe Kamar</label>
                            <select className="w-full border border-neutral-300 rounded-lg p-2 text-sm outline-none bg-white" value={m.roomType} onChange={e => updateMember(idx, 'roomType', e.target.value)}>
                              <option value="quad">Quad (Rp {priceQuad/1000000}jt)</option>
                              <option value="triple">Triple (Rp {priceTriple/1000000}jt)</option>
                              <option value="double">Double (Rp {priceDouble/1000000}jt)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={addMember} className="w-full py-3 rounded-xl font-bold border-2 border-neutral-300 text-neutral-700 hover:border-neutral-400 border-dashed transition-colors">
                + Tambah Jamaah Lain
              </button>
            </div>

            <button 
              onClick={() => {
                if(!picName || !picPhone) { showAlert("Nama dan WhatsApp Pemesan wajib diisi"); return; }
                const invalid = members.some(m => !m.name || (m.type === 'infant' && !m.birthDate));
                if(invalid) { showAlert("Pastikan nama dan tanggal lahir (untuk infant) terisi semua pada Jamaah Tambahan."); return; }
                
                const invalidInfantAge = members.some(m => {
                  if (m.type === 'infant' && m.birthDate) {
                    const birthDate = new Date(m.birthDate);
                    const twoYearsAgo = new Date();
                    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                    return birthDate < twoYearsAgo;
                  }
                  return false;
                });

                if (invalidInfantAge) {
                  showAlert("Maaf, usia Jamaah tipe Infant (Bayi) tidak boleh lebih dari 2 tahun.");
                  return;
                }

                setStep(2); // Lanjut ke Review
              }}
              className="w-full py-4 rounded-xl font-bold text-neutral-900 transition-colors shadow-sm bg-amber-400 hover:bg-amber-500 text-lg mt-6"
              style={{ backgroundColor: brandColor, color: '#fff' }}
            >
              Lanjut ke Review
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Konfirmasi & Keamanan</h2>
              <p className="text-sm text-neutral-500">Langkah terakhir sebelum menyelesaikan pemesanan Anda.</p>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <h3 className="font-bold text-amber-900 mb-2">Buat PIN Portal</h3>
              <p className="text-sm text-amber-800 mb-3 leading-relaxed">
                PIN ini akan Anda gunakan untuk masuk ke Portal Jamaah nantinya. Di dalam portal, Anda bisa mengunggah bukti pembayaran, dokumen KTP/Paspor, dan mengecek jadwal.
              </p>
              <div className="max-w-[200px]">
                <input 
                  type="password" 
                  maxLength={6} 
                  className="w-full border border-amber-300 rounded-lg p-3 text-center tracking-[0.5em] font-bold outline-none focus:ring-2 focus:ring-amber-400 bg-white" 
                  placeholder="6 Angka"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" id="tnc" className="mt-1 w-5 h-5 accent-amber-500" checked={agree} onChange={e => setAgree(e.target.checked)} />
              <label htmlFor="tnc" className="text-sm text-neutral-600 leading-relaxed cursor-pointer">
                Saya menyatakan bahwa data yang diisi adalah benar, dan saya bersedia melakukan pembayaran uang muka (DP) paling lambat <strong>24 jam</strong> setelah pemesanan ini berhasil. Jika lewat dari batas waktu, kursi saya dapat dibatalkan otomatis oleh sistem.
              </label>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Turnstile siteKey="dummy-key" onVerify={token => setTurnstileToken(token)} />
            </div>

            <div className="flex gap-3 pt-4 border-t border-neutral-100">
              <button onClick={() => setStep(1)} className="px-6 py-3.5 rounded-xl font-bold bg-neutral-100 text-neutral-700 hover:bg-neutral-200" disabled={loading}>
                Kembali
              </button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3.5 rounded-xl font-bold text-neutral-900 transition-colors shadow-sm bg-amber-400 hover:bg-amber-500 disabled:opacity-50" style={{ backgroundColor: brandColor, color: '#fff' }}>
                {loading ? 'Memproses...' : 'Konfirmasi Pendaftaran'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && bookingResult && (
          <div className="text-center space-y-6 py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black text-neutral-900">Alhamdulillah, Pendaftaran Berhasil!</h2>
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 max-w-sm mx-auto">
              <div className="text-sm text-neutral-500 mb-1">Nomor Booking Anda</div>
              <div className="text-xl font-bold tracking-wider text-neutral-900">{bookingResult.id_booking}</div>
            </div>
            <div className="max-w-md mx-auto text-sm text-neutral-600 leading-relaxed space-y-4">
              <p>Segera lakukan pembayaran Uang Muka (DP) minimal sebesar <strong>{formatRp(totalDp)}</strong> dalam waktu <strong>24 jam</strong> ke rekening berikut:</p>
              
              <div className="bg-white border border-neutral-200 rounded-xl p-4 text-left shadow-sm">
                {bookingResult.banks && bookingResult.banks.length > 0 ? (
                  <ul className="space-y-3">
                    {bookingResult.banks.map((b, i) => (
                      <li key={i} className="flex flex-col border-b border-neutral-100 last:border-0 pb-3 last:pb-0">
                        <span className="font-bold text-neutral-900">{b.nama_bank}</span>
                        <span className="text-lg font-mono tracking-tight text-neutral-800">{b.nomor_rekening}</span>
                        <span className="text-xs text-neutral-500">a.n. {b.atas_nama}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-neutral-500">Rekening Bank akan diinformasikan oleh Admin.</p>
                )}
              </div>

              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mt-4 font-medium">
                Sisa Waktu Pembayaran: 23:59:59 (Countdown simulasi)
              </div>
            </div>

            <div className="pt-4 max-w-md mx-auto">
              <a 
                href={bookingResult.portal_token ? `/portal/login?token=${bookingResult.portal_token}` : `/portal/login`}
                className="block w-full py-4 rounded-xl font-bold transition-colors shadow-sm bg-amber-400 hover:bg-amber-500"
                style={{ backgroundColor: brandColor, color: '#fff' }}
              >
                Masuk ke Portal Jamaah
              </a>
              <p className="text-xs text-neutral-400 mt-3">Upload KTP/Paspor & Bukti Bayar di dalam Portal</p>
            </div>
          </div>
        )}
      </div>

      {/* KANAN - Sticky Summary */}
      {step < 3 && (
        <div className="w-full md:w-[320px] lg:w-[380px] shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 sticky top-8">
            <div className="p-5 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 text-lg mb-1">Detail Pesanan</h3>
              <p className="text-sm text-neutral-500 font-medium">{schedule.jadwal_nama}</p>
            </div>
            <div className="p-5 space-y-4">
              {/* PIC */}
              <div className="flex justify-between items-start text-sm">
                <div>
                  <div className="font-semibold text-neutral-800">{picName || 'Data Belum Diisi'}</div>
                  <div className="text-xs text-neutral-500 capitalize">Jamaah 1 (Anda) &bull; Kamar {picRoomType}</div>
                </div>
                <div className="font-semibold text-neutral-900 text-right">{formatRp(picPrice)}</div>
              </div>

              {/* Members */}
              {members.map((m, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm pt-3 border-t border-neutral-100 border-dashed">
                  <div>
                    <div className="font-semibold text-neutral-800">
                      {m.name || `Jamaah ${idx+2}`} {m.type === 'infant' && <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded ml-1 uppercase">Infant</span>}
                    </div>
                    {m.type === 'reguler' && <div className="text-xs text-neutral-500 capitalize">Kamar {m.roomType}</div>}
                    {m.type === 'infant' && <div className="text-xs text-neutral-500">Tanpa Biaya Kamar</div>}
                  </div>
                  <div className="font-semibold text-neutral-900 text-right">
                    {m.type === 'reguler' ? formatRp(getPriceByRoomType(m.roomType)) : 'Rp 0'}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-neutral-50 border-t border-neutral-100 rounded-b-2xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-neutral-600">Total Harga</span>
                <span className="text-xl font-black text-neutral-900" style={{ color: brandColor }}>{formatRp(totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-neutral-500">Minimal DP</span>
                <span className="text-sm font-bold text-neutral-700">{formatRp(totalDp)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {alertMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Perhatian</h3>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">{alertMsg}</p>
            <button 
              onClick={() => setAlertMsg('')}
              className="w-full py-3 rounded-xl font-bold transition-colors shadow-sm bg-neutral-900 text-white hover:bg-neutral-800"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
