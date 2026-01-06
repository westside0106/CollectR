'use client'

import { TagInput } from './TagInput'

interface TagSectionProps {
  itemId: string
  userId: string
}

export function TagSection({ itemId, userId }: TagSectionProps) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Tags</h2>
      <TagInput itemId={itemId} userId={userId} />
    </section>
  )
}
