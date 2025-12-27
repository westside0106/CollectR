'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'

export function DeleteItemButton({ itemId, collectionId }: { itemId: string; collectionId: string }) {
  const router = useRouter()
  const { showToast } = useToast()

  async function handleDelete() {
    if (!confirm('Item wirklich löschen?')) return

    const supabase = createClient()
    const { error } = await supabase.from('items').delete().eq('id', itemId)

    if (error) {
      showToast('Fehler beim Löschen', 'error')
      return
    }

    showToast('Item gelöscht!')
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
