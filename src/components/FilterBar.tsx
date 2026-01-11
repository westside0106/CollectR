'use client'

import { useState } from 'react'

interface Tag {
  id: string
  name: string
  color: string
}

interface FilterBarProps {
  categories: { id: string; name: string; icon: string | null }[]
  selectedCategory: string
  onCategoryChange: (id: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  minPrice: string
  maxPrice: string
  onPriceChange: (min: string, max: string) => void
  // Tag filter props (optional for backwards compatibility)
  availableTags?: Tag[]
  selectedTags?: string[]
  onTagsChange?: (tags: string[]) => void
}

const STATUS_OPTIONS = [
  { value: '', label: 'Alle Status' },
  { value: 'in_collection', label: '📦 In Sammlung' },
  { value: 'wishlist', label: '⭐ Wunschliste' },
  { value: 'ordered', label: '📬 Bestellt' },
  { value: 'sold', label: '💰 Verkauft' },
  { value: 'lost', label: '❌ Verloren' },
]

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Neueste zuerst' },
  { value: 'created_at:asc', label: 'Älteste zuerst' },
  { value: 'name:asc', label: 'Name (A-Z)' },
  { value: 'name:desc', label: 'Name (Z-A)' },
  { value: 'purchase_price:desc', label: 'Preis (höchste)' },
  { value: 'purchase_price:asc', label: 'Preis (niedrigste)' },
  { value: 'purchase_date:desc', label: 'Kaufdatum (neueste)' },
  { value: 'purchase_date:asc', label: 'Kaufdatum (älteste)' },
]

export function FilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  minPrice,
  maxPrice,
  onPriceChange,
  availableTags = [],
  selectedTags = [],
  onTagsChange,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleTag = (tagId: string) => {
    if (!onTagsChange) return
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId))
    } else {
      onTagsChange([...selectedTags, tagId])
    }
  }

  const activeFilterCount = [
    selectedCategory,
    selectedStatus,
    minPrice,
    maxPrice,
    selectedTags.length > 0 ? 'tags' : ''
  ].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Kompakte Filter-Zeile */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            isExpanded || activeFilterCount > 0
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
          }`}
          aria-label={isExpanded ? 'Filter einklappen' : 'Filter ausklappen'}
          aria-expanded={isExpanded}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm font-medium">Filter</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Sortierung immer sichtbar */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Erweiterte Filter (aufklappbar) */}
      {isExpanded && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-wrap gap-3">
            {/* Kategorie Filter */}
            {categories.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">Kategorie</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Alle Kategorien</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preis Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">Preis</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => onPriceChange(e.target.value, maxPrice)}
                  placeholder="Min €"
                  className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <span className="text-slate-400 dark:text-slate-500">–</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => onPriceChange(minPrice, e.target.value)}
                  placeholder="Max €"
                  className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'text-white ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-500'
                          : 'text-white opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: tag.color }}
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Aktive Filter Tags */}
          <ActiveFilterTags
            selectedCategory={selectedCategory}
            categories={categories}
            selectedStatus={selectedStatus}
            minPrice={minPrice}
            maxPrice={maxPrice}
            selectedTags={selectedTags}
            availableTags={availableTags}
            onClearCategory={() => onCategoryChange('')}
            onClearStatus={() => onStatusChange('')}
            onClearPrice={() => onPriceChange('', '')}
            onClearTag={(tagId) => onTagsChange?.(selectedTags.filter(id => id !== tagId))}
          />
        </div>
      )}

      {/* Kompakte aktive Filter Anzeige wenn eingeklappt */}
      {!isExpanded && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <ActiveFilterTags
            selectedCategory={selectedCategory}
            categories={categories}
            selectedStatus={selectedStatus}
            minPrice={minPrice}
            maxPrice={maxPrice}
            selectedTags={selectedTags}
            availableTags={availableTags}
            onClearCategory={() => onCategoryChange('')}
            onClearStatus={() => onStatusChange('')}
            onClearPrice={() => onPriceChange('', '')}
            onClearTag={(tagId) => onTagsChange?.(selectedTags.filter(id => id !== tagId))}
            compact
          />
        </div>
      )}
    </div>
  )
}

function ActiveFilterTags({
  selectedCategory,
  categories,
  selectedStatus,
  minPrice,
  maxPrice,
  selectedTags = [],
  availableTags = [],
  onClearCategory,
  onClearStatus,
  onClearPrice,
  onClearTag,
  compact = false,
}: {
  selectedCategory: string
  categories: { id: string; name: string; icon: string | null }[]
  selectedStatus: string
  minPrice: string
  maxPrice: string
  selectedTags?: string[]
  availableTags?: Tag[]
  onClearCategory: () => void
  onClearStatus: () => void
  onClearPrice: () => void
  onClearTag?: (tagId: string) => void
  compact?: boolean
}) {
  const hasFilters = selectedCategory || selectedStatus || minPrice || maxPrice || selectedTags.length > 0

  if (!hasFilters) return null

  const category = categories.find(c => c.id === selectedCategory)
  const status = STATUS_OPTIONS.find(s => s.value === selectedStatus)

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {!compact && <span className="text-sm text-slate-500 dark:text-slate-400">Aktive Filter:</span>}

      {category && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm">
          {category.icon} {category.name}
          <button onClick={onClearCategory} className="hover:text-blue-900 dark:hover:text-blue-100">✕</button>
        </span>
      )}

      {status && selectedStatus && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-sm">
          {status.label}
          <button onClick={onClearStatus} className="hover:text-green-900 dark:hover:text-green-100">✕</button>
        </span>
      )}

      {(minPrice || maxPrice) && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm">
          {minPrice || '0'}€ – {maxPrice || '∞'}€
          <button onClick={onClearPrice} className="hover:text-purple-900 dark:hover:text-purple-100">✕</button>
        </span>
      )}

      {/* Selected Tags */}
      {selectedTags.map(tagId => {
        const tag = availableTags.find(t => t.id === tagId)
        if (!tag) return null
        return (
          <span
            key={tagId}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button onClick={() => onClearTag?.(tagId)} className="hover:bg-white/20 rounded-full">✕</button>
          </span>
        )
      })}
    </div>
  )
}
