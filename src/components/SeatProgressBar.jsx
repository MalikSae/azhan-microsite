import React from 'react';

export default function SeatProgressBar({ totalSeat, bookedSeat, seatTotal, seatTerisi, seatSisa }) {
  const total = totalSeat || seatTotal || 0;
  const booked = bookedSeat !== undefined ? bookedSeat : (seatTerisi !== undefined ? seatTerisi : 0);
  const remaining = seatSisa !== undefined ? seatSisa : Math.max(0, total - booked);
  const percentage = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;

  // State 1: Penuh (Habis)
  if (remaining === 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-neutral-500 font-medium">Kuota Penuh</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs text-neutral-500 bg-neutral-100 border-neutral-200">
            Full Booked
          </span>
        </div>
        <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/80 p-[1px] shadow-inner">
          <div className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-neutral-400 to-neutral-500 bg-neutral-400" style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  // State 2: Scarcity / Hampir Penuh (Sisa <= 10)
  if (remaining <= 10) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-amber-700 font-bold">
            Sisa <strong className="text-amber-900 font-black text-sm">{remaining}</strong> Seat Lagi!
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs text-amber-800 bg-amber-50 border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Hampir Penuh
          </span>
        </div>
        <div className="w-full h-2.5 bg-amber-100/50 rounded-full overflow-hidden border border-amber-200/50 p-[1px] shadow-inner">
          <div className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-amber-500 animate-progress-stripes" style={{ width: `${Math.max(5, percentage)}%` }} />
        </div>
      </div>
    );
  }

  // State 3: Normal Booking (Sudah ada yang booking, misal >= 20% atau >= 5 pax)
  if (percentage >= 15 || booked >= 5) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-emerald-700 font-medium">
            Terpesan <strong className="text-emerald-900 font-bold">{booked}</strong> Seat
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs text-emerald-700 bg-emerald-50 border-emerald-200/80">
            Tersedia
          </span>
        </div>
        <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/80 p-[1px] shadow-inner">
          <div className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-400 to-emerald-500 bg-emerald-500 animate-progress-stripes" style={{ width: `${Math.max(5, percentage)}%` }} />
        </div>
      </div>
    );
  }

  // State 4: Pendaftaran Baru Buka / Masih Kosong (booked < 5 atau percentage < 15%)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-emerald-700 font-medium">
          Segera Amankan Seat
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs text-emerald-700 bg-emerald-50 border-emerald-200/80">
          Tersedia
        </span>
      </div>
      <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/80 p-[1px] shadow-inner">
        <div className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-300 to-emerald-400 bg-emerald-400" style={{ width: '15%' }} />
      </div>
    </div>
  );
}



