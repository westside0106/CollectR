/**
 * Currency Service für CollectR
 * 
 * Verwendet currencylayer API für Währungsumrechnung
 * Free Tier: 1.000 Requests/Monat, stündliche Updates
 * 
 * API Docs: https://currencylayer.com/documentation
 */

// Unterstützte Währungen in CollectR
export const SUPPORTED_CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'Britisches Pfund' },
  { code: 'CHF', symbol: 'Fr.', name: 'Schweizer Franken' },
  { code: 'JPY', symbol: '¥', name: 'Japanischer Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinesischer Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australischer Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Kanadischer Dollar' },
] as const

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code']

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

// Cache für Exchange Rates (1 Stunde gültig)
let cachedRates: ExchangeRates | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 Stunde in ms

/**
 * Holt aktuelle Wechselkurse von currencylayer
 */
export async function getExchangeRates(): Promise<ExchangeRates | null> {
  // Cache prüfen
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedRates
  }

  const apiKey = process.env.NEXT_PUBLIC_CURRENCYLAYER_API_KEY
  
  if (!apiKey) {
    console.warn('CURRENCYLAYER_API_KEY nicht gesetzt')
    return null
  }

  try {
    const currencies = SUPPORTED_CURRENCIES.map(c => c.code).join(',')
    const response = await fetch(
      `https://api.currencylayer.com/live?access_key=${apiKey}&currencies=${currencies}`,
      { next: { revalidate: 3600 } } // Next.js Cache: 1 Stunde
    )

    const data: CurrencyLayerResponse = await response.json()

    if (!data.success) {
      console.error('Currencylayer Error:', data.error)
      return null
    }

    // Umwandeln in einfacheres Format
    // currencylayer gibt "USDEUR" zurück, wir wollen nur "EUR"
    const rates: Record<string, number> = {}
    for (const [key, value] of Object.entries(data.quotes)) {
      const currency = key.replace('USD', '')
      rates[currency] = value
    }
    rates['USD'] = 1 // USD ist immer 1 (Basis)

    cachedRates = {
      base: 'USD',
      timestamp: data.timestamp,
      rates
    }
    cacheTimestamp = Date.now()

    return cachedRates
  } catch (error) {
    console.error('Fehler beim Abrufen der Wechselkurse:', error)
    return null
  }
}

/**
 * Konvertiert einen Betrag von einer Währung in eine andere
 */
export async function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number | null> {
  if (from === to) return amount

  const rates = await getExchangeRates()
  if (!rates) return null

  // Beide Kurse relativ zu USD
  const fromRate = rates.rates[from]
  const toRate = rates.rates[to]

  if (!fromRate || !toRate) {
    console.error(`Wechselkurs nicht gefunden: ${from} oder ${to}`)
    return null
  }

  // Umrechnung: amount in USD, dann in Zielwährung
  const amountInUSD = amount / fromRate
  const result = amountInUSD * toRate

  return Math.round(result * 100) / 100 // Auf 2 Dezimalstellen runden
}

/**
 * Formatiert einen Betrag mit Währungssymbol
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale: string = 'de-DE'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Gibt das Symbol für eine Währung zurück
 */
export function getCurrencySymbol(code: CurrencyCode): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === code)
  return currency?.symbol || code
}

/**
 * Hook-freundliche Funktion für Client Components
 */
export async function getConvertedPrice(
  price: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<{ 
  original: string
  converted: string | null
  rate: number | null 
}> {
  const converted = await convertCurrency(price, fromCurrency, toCurrency)
  const rates = await getExchangeRates()
  
  return {
    original: formatCurrency(price, fromCurrency),
    converted: converted ? formatCurrency(converted, toCurrency) : null,
    rate: rates ? rates.rates[toCurrency] / rates.rates[fromCurrency] : null
  }
}
