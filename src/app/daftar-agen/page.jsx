import { redirect } from 'next/navigation';

// Alamat publik pendek untuk dibagikan agen: /daftar-agen?ref=KODE.
// Cookie referral sudah disimpan middleware sebelum redirect ini.
export default function DaftarAgenRedirect() {
  redirect('/portal/daftar-agen');
}
