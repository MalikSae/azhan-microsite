import React from 'react';
import { formatRupiah } from '@/lib/portalFormat';
import Badge from '@/components/ui/Badge';

const JENIS = {
  langsung: 'Komisi langsung',
  pembinaan: 'Bonus pembinaan',
  repeat_order: 'Repeat order',
  cashback: 'Cashback',
};

const formatTanggal = (v) =>
  v ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(v)) : '-';

// Satu baris ledger komisi (A3, A6) dengan status ketersediaan (D4, D6).
export default function KomisiItem({ item }) {
  return (
    <div className="py-2.5 flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs sm:text-sm font-semibold text-neutral-900">{JENIS[item.jenis] || item.jenis}</p>
        <p className="text-[11px] text-neutral-500 truncate">
          {item.sumber_nama} • {item.booking_code} • {formatTanggal(item.created_at)}
        </p>
        {item.ketersediaan === 'tertahan' && (
          <p className="text-[11px] text-warning-800">Tertahan sampai berangkat {formatTanggal(item.berangkat_tanggal)}</p>
        )}
      </div>
      <div className="text-right shrink-0 space-y-1">
        <p className="text-xs sm:text-sm font-bold text-neutral-900 font-mono">{formatRupiah(item.nominal)}</p>
        {item.ketersediaan === 'tersedia' && <Badge variant="success">Tersedia</Badge>}
        {item.ketersediaan === 'tertahan' && <Badge variant="pending">Tertahan</Badge>}
        {item.ketersediaan === 'kredit' && <Badge variant="neutral">Kredit</Badge>}
      </div>
    </div>
  );
}
