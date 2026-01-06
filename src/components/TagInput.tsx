'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagInputProps {
  itemId: string
  userId: string
  initialTags?: Tag[]
  onTagsChange?: (tags: Tag[]) => void
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Orange
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
]

export function TagInput({ itemId, userId, initialTags = [], onTagsChange }: TagInputProps) {
  const supabase = createClient()
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load user's existing tags for suggestions
  useEffect(() => {
    async function loadUserTags() {
      const { data } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('name')

      if (data) {
        setSuggestions(data)
      }
    }
    loadUserTags()
  }, [userId])

  // Load item's tags
  useEffect(() => {
    async function loadItemTags() {
      const { data } = await supabase
        .from('item_tags')
        .select('tag_id, tags(id, name, color)')
        .eq('item_id', itemId)

      if (data) {
        const itemTags = data
          .map(it => it.tags)
          .filter(Boolean) as Tag[]
        setTags(itemTags)
        onTagsChange?.(itemTags)
      }
    }
    loadItemTags()
  }, [itemId])

  async function addTag(tagName: string, color?: string) {
    if (!tagName.trim()) return
    if (tags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
      setInputValue('')
      return
    }

    setIsLoading(true)

    try {
      // Check if tag exists for user
      let existingTag = suggestions.find(
        t => t.name.toLowerCase() === tagName.toLowerCase()
      )

      // Create tag if it doesn't exist
      if (!existingTag) {
        const { data: newTag, error: tagError } = await supabase
          .from('tags')
          .insert({
            name: tagName.trim(),
            color: color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
            user_id: userId
          })
          .select()
          .single()

        if (tagError) throw tagError
        existingTag = newTag
        setSuggestions([...suggestions, newTag])
      }

      // Link tag to item
      const { error: linkError } = await supabase
        .from('item_tags')
        .insert({
          item_id: itemId,
          tag_id: existingTag.id
        })

      if (linkError) throw linkError

      const newTags = [...tags, existingTag]
      setTags(newTags)
      onTagsChange?.(newTags)
      setInputValue('')
      setShowSuggestions(false)
    } catch (error) {
      console.error('Error adding tag:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function removeTag(tagId: string) {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('item_tags')
        .delete()
        .eq('item_id', itemId)
        .eq('tag_id', tagId)

      if (error) throw error

      const newTags = tags.filter(t => t.id !== tagId)
      setTags(newTags)
      onTagsChange?.(newTags)
    } catch (error) {
      console.error('Error removing tag:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputChange(value: string) {
    setInputValue(value)
    setShowSuggestions(value.length > 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const filteredSuggestions = suggestions.filter(
    tag =>
      tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.some(t => t.id === tag.id)
  )

  return (
    <div className="relative">
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white transition-all hover:opacity-80"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              disabled={isLoading}
              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${tag.name} tag`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Tag hinzufügen..."
          disabled={isLoading}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white placeholder-slate-400 disabled:opacity-50"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map(tag => (
              <button
                key={tag.id}
                onClick={() => addTag(tag.name, tag.color)}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="dark:text-white">{tag.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Create new tag hint */}
        {showSuggestions && inputValue && filteredSuggestions.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
            <button
              onClick={() => addTag(inputValue)}
              className="w-full text-left text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              + Neues Tag erstellen: "<span className="font-medium">{inputValue}</span>"
            </button>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Enter drücken zum Hinzufügen • Klicke auf ✕ zum Entfernen
      </p>
    </div>
  )
}
