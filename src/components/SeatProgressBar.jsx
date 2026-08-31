import React from 'react';

export default function SeatProgressBar({ totalSeat, bookedSeat, seatTotal, seatTerisi, seatSisa }) {
  const total = totalSeat || seatTotal || 0;
  const booked = bookedSeat !== undefined ? bookedSeat : (seatTerisi !== undefined ? seatTerisi : 0);
  const remaining = seatSisa !== undefined ? seatSisa : Math.max(0, total - booked);
  const percentage = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;

  // Tentukan tema warna progress bar & badge status kursi
  let barGradient = 'from-emerald-400 to-emerald-500 bg-emerald-500';
  let badgeStyle = 'text-emerald-700 bg-emerald-50 border-emerald-200/80';
  let badgeText = 'Tersedia';

  if (remaining === 0) {
    barGradient = 'from-neutral-400 to-neutral-500 bg-neutral-400';
    badgeStyle = 'text-neutral-500 bg-neutral-100 border-neutral-200';
    badgeText = 'Penuh!';
  } else if (remaining <= 10) {
    barGradient = 'from-amber-400 via-amber-500 to-orange-500 bg-amber-500';
    badgeStyle = 'text-amber-800 bg-amber-50 border-amber-200/80';
    badgeText = `Sisa ${remaining} Pax Lagi!`;
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-neutral-500 font-medium">
          Terisi <strong className="text-neutral-900 font-bold">{booked}</strong> dari {total}
        </span>
        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs ${badgeStyle}`}>
          {remaining > 0 && remaining <= 10 && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          )}
          {badgeText}
        </span>
      </div>

      {/* Progress Track with Inset Shadow */}
      <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/80 p-[1px] shadow-inner">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${barGradient} ${
            remaining > 0 ? 'animate-progress-stripes' : ''
          }`} 
          style={{ width: `${Math.max(percentage > 0 ? 5 : 0, percentage)}%` }}
        />
      </div>
    </div>
  );
}
