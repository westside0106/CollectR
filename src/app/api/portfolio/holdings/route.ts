import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type HoldingType = 'stock' | 'crypto'

export interface PortfolioHolding {
  id: string
  user_id: string
  type: HoldingType
  ticker: string
  name: string
  coingecko_id: string | null
  quantity: number | null
  invested_amount: number | null
  purchase_price: number | null
  currency: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateHoldingPayload {
  type: HoldingType
  ticker: string
  name: string
  coingecko_id?: string
  quantity?: number
  invested_amount?: number
  purchase_price?: number
  currency?: string
  notes?: string
}

// GET /api/portfolio/holdings – alle Holdings des eingeloggten Users
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_portfolio_holdings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Portfolio GET error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Holdings' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/portfolio/holdings – neue Position hinzufügen
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateHoldingPayload = await request.json()

  // Validierung
  if (!body.type || !body.ticker || !body.name) {
    return NextResponse.json(
      { error: 'type, ticker und name sind Pflichtfelder' },
      { status: 400 }
    )
  }

  if (!body.quantity && !body.invested_amount) {
    return NextResponse.json(
      { error: 'Entweder quantity oder invested_amount muss angegeben werden' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('user_portfolio_holdings')
    .insert({
      user_id: user.id,
      type: body.type,
      ticker: body.ticker.toUpperCase(),
      name: body.name,
      coingecko_id: body.coingecko_id ?? null,
      quantity: body.quantity ?? null,
      invested_amount: body.invested_amount ?? null,
      purchase_price: body.purchase_price ?? null,
      currency: body.currency ?? 'EUR',
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Portfolio POST error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern der Position' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/portfolio/holdings?id=... – Position löschen
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id Parameter erforderlich' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_portfolio_holdings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // RLS-Doppelschutz

  if (error) {
    console.error('Portfolio DELETE error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Position' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
