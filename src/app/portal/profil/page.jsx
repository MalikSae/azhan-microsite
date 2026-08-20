'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';

const Field = ({ label, value }) => <div className="border-b border-neutral-100 py-3 last:border-0"><p className="text-xs text-neutral-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-neutral-800">{value || '-'}</p></div>;

export default function ProfilPage() {
  const router = useRouter();
  const { jamaah, isLoading, logout } = usePortalAuth();
  useEffect(() => { if (!isLoading && !jamaah) router.replace('/portal/login'); }, [isLoading, jamaah, router]);
  if (isLoading || !jamaah) return <div className="flex min-h-[70vh] items-center justify-center text-sm text-neutral-500">Memuat profil...</div>;
  const initial = jamaah.nama_lengkap?.trim()?.charAt(0)?.toUpperCase() || 'J';
  return <main className="space-y-4 px-4 py-5"><section className="rounded-2xl bg-neutral-900 p-5 text-center text-white"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold">{initial}</div><h2 className="mt-3 text-lg font-bold">{jamaah.nama_lengkap}</h2><p className="mt-1 text-xs text-neutral-300">ID Jamaah: {jamaah.id_jamaah || `#${jamaah.id}`}</p></section><section className="rounded-2xl border border-neutral-200 bg-white px-4"><Field label="Nama lengkap" value={jamaah.nama_lengkap} /><Field label="Nomor handphone" value={jamaah.no_hp} /><Field label="NIK" value={jamaah.nik} /><Field label="Jenis kelamin" value={jamaah.jenis_kelamin} /><Field label="Tempat, tanggal lahir" value={[jamaah.tempat_lahir, jamaah.tanggal_lahir].filter(Boolean).join(', ')} /><Field label="Alamat" value={jamaah.alamat} /></section><button type="button" onClick={() => { logout(); router.replace('/portal/login'); }} className="w-full rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-bold text-danger-700 transition hover:bg-danger-100">Keluar dari Portal</button></main>;
}
