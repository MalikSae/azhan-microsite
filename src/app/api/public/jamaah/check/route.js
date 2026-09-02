import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const baseUrl = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
    
    const res = await fetch(`${baseUrl}/api/public/jamaah/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Terjadi kesalahan saat memeriksa nomor WhatsApp.' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Gagal menghubungi server pendaftaran.' },
      { status: 500 }
    );
  }
}
