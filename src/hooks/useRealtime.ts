'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeOptions<T> {
  table: string
  schema?: string
  event?: PostgresChangeEvent
  filter?: string
  onInsert?: (record: T) => void
  onUpdate?: (record: T, old: Partial<T>) => void
  onDelete?: (old: Partial<T>) => void
  onChange?: () => void
}

/**
 * Hook für Supabase Realtime Subscriptions
 *
 * Beispiel:
 * ```tsx
 * useRealtime({
 *   table: 'items',
 *   filter: `collection_id=eq.${collectionId}`,
 *   onChange: () => refetchItems()
 * })
 * ```
 */
export function useRealtime<T extends Record<string, unknown>>({
  table,
  schema = 'public',
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange
}: UseRealtimeOptions<T>) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      if (eventType === 'INSERT' && onInsert && newRecord) {
        onInsert(newRecord as T)
      } else if (eventType === 'UPDATE' && onUpdate && newRecord) {
        onUpdate(newRecord as T, oldRecord as Partial<T>)
      } else if (eventType === 'DELETE' && onDelete) {
        onDelete(oldRecord as Partial<T>)
      }

      // Generischer onChange Callback
      if (onChange) {
        onChange()
      }
    },
    [onInsert, onUpdate, onDelete, onChange]
  )

  useEffect(() => {
    // Eindeutiger Channel-Name
    const channelName = `${table}-${filter || 'all'}-${Date.now()}`

    // Channel konfigurieren
    const channelConfig: {
      event: PostgresChangeEvent
      schema: string
      table: string
      filter?: string
    } = {
      event,
      schema,
      table
    }

    if (filter) {
      channelConfig.filter = filter
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        channelConfig,
        handleChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime: Subscribed to ${table}${filter ? ` (${filter})` : ''}`)
        }
      })

    channelRef.current = channel

    // Cleanup bei Unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, schema, event, filter, handleChange, supabase])

  return channelRef.current
}

/**
 * Vereinfachter Hook der bei jeder Änderung eine Funktion aufruft
 */
export function useRealtimeRefresh(
  table: string,
  onRefresh: () => void,
  filter?: string
) {
  return useRealtime({
    table,
    filter,
    onChange: onRefresh
  })
}
