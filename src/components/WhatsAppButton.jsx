import React from 'react';

export default function WhatsAppButton({ brandWhatsapp, message = "Halo, saya berminat dengan paket Umroh ini. Boleh minta info lebih detail?", packageName }) {
  let cleanNumber = '';
  if (brandWhatsapp && brandWhatsapp.trim() !== '') {
    cleanNumber = brandWhatsapp.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.slice(1);
    }
  }

  const defaultMsg = packageName 
    ? `Assalamu'alaikum, saya ingin bertanya tentang paket: *${packageName}*` 
    : message;

  const waUrl = cleanNumber ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultMsg)}` : '#';

  return (
    <a
      href={waUrl}
      target={cleanNumber ? "_blank" : ""}
      rel="noopener noreferrer"
      // Menggunakan warna standar WhatsApp (#25D366) sebagai warna fungsional brand WhatsApp
      className="w-full py-2.5 px-4 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 active:scale-[0.99]"
    >
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
      </svg>
      Konsultasi via WhatsApp
    </a>
  );
}
