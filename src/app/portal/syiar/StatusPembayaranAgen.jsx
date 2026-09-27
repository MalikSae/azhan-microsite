'use client';

import React from 'react';
import { formatRupiah } from '@/lib/portalFormat';
import Badge from '@/components/ui/Badge';

const LABEL = {
  menunggu_verifikasi: { variant: 'warning', text: 'Menunggu verifikasi' },
  terverifikasi: { variant: 'success', text: 'Terverifikasi' },
  ditolak: { variant: 'danger', text: 'Ditolak' },
};

// Ringkasan status pembayaran pendaftaran agen satu siklus pengajuan.
export default function StatusPembayaranAgen({ pembayaran }) {
  const label = LABEL[pembayaran.status] || LABEL.menunggu_verifikasi;
  return (
    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Biaya pendaftaran</span>
          <span className="font-mono font-bold text-sm sm:text-base text-neutral-900">{formatRupiah(pembayaran.nominal_tagihan)}</span>
        </div>
        <Badge variant={label.variant}>{label.text}</Badge>
      </div>
      {pembayaran.status === 'ditolak' && pembayaran.catatan_penolakan && (
        <p className="p-2 rounded-lg bg-danger-50 border border-danger-200 text-[11px] sm:text-xs text-danger-700">
          <strong>Alasan penolakan:</strong> {pembayaran.catatan_penolakan}
        </p>
      )}
    </div>
  );
}
