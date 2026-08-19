import React from 'react';

export default function SeatProgressBar({ totalSeat, bookedSeat }) {
  const total = totalSeat || 0;
  const booked = bookedSeat || 0;
  const remaining = Math.max(0, total - booked);
  const percentage = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;

  /* Pengecualian disengaja: Lebar dinamis (progress bar) harus pakai inline style `style={{ width: ... }}`, karena Tailwind tidak bisa meng-compile class dinamis seperti w-[${persen}%] di runtime. */

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs font-medium">
        <span className="text-neutral-600">Terisi {booked} dari {total}</span>
        <span className={`font-semibold ${remaining < 10 ? 'text-danger-600' : 'text-success-600'}`}>
          {remaining === 0 ? 'Penuh!' : (remaining > 10 ? 'Amankan Seat!' : `Sisa ${remaining} Pax Lagi!`)}
        </span>
      </div>
      <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
        <div 
          className={`h-full transition-all duration-300 animate-progress-stripes ${
            percentage >= 80 ? 'bg-warning-500' : 'bg-success-500'
          }`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
