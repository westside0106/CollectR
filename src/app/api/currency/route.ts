import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CURRENCYLAYER_API_KEY = process.env.CURRENCYLAYER_API_KEY || ''

const SUPPORTED_CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'Britisches Pfund' },
  { code: 'CHF', symbol: 'Fr.', name: 'Schweizer Franken' },
  { code: 'JPY', symbol: '¥', name: 'Japanischer Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinesischer Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australischer Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Kanadischer Dollar' },
] as const

interface CurrencyLayerResponse {
  success: boolean
  timestamp: number
  source: string
  quotes: Record<string, number>
  error?: {
    code: number
    info: string
  }
}

interface ExchangeRates {
  base: string
  timestamp: number
  rates: Record<string, number>
}

export async function GET(request: NextRequest) {
  try {
    // Auth check - require authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const amount = searchParams.get('amount')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!CURRENCYLAYER_API_KEY) {
      return NextResponse.json(
        { error: 'Currency API key not configured' },
        { status: 503 }
      )
    }

    // Get exchange rates
    const currencies = SUPPORTED_CURRENCIES.map(c => c.code).join(',')
    const response = await fetch(
      `https://api.currencylayer.com/live?access_key=${CURRENCYLAYER_API_KEY}&currencies=${currencies}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    const data: CurrencyLayerResponse = await response.json()

    if (!data.success) {
      return NextResponse.json(
        { error: 'Failed to fetch exchange rates', details: data.error },
        { status: 500 }
      )
    }

    // Convert currencylayer format (USDEUR) to simple format (EUR)
    const rates: Record<string, number> = {}
    for (const [key, value] of Object.entries(data.quotes)) {
      const currency = key.replace('USD', '')
      rates[currency] = value
    }
    rates['USD'] = 1 // USD is always 1 (base)

    const result: ExchangeRates = {
      base: 'USD',
      timestamp: data.timestamp,
      rates
    }

    // If conversion parameters provided, calculate conversion
    if (amount && from && to) {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum)) {
        return NextResponse.json(
          { error: 'Invalid amount' },
          { status: 400 }
        )
      }

      if (from === to) {
        return NextResponse.json({
          ...result,
          conversion: {
            amount: amountNum,
            from,
            to,
            result: amountNum
          }
        })
      }

      const fromRate = rates[from]
      const toRate = rates[to]

      if (!fromRate || !toRate) {
        return NextResponse.json(
          { error: `Exchange rate not found for ${from} or ${to}` },
          { status: 400 }
        )
      }

      const amountInUSD = amountNum / fromRate
      const convertedAmount = Math.round(amountInUSD * toRate * 100) / 100

      return NextResponse.json({
        ...result,
        conversion: {
          amount: amountNum,
          from,
          to,
          result: convertedAmount
        }
      })
    }

    // Return just the rates
    return NextResponse.json(result)

  } catch (error) {
    console.error('Currency API error:', error)
    return NextResponse.json(
      { error: 'Failed to process currency request' },
      { status: 500 }
    )
  }
}
