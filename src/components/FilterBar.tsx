'use client'

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
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-4">
      {/* Erste Zeile: Kategorie, Status, Sortierung */}
      <div className="flex flex-wrap gap-3">
        {/* Kategorie Filter */}
        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Alle Kategorien</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sortierung */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Preis Filter */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => onPriceChange(e.target.value, maxPrice)}
            placeholder="Min €"
            className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => onPriceChange(minPrice, e.target.value)}
            placeholder="Max €"
            className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Aktive Filter Tags */}
      <ActiveFilterTags
        selectedCategory={selectedCategory}
        categories={categories}
        selectedStatus={selectedStatus}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onClearCategory={() => onCategoryChange('')}
        onClearStatus={() => onStatusChange('')}
        onClearPrice={() => onPriceChange('', '')}
      />
    </div>
  )
}

function ActiveFilterTags({
  selectedCategory,
  categories,
  selectedStatus,
  minPrice,
  maxPrice,
  onClearCategory,
  onClearStatus,
  onClearPrice,
}: {
  selectedCategory: string
  categories: { id: string; name: string; icon: string | null }[]
  selectedStatus: string
  minPrice: string
  maxPrice: string
  onClearCategory: () => void
  onClearStatus: () => void
  onClearPrice: () => void
}) {
  const hasFilters = selectedCategory || selectedStatus || minPrice || maxPrice
  
  if (!hasFilters) return null

  const category = categories.find(c => c.id === selectedCategory)
  const status = STATUS_OPTIONS.find(s => s.value === selectedStatus)

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-slate-500">Aktive Filter:</span>
      
      {category && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
          {category.icon} {category.name}
          <button onClick={onClearCategory} className="hover:text-blue-900">✕</button>
        </span>
      )}
      
      {status && selectedStatus && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
          {status.label}
          <button onClick={onClearStatus} className="hover:text-green-900">✕</button>
        </span>
      )}
      
      {(minPrice || maxPrice) && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
          {minPrice || '0'}€ – {maxPrice || '∞'}€
          <button onClick={onClearPrice} className="hover:text-purple-900">✕</button>
        </span>
      )}
    </div>
  )
}
