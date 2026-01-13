import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardName, setName, cardNumber, game, grading } = body

    if (!cardName) {
      return NextResponse.json(
        { error: 'Card name is required' },
        { status: 400 }
      )
    }

    // Call Supabase Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/tcg-price-lookup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          cardName,
          setName,
          cardNumber,
          game: game || 'pokemon',
          grading
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Supabase function error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch price data' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
