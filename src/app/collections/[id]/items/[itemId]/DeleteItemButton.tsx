'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function DeleteItemButton({ itemId, collectionId }: { itemId: string; collectionId: string }) {
  const router = useRouter()
  
  async function handleDelete() {
    if (!confirm('Item wirklich löschen?')) return
    
    const supabase = createClient()
    await supabase.from('items').delete().eq('id', itemId)
    
    router.push(`/collections/${collectionId}`)
    router.refresh()
  }
  
  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
    >
      Löschen
    </button>
  )
}
