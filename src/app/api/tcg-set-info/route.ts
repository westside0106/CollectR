import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface SetInfo {
  id: string
  name: string
  totalCards: number
  releaseDate?: string
  series?: string
  game: string
}

/**
 * TCG Set Info API
 * Returns information about TCG sets including total card counts
 */
export async function GET(request: NextRequest) {
  // Auth check - require authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const game = searchParams.get('game') || 'pokemon'
  const setId = searchParams.get('setId')
  const setName = searchParams.get('setName')

  try {
    // Pokemon TCG API
    if (game === 'pokemon') {
      // If specific set requested
      if (setId) {
        const response = await fetch(
          `https://api.pokemontcg.io/v2/sets/${setId}`,
          {
            headers: {
              'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          const set = data.data

          const setInfo: SetInfo = {
            id: set.id,
            name: set.name,
            totalCards: set.total || set.printedTotal || 0,
            releaseDate: set.releaseDate,
            series: set.series,
            game: 'pokemon'
          }

          return NextResponse.json({ success: true, set: setInfo })
        }
      }

      // If set name provided, search for it
      if (setName) {
        const response = await fetch(
          `https://api.pokemontcg.io/v2/sets?q=name:"${encodeURIComponent(setName)}"`,
          {
            headers: {
              'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
            }
          }
        )

        if (response.ok) {
          const data = await response.json()

          if (data.data && data.data.length > 0) {
            const set = data.data[0]
            const setInfo: SetInfo = {
              id: set.id,
              name: set.name,
              totalCards: set.total || set.printedTotal || 0,
              releaseDate: set.releaseDate,
              series: set.series,
              game: 'pokemon'
            }

            return NextResponse.json({ success: true, set: setInfo })
          }
        }
      }

      // Return all sets
      const response = await fetch(
        'https://api.pokemontcg.io/v2/sets',
        {
          headers: {
            'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const sets: SetInfo[] = data.data.map((set: any) => ({
          id: set.id,
          name: set.name,
          totalCards: set.total || set.printedTotal || 0,
          releaseDate: set.releaseDate,
          series: set.series,
          game: 'pokemon'
        }))

        return NextResponse.json({ success: true, sets, count: sets.length })
      }
    }

    // Yu-Gi-Oh! - YGOPRODeck API
    if (game === 'yugioh') {
      const response = await fetch('https://db.ygoprodeck.com/api/v7/cardsets.php')

      if (response.ok) {
        const sets = await response.json()

        // If specific set requested
        if (setName) {
          const matchedSet = sets.find((s: any) =>
            s.set_name.toLowerCase() === setName.toLowerCase()
          )

          if (matchedSet) {
            const setInfo: SetInfo = {
              id: matchedSet.set_code || matchedSet.set_name,
              name: matchedSet.set_name,
              totalCards: matchedSet.num_of_cards || 0,
              releaseDate: matchedSet.tcg_date,
              game: 'yugioh'
            }

            return NextResponse.json({ success: true, set: setInfo })
          }
        }

        // Return all sets with card counts
        const setInfos: SetInfo[] = sets.map((set: any) => ({
          id: set.set_code || set.set_name,
          name: set.set_name,
          totalCards: set.num_of_cards || 0,
          releaseDate: set.tcg_date,
          game: 'yugioh'
        }))

        return NextResponse.json({ success: true, sets: setInfos, count: setInfos.length })
      }
    }

    // Magic: The Gathering - Scryfall API
    if (game === 'magic') {
      // If specific set requested
      if (setId || setName) {
        const searchCode = (setId || setName) as string
        const response = await fetch(
          `https://api.scryfall.com/sets/${encodeURIComponent(searchCode)}`
        )

        if (response.ok) {
          const set = await response.json()
          const setInfo: SetInfo = {
            id: set.code,
            name: set.name,
            totalCards: set.card_count || 0,
            releaseDate: set.released_at,
            series: set.set_type,
            game: 'magic'
          }

          return NextResponse.json({ success: true, set: setInfo })
        }
      }

      // Return all sets
      const response = await fetch('https://api.scryfall.com/sets')

      if (response.ok) {
        const data = await response.json()
        const sets: SetInfo[] = data.data.map((set: any) => ({
          id: set.code,
          name: set.name,
          totalCards: set.card_count || 0,
          releaseDate: set.released_at,
          series: set.set_type,
          game: 'magic'
        }))

        return NextResponse.json({ success: true, sets, count: sets.length })
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Game not supported or set not found'
    }, { status: 404 })

  } catch (error) {
    console.error('Set info lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch set information' },
      { status: 500 }
    )
  }
}
