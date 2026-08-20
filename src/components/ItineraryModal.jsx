'use client';

import React, { useState, useEffect } from 'react';

export default function ItineraryModal({ itineraryId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && itineraryId) {
      const fetchItinerary = async () => {
        setLoading(true);
        setError(null);
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
          const res = await fetch(`${baseUrl}/api/itineraries/${itineraryId}`);
          if (!res.ok) {
            throw new Error('Gagal memuat itinerary');
          }
          const result = await res.json();
          setData(result);
        } catch (err) {
          setError(err.message || 'Terjadi kesalahan');
        } finally {
          setLoading(false);
        }
      };

      fetchItinerary();
    } else {
      setData(null);
    }
  }, [isOpen, itineraryId]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
      {/* Modal Card */}
      <div 
        className="bg-white rounded-t-3xl shadow-xl w-full max-w-[460px] max-h-[92dvh] flex flex-col overflow-hidden animate-dropdown relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-200 flex justify-between items-center bg-neutral-50 shrink-0">
          <h2 className="text-lg font-bold text-neutral-900">Detail Itinerary</h2>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 p-2 rounded-xl transition-colors"
            aria-label="Tutup detail itinerary"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto grow overscroll-contain scrollbar-hide">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-500">
              <svg className="w-8 h-8 animate-spin text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium">Memuat itinerary...</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8 text-rose-600 bg-rose-50 rounded-lg border border-rose-200 text-sm">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-xl text-neutral-900">{data.title}</h3>
                {data.description && (
                  <p className="text-neutral-600 text-sm mt-1 leading-relaxed">
                    {data.description}
                  </p>
                )}
              </div>

              {data.days && data.days.length > 0 ? (
                <div className="space-y-6">
                  {data.days.map((day, idx) => (
                    <div key={idx} className="relative pl-6">
                      {/* Timeline Line */}
                      {idx !== data.days.length - 1 && (
                        <div className="absolute left-2.5 top-8 bottom-[-24px] w-[2px] bg-neutral-200"></div>
                      )}
                      
                      {/* Timeline Dot */}
                      <div className="absolute left-[3px] top-1 w-4 h-4 rounded-full bg-brand border-4 border-white shadow-sm"></div>
                      
                      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                        <div className="flex flex-col gap-2 mb-3">
                          <h4 className="font-bold text-neutral-800 text-sm">
                            Hari ke-{day.day_number}: {day.title}
                          </h4>
                          {day.location && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-[11px] font-medium text-neutral-600">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {day.location}
                            </span>
                          )}
                        </div>
                        
                        {day.activities && day.activities.length > 0 ? (
                          <div className="space-y-2.5">
                            {day.activities.map((act, i) => (
                              <div key={i} className="flex items-start gap-3 text-sm">
                                <span className="text-xs font-semibold text-brand bg-white border border-brand/20 px-1.5 py-0.5 rounded shrink-0 min-w-[50px] text-center mt-0.5">
                                  {act.time || 'Agenda'}
                                </span>
                                <p className="text-neutral-700 leading-relaxed">{act.text || act.description}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-500 italic">Tidak ada agenda detail.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500 text-sm border border-dashed border-neutral-300 rounded-lg">
                  Belum ada jadwal hari per hari untuk itinerary ini.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
