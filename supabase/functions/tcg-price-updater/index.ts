// TCG Price Updater - Scheduled Function
// Runs daily to update prices for all TCG items
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const BATCH_SIZE = 10 // Process 10 items at a time
const DELAY_BETWEEN_REQUESTS = 1000 // 1 second delay to avoid rate limiting

interface TCGItem {
  id: string
  name: string
  collection_id: string
  attributes: Record<string, any>
  _computed_value: number | null
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting TCG price update job...')

    // 1. Fetch all TCG items (items with grading attribute)
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('id, name, collection_id, attributes, _computed_value')
      .eq('status', 'in_collection')
      .not('attributes->grading', 'is', null)
      .limit(1000) // Process max 1000 items per run

    if (fetchError) {
      console.error('Failed to fetch items:', fetchError)
      throw fetchError
    }

    if (!items || items.length === 0) {
      console.log('No TCG items found to update')
      return new Response(
        JSON.stringify({ message: 'No TCG items to update', updated: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${items.length} TCG items to update`)

    let updated = 0
    let failed = 0
    let skipped = 0

    // 2. Process items in batches
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, Math.min(i + BATCH_SIZE, items.length))

      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)}`)

      for (const item of batch) {
        try {
          const grading = item.attributes?.grading
          const setName = item.attributes?.set || item.attributes?.edition || ''
          const cardNumber = item.attributes?.card_number || item.attributes?.number || ''

          // Determine game type from collection or attributes
          let gameType = 'pokemon' // Default to pokemon
          if (item.attributes?.game_type) {
            gameType = item.attributes.game_type
          }

          // Call price lookup function
          const priceLookupUrl = `${supabaseUrl}/functions/v1/tcg-price-lookup`
          const response = await fetch(priceLookupUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cardName: item.name,
              setName: setName,
              cardNumber: cardNumber,
              game: gameType,
              grading: grading && typeof grading === 'object' ? {
                company: grading.company,
                grade: grading.grade
              } : undefined
            })
          })

          if (!response.ok) {
            console.error(`Failed to fetch price for ${item.name}:`, response.status)
            failed++
            continue
          }

          const result = await response.json()

          // Determine price to use
          let priceToUse = 0
          if (grading && result.gradedPrice) {
            priceToUse = result.gradedPrice.estimated
          } else if (result.rawPrice) {
            priceToUse = result.rawPrice.market || result.rawPrice.avg
          }

          // Only update if price has changed significantly (more than 1% or more than 0.50 EUR)
          if (priceToUse > 0) {
            const currentPrice = item._computed_value || 0
            const priceDiff = Math.abs(priceToUse - currentPrice)
            const priceChangePercent = currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 100

            if (priceChangePercent > 1 || priceDiff > 0.50) {
              // Update item in database (trigger will log to price history)
              const { error: updateError } = await supabase
                .from('items')
                .update({
                  _computed_value: priceToUse,
                  updated_at: new Date().toISOString()
                })
                .eq('id', item.id)

              if (updateError) {
                console.error(`Failed to update ${item.name}:`, updateError)
                failed++
              } else {
                console.log(`Updated ${item.name}: ${currentPrice.toFixed(2)} → ${priceToUse.toFixed(2)} EUR`)
                updated++
              }
            } else {
              console.log(`Skipped ${item.name}: price change too small (${priceDiff.toFixed(2)} EUR)`)
              skipped++
            }
          } else {
            console.log(`No price found for ${item.name}`)
            failed++
          }

          // Delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))

        } catch (error) {
          console.error(`Error processing ${item.name}:`, error)
          failed++
        }
      }
    }

    const summary = {
      message: 'TCG price update completed',
      total: items.length,
      updated,
      failed,
      skipped,
      timestamp: new Date().toISOString()
    }

    console.log('Update job completed:', summary)

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Price update job failed:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to run price update job',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
