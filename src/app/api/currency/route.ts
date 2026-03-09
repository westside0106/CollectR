import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Frankfurter.app – EZB-Kurse, komplett kostenlos, kein API-Key nötig
// Docs: https://www.frankfurter.app/docs/
const FRANKFURTER_BASE = 'https://api.frankfurter.app'

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

type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code']

interface FrankfurterResponse {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

interface ExchangeRates {
  base: string
  timestamp: number
  rates: Record<string, number>
}

export async function GET(request: NextRequest) {
  try {
    // Auth-Check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const amount = searchParams.get('amount')
    const from = searchParams.get('from') as CurrencyCode | null
    const to = searchParams.get('to') as CurrencyCode | null

    // Alle Währungen außer EUR abrufen (EUR ist Base)
    const symbols = SUPPORTED_CURRENCIES
      .filter(c => c.code !== 'EUR')
      .map(c => c.code)
      .join(',')

    const response = await fetch(
      `${FRANKFURTER_BASE}/latest?base=EUR&symbols=${symbols}`,
      { next: { revalidate: 3600 } } // 1 Stunde Cache
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Fehler beim Abrufen der Wechselkurse' },
        { status: 502 }
      )
    }

    const data: FrankfurterResponse = await response.json()

    // EUR immer mit Rate 1 ergänzen
    const rates: Record<string, number> = { ...data.rates, EUR: 1 }

    const result: ExchangeRates = {
      base: 'EUR',
      timestamp: Math.floor(new Date(data.date).getTime() / 1000),
      rates,
    }

    // Wenn Umrechnungsparameter vorhanden → direkt umrechnen
    if (amount && from && to) {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum)) {
        return NextResponse.json({ error: 'Ungültiger Betrag' }, { status: 400 })
      }

      if (from === to) {
        return NextResponse.json({
          ...result,
          conversion: { amount: amountNum, from, to, result: amountNum },
        })
      }

      const fromRate = rates[from]
      const toRate = rates[to]

      if (!fromRate || !toRate) {
        return NextResponse.json(
          { error: `Kurs nicht gefunden für ${from} oder ${to}` },
          { status: 400 }
        )
      }

      // Umrechnung über EUR als Zwischenwährung
      const amountInEUR = amountNum / fromRate
      const convertedAmount = Math.round(amountInEUR * toRate * 100) / 100

      return NextResponse.json({
        ...result,
        conversion: { amount: amountNum, from, to, result: convertedAmount },
      })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Currency API error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Verarbeiten der Währungsanfrage' },
      { status: 500 }
    )
  }
}
