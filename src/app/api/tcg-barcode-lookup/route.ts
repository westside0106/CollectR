import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

/**
 * TCG Barcode Lookup API
 * Searches for trading cards by product barcode/UPC
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const barcode = searchParams.get('barcode')
  const game = searchParams.get('game') || 'pokemon'

  if (!barcode) {
    return NextResponse.json(
      { error: 'Barcode parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Pokemon TCG API supports UPC lookup
    if (game === 'pokemon') {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=set.ptcgoCode:${barcode}`,
        {
          headers: {
            'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
          }
        }
      )

      if (response.ok) {
        const data = await response.json()

        if (data.data && data.data.length > 0) {
          // Return first matching card (booster packs often have multiple cards)
          const cards = data.data.map((card: any) => ({
            id: card.id,
            name: card.name,
            set: card.set?.name,
            setCode: card.set?.id,
            number: card.number,
            rarity: card.rarity,
            imageUrl: card.images?.large || card.images?.small,
            price: card.tcgplayer?.prices?.holofoil?.market ||
                   card.tcgplayer?.prices?.normal?.market ||
                   card.cardmarket?.prices?.averageSellPrice,
            game: 'pokemon',
            barcode: barcode
          }))

          return NextResponse.json({
            success: true,
            game: 'pokemon',
            barcode: barcode,
            cards: cards,
            count: cards.length
          })
        }
      }
    }

    // Yu-Gi-Oh! - YGOPRODeck doesn't support barcode lookup directly
    // We'll try to search by set code if barcode matches known patterns
    if (game === 'yugioh') {
      // Try to extract set code from barcode (if it follows known pattern)
      // Most Yu-Gi-Oh! barcodes don't directly map to cards
      return NextResponse.json({
        success: false,
        game: 'yugioh',
        barcode: barcode,
        message: 'Yu-Gi-Oh! barcode lookup not directly supported. Try manual search or camera scan.',
        cards: []
      })
    }

    // Magic: The Gathering - Scryfall doesn't support UPC lookup
    if (game === 'magic') {
      return NextResponse.json({
        success: false,
        game: 'magic',
        barcode: barcode,
        message: 'Magic barcode lookup not directly supported. Try manual search or camera scan.',
        cards: []
      })
    }

    return NextResponse.json({
      success: false,
      barcode: barcode,
      message: 'No cards found for this barcode',
      cards: []
    })

  } catch (error) {
    console.error('Barcode lookup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to lookup barcode',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { barcode, game = 'pokemon' } = body

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      )
    }

    // Redirect to GET with query params
    const url = new URL(request.url)
    url.pathname = '/api/tcg-barcode-lookup'
    url.searchParams.set('barcode', barcode)
    url.searchParams.set('game', game)

    const response = await fetch(url.toString(), {
      method: 'GET'
    })

    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers
    })

  } catch (error) {
    console.error('Barcode lookup POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
