import { bindRequestBrand } from '@/lib/requestBrand';
import { NextResponse } from 'next/server';
import { clientIpHeaders } from '@/lib/forwardClientIp';
import { kodeReferralFromRequest } from '@/lib/referral';

// Pendaftaran akun calon agen Syiar (screen A0). Kode referral diambil dari
// cookie link agen, bukan dari body browser.
export async function POST(request) {
  try {
    const body = await bindRequestBrand(request, await request.json());
    const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';

    const payload = {
      brand_id: Number(body.brand_id),
      nama_lengkap: body.nama_lengkap,
      no_hp: body.no_hp,
      portal_pin: body.portal_pin,
      captcha_token: body.captcha_token,
      kode_referral: kodeReferralFromRequest(request),
    };

    const res = await fetch(`${baseUrl}/api/public/agen/daftar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...clientIpHeaders(request),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Terjadi kesalahan saat mendaftar.' },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Gagal menghubungi server pendaftaran.' },
      { status: err.status || 503 }
    );
  }
}
