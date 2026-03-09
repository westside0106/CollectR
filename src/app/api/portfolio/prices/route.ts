import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Alpha Vantage – gratis, 25 req/Tag, kein Echtzeit (15 min delay)
// Key holen: https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY ?? ''

interface StockPrice {
  ticker: string
  price: number
  change: number
  changePercent: number
  currency: string
  lastUpdated: string
}

interface CryptoPrice {
  id: string
  price: number
  change24h: number
  currency: string
}

// Aktienpreis über Alpha Vantage abrufen
async function fetchStockPrice(ticker: string): Promise<StockPrice | null> {
  if (!ALPHA_VANTAGE_KEY) return null

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${ALPHA_VANTAGE_KEY}`
    const response = await fetch(url, { next: { revalidate: 900 } }) // 15 min Cache

    if (!response.ok) return null

    const data = await response.json()
    const quote = data['Global Quote']

    if (!quote || !quote['05. price']) return null

    const price = parseFloat(quote['05. price'])
    const change = parseFloat(quote['09. change'])
    const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') ?? '0')

    return {
      ticker,
      price,
      change,
      changePercent,
      currency: 'USD', // Alpha Vantage liefert immer USD
      lastUpdated: quote['07. latest trading day'] ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// Crypto-Preise über CoinGecko abrufen (bereits genutzt in marketService)
async function fetchCryptoPrices(coinIds: string[]): Promise<Record<string, CryptoPrice>> {
  if (coinIds.length === 0) return {}

  try {
    const ids = coinIds.join(',')
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=eur&include_24hr_change=true`
    const response = await fetch(url, { next: { revalidate: 300 } }) // 5 min Cache

    if (!response.ok) return {}

    const data = await response.json()
    const result: Record<string, CryptoPrice> = {}

    for (const [id, values] of Object.entries(data)) {
      const v = values as Record<string, number>
      result[id] = {
        id,
        price: v.eur ?? 0,
        change24h: v.eur_24h_change ?? 0,
        currency: 'EUR',
      }
    }

    return result
  } catch {
    return {}
  }
}

// GET /api/portfolio/prices?stocks=AAPL,MSFT&cryptos=bitcoin,ethereum
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const stocksParam = searchParams.get('stocks') ?? ''
  const cryptosParam = searchParams.get('cryptos') ?? ''

  const stockTickers = stocksParam ? stocksParam.split(',').filter(Boolean) : []
  const cryptoIds = cryptosParam ? cryptosParam.split(',').filter(Boolean) : []

  // Parallel abrufen
  const [stockResults, cryptoResults] = await Promise.all([
    Promise.all(stockTickers.map(t => fetchStockPrice(t))),
    fetchCryptoPrices(cryptoIds),
  ])

  const stocks: Record<string, StockPrice | null> = {}
  stockTickers.forEach((ticker, i) => {
    stocks[ticker] = stockResults[i]
  })

  return NextResponse.json({
    stocks,
    cryptos: cryptoResults,
    alphaVantageConfigured: !!ALPHA_VANTAGE_KEY,
  })
}
