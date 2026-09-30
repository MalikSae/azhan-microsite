import { bindRequestBrand } from '@/lib/requestBrand';
import { NextResponse } from 'next/server';
import { clientIpHeaders } from '@/lib/forwardClientIp';
import { kodeReferralFromRequest } from '@/lib/referral';

export async function POST(request) {
  try {
    const body = await bindRequestBrand(request, await request.json());
    // Kode referral hanya dari cookie link agen, nilai dari browser diabaikan.
    body.kode_referral = kodeReferralFromRequest(request);
    const authHeader = request.headers.get('authorization');
    const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
    
    const forwardHeaders = {
      'Content-Type': 'application/json',
      ...clientIpHeaders(request),
    };
    if (authHeader) {
      forwardHeaders['Authorization'] = authHeader;
    }

    const res = await fetch(`${baseUrl}/api/public/book`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Terjadi kesalahan saat memproses pendaftaran.' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Gagal menghubungi server pendaftaran.' },
      { status: err.status || 503 }
    );
  }
}
