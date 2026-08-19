import React from 'react';

const TIMELINE_STEPS = [
  { key: 'progress_paspor', label: 'Paspor' },
  { key: 'progress_visa', label: 'Visa' },
  { key: 'progress_tiket', label: 'Tiket Maskapai' },
  { key: 'progress_hotel', label: 'Hotel' },
  { key: 'progress_land_arrangement', label: 'Land Arrangement' },
  { key: 'progress_manasik', label: 'Manasik' },
  { key: 'progress_siskopatuh', label: 'Siskopatuh' },
  { key: 'progress_vaksin_meningitis', label: 'Vaksin Meningitis' },
];

const formatTanggal = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export default function ProgressTimeline({ booking }) {
  if (!booking) return null;

  const steps = TIMELINE_STEPS.map((s) => ({
    ...s,
    isReady: Boolean(booking[s.key]),
  }));

  return (
    <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Progress Keberangkatan
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-xs font-semibold text-neutral-600">
              #INV-{String(booking.id).padStart(5, '0')}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 leading-tight">
            {booking.jadwal_nama}
          </h2>
          <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
            <span>Keberangkatan:</span>
            <span className="font-semibold text-neutral-800">
              {formatTanggal(booking.berangkat_tanggal)}
            </span>
          </p>
        </div>
      </div>

      {/* DESKTOP TIMELINE (Horizontal, md: and above) */}
      <div className="hidden md:block pt-2 pb-2">
        <div className="grid grid-cols-8 relative items-start">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const nextStep = !isLast ? steps[idx + 1] : null;
            const lineIsReady = !isLast && step.isReady && nextStep?.isReady;

            return (
              <div key={step.key} className="relative flex flex-col items-center text-center px-1">
                {/* Connecting Line to next step */}
                {!isLast && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${
                      lineIsReady ? 'bg-success-500' : 'bg-neutral-200'
                    }`}
                  />
                )}

                {/* Node Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                    step.isReady
                      ? 'bg-success-500 text-white shadow-xs'
                      : 'border-2 border-neutral-300 bg-white'
                  }`}
                >
                  {step.isReady ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : null}
                </div>

                {/* Label below node */}
                <div className="mt-2.5">
                  <span className="block text-xs font-semibold text-neutral-800 leading-tight">
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE TIMELINE (Vertical, below md) */}
      <div className="block md:hidden space-y-0 pt-1">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const nextStep = !isLast ? steps[idx + 1] : null;
          const lineIsReady = !isLast && step.isReady && nextStep?.isReady;

          return (
            <div key={step.key} className="relative flex items-start gap-3.5 pb-4 last:pb-0">
              {/* Vertical connecting line */}
              {!isLast && (
                <div
                  className={`absolute top-7 left-3.5 -ml-px w-0.5 bottom-0 ${
                    lineIsReady ? 'bg-success-500' : 'bg-neutral-200'
                  }`}
                />
              )}

              {/* Node Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  step.isReady
                    ? 'bg-success-500 text-white shadow-xs'
                    : 'border-2 border-neutral-300 bg-white'
                }`}
              >
                {step.isReady ? (
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </div>

              {/* Label to the right */}
              <div className="flex items-center justify-between w-full pt-1 pr-1">
                <span className="text-xs font-semibold text-neutral-800">
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
