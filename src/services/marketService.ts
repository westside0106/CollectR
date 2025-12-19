/**
 * Market Service für CollectR
 * 
 * Verwendet marketstack API für Börsenkurse
 * Nützlich für Investment-Sammlungen (Gold, Silber, etc.)
 * Free Tier: 100 Requests/Monat
 * 
 * API Docs: https://marketstack.com/documentation
 */

export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
  date: string
}

interface MarketstackResponse {
  pagination: {
    limit: number
    offset: number
    count: number
    total: number
  }
  data: Array<{
    open: number
    high: number
    low: number
    close: number
    volume: number
    adj_high: number
    adj_low: number
    adj_close: number
    adj_open: number
    adj_volume: number
    symbol: string
    exchange: string
    date: string
  }>
  error?: {
    code: string
    message: string
  }
}

// Relevante Symbole für Sammler
export const COLLECTIBLE_RELATED_SYMBOLS = {
  // Edelmetalle (wichtig für Münzsammler)
  gold: 'GLD',      // SPDR Gold Trust ETF
  silver: 'SLV',    // iShares Silver Trust
  
  // Auktionshäuser
  sothebys: 'BID',  // Sotheby's (wenn verfügbar)
  
  // Luxusmarken (relevant für Uhren, Schmuck)
  lvmh: 'MC.XPAR',  // LVMH
  richemont: 'CFR.XSWX', // Richemont (Cartier, IWC)
  
  // Spielzeug/Sammlerstücke
  hasbro: 'HAS',    // Hasbro
  mattel: 'MAT',    // Mattel (Hot Wheels!)
  funko: 'FNKO',    // Funko (Pop! Figuren)
} as const

export type CollectibleSymbol = keyof typeof COLLECTIBLE_RELATED_SYMBOLS

// Cache für Kurse (5 Minuten)
const priceCache: Map<string, { data: StockQuote, timestamp: number }> = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 Minuten

/**
 * Holt den aktuellen Kurs für ein Symbol
 */
export async function getStockPrice(symbol: string): Promise<StockQuote | null> {
  // Cache prüfen
  const cached = priceCache.get(symbol)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  const apiKey = process.env.NEXT_PUBLIC_MARKETSTACK_API_KEY
  
  if (!apiKey) {
    console.warn('MARKETSTACK_API_KEY nicht gesetzt')
    return null
  }

  try {
    const url = `http://api.marketstack.com/v1/eod/latest?access_key=${apiKey}&symbols=${symbol}`
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // Next.js Cache: 5 Minuten
    })

    const data: MarketstackResponse = await response.json()

    if (data.error || !data.data || data.data.length === 0) {
      console.error('Marketstack Error:', data.error)
      return null
    }

    const quote = data.data[0]
    const result: StockQuote = {
      symbol: quote.symbol,
      name: getSymbolName(quote.symbol),
      price: quote.close,
      change: quote.close - quote.open,
      changePercent: ((quote.close - quote.open) / quote.open) * 100,
      high: quote.high,
      low: quote.low,
      volume: quote.volume,
      date: quote.date
    }

    // Cache aktualisieren
    priceCache.set(symbol, {
      data: result,
      timestamp: Date.now()
    })

    return result
  } catch (error) {
    console.error('Fehler beim Abrufen des Kurses:', error)
    return null
  }
}

/**
 * Holt Kurse für mehrere Symbole
 */
export async function getMultipleStockPrices(symbols: string[]): Promise<StockQuote[]> {
  const apiKey = process.env.NEXT_PUBLIC_MARKETSTACK_API_KEY
  
  if (!apiKey) {
    console.warn('MARKETSTACK_API_KEY nicht gesetzt')
    return []
  }

  try {
    const symbolList = symbols.join(',')
    const url = `http://api.marketstack.com/v1/eod/latest?access_key=${apiKey}&symbols=${symbolList}`
    
    const response = await fetch(url, {
      next: { revalidate: 300 }
    })

    const data: MarketstackResponse = await response.json()

    if (data.error || !data.data) {
      console.error('Marketstack Error:', data.error)
      return []
    }

    return data.data.map(quote => ({
      symbol: quote.symbol,
      name: getSymbolName(quote.symbol),
      price: quote.close,
      change: quote.close - quote.open,
      changePercent: ((quote.close - quote.open) / quote.open) * 100,
      high: quote.high,
      low: quote.low,
      volume: quote.volume,
      date: quote.date
    }))
  } catch (error) {
    console.error('Fehler beim Abrufen der Kurse:', error)
    return []
  }
}

/**
 * Holt relevante Marktdaten für Sammler
 */
export async function getCollectibleMarketData(): Promise<StockQuote[]> {
  const symbols = Object.values(COLLECTIBLE_RELATED_SYMBOLS)
  return getMultipleStockPrices(symbols)
}

/**
 * Gibt den lesbaren Namen für ein Symbol zurück
 */
function getSymbolName(symbol: string): string {
  const names: Record<string, string> = {
    'GLD': 'Gold (ETF)',
    'SLV': 'Silber (ETF)',
    'BID': "Sotheby's",
    'MC.XPAR': 'LVMH',
    'CFR.XSWX': 'Richemont',
    'HAS': 'Hasbro',
    'MAT': 'Mattel',
    'FNKO': 'Funko',
  }
  return names[symbol] || symbol
}

/**
 * Formatiert einen Preis
 */
export function formatStockPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(price)
}

/**
 * Formatiert die Änderung mit Farbe
 */
export function formatChange(change: number, percent: number): {
  text: string
  color: 'green' | 'red' | 'gray'
} {
  const sign = change >= 0 ? '+' : ''
  return {
    text: `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`,
    color: change > 0 ? 'green' : change < 0 ? 'red' : 'gray'
  }
}
