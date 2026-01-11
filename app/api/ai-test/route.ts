import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const key = process.env.COLLECTR_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: 'COLLECTR_API_KEY fehlt' },
      { status: 500 }
    );
  }

  const res = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });

  const text = await res.text();

  return NextResponse.json({
    ok: res.ok,
    status: res.status,
    response: text,
  });
}

