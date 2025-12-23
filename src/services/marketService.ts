/**
 * Market Service für CollectR
 * 
 * Verwendet CoinGecko API (komplett kostenlos, kein API-Key nötig!)
 * Zeigt Edelmetalle & relevante Assets für Sammler
 * 
 * API Docs: https://www.coingecko.com/en/api/documentation
 */

export interface AssetQuote {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume: number
  marketCap: number
  image: string
  lastUpdated: string
}

interface CoinGeckoMarket {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  roi: any
  last_updated: string
}

// Relevante Assets für Sammler (Edelmetalle + Blockchain-Collectibles)
export const COLLECTIBLE_ASSETS = [
  'pax-gold',      // Gold (tokenisiert)
  'tether-gold',   // Gold
  'silver-token',  // Silber (tokenisiert)
  'bitcoin',       // Digital Collectible
  'ethereum',      // NFT Platform
  'sandbox',       // Virtual Land/Collectibles
  'decentraland',  // Virtual Land
  'axie-infinity', // Gaming Collectibles
] as const

export type CollectibleAsset = typeof COLLECTIBLE_ASSETS[number]

// Cache für Kurse (5 Minuten)
const priceCache: Map<string, { data: AssetQuote[], timestamp: number }> = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 Minuten

/**
 * Holt Marktdaten für Sammler-relevante Assets
 */
export async function getCollectibleMarketData(): Promise<AssetQuote[]> {
  // Cache prüfen
  const cached = priceCache.get('collectibles')
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const ids = COLLECTIBLE_ASSETS.join(',')
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // Next.js Cache: 5 Minuten
    })

    if (!response.ok) {
      console.error('CoinGecko API Error:', response.status)
      return []
    }

    const data: CoinGeckoMarket[] = await response.json()

    const quotes: AssetQuote[] = data.map(asset => ({
      id: asset.id,
      symbol: asset.symbol.toUpperCase(),
      name: getAssetDisplayName(asset.id),
      price: asset.current_price,
      change24h: asset.price_change_24h || 0,
      changePercent24h: asset.price_change_percentage_24h || 0,
      high24h: asset.high_24h || 0,
      low24h: asset.low_24h || 0,
      volume: asset.total_volume || 0,
      marketCap: asset.market_cap || 0,
      image: asset.image,
      lastUpdated: asset.last_updated
    }))

    // Cache aktualisieren
    priceCache.set('collectibles', {
      data: quotes,
      timestamp: Date.now()
    })

    return quotes
  } catch (error) {
    console.error('Fehler beim Abrufen der Marktdaten:', error)
    return []
  }
}

/**
 * Holt Daten für ein einzelnes Asset
 */
export async function getAssetPrice(assetId: string): Promise<AssetQuote | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${assetId}`
    
    const response = await fetch(url, {
      next: { revalidate: 300 }
    })

    if (!response.ok) return null

    const data: CoinGeckoMarket[] = await response.json()
    if (data.length === 0) return null

    const asset = data[0]
    return {
      id: asset.id,
      symbol: asset.symbol.toUpperCase(),
      name: getAssetDisplayName(asset.id),
      price: asset.current_price,
      change24h: asset.price_change_24h || 0,
      changePercent24h: asset.price_change_percentage_24h || 0,
      high24h: asset.high_24h || 0,
      low24h: asset.low_24h || 0,
      volume: asset.total_volume || 0,
      marketCap: asset.market_cap || 0,
      image: asset.image,
      lastUpdated: asset.last_updated
    }
  } catch (error) {
    console.error('Fehler beim Abrufen des Asset-Preises:', error)
    return null
  }
}

/**
 * Gibt den lesbaren Namen für ein Asset zurück
 */
function getAssetDisplayName(assetId: string): string {
  const names: Record<string, string> = {
    'pax-gold': 'Gold (PAX)',
    'tether-gold': 'Gold (XAUt)',
    'silver-token': 'Silber Token',
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum',
    'sandbox': 'The Sandbox',
    'decentraland': 'Decentraland',
    'axie-infinity': 'Axie Infinity',
  }
  return names[assetId] || assetId
}

/**
 * Formatiert einen Preis
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: price < 1 ? 4 : 2,
    maximumFractionDigits: price < 1 ? 4 : 2,
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

/**
 * Formatiert Market Cap
 */
export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000) {
    return `${(marketCap / 1_000_000_000).toFixed(2)}B`
  } else if (marketCap >= 1_000_000) {
    return `${(marketCap / 1_000_000).toFixed(2)}M`
  } else if (marketCap >= 1_000) {
    return `${(marketCap / 1_000).toFixed(2)}K`
  }
  return marketCap.toFixed(2)
}
