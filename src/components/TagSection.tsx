'use client'

import { TagInput } from './TagInput'
import { CollapsibleSection } from './CollapsibleSection'

interface TagSectionProps {
  itemId: string
  userId: string
}

export function TagSection({ itemId, userId }: TagSectionProps) {
  return (
    <CollapsibleSection title="Tags">
      <TagInput itemId={itemId} userId={userId} />
    </CollapsibleSection>
  )
}
