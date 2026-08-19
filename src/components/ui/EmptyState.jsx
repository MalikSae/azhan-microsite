import React from 'react';

export default function EmptyState({ title = "Belum Ada Paket Umroh", message = "Belum ada paket umroh yang sesuai dengan pencarian atau filter Anda." }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center max-w-lg mx-auto shadow-sm my-8">
      <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 mb-1">{title}</h3>
      <p className="text-neutral-500 text-sm">{message}</p>
    </div>
  );
}
