'use client'

import { useState, useRef, useEffect } from 'react'

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  parent_id: string | null
  sort_order: number
}

interface CategorySelectProps {
  categories: Category[]
  value: string
  onChange: (categoryId: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

/**
 * Hierarchische Kategorie-Auswahl Komponente
 *
 * Desktop: Native <select> mit eingerückten Unterkategorien
 * Mobile: Custom Dropdown mit Touch-optimiertem Design
 */
export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = '-- Keine --',
  className = '',
  required = false
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Mobile Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isMobile) return

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, isMobile])

  // Organize categories into parent-child structure
  const parentCategories = categories.filter(cat => !cat.parent_id)
  const childrenMap = categories.reduce((acc, cat) => {
    if (cat.parent_id) {
      if (!acc[cat.parent_id]) acc[cat.parent_id] = []
      acc[cat.parent_id].push(cat)
    }
    return acc
  }, {} as Record<string, Category[]>)

  // Find selected category
  const selectedCategory = categories.find(cat => cat.id === value)

  // Handle selection
  function handleSelect(categoryId: string) {
    onChange(categoryId)
    setIsOpen(false)
  }

  // Desktop: Native Select with optgroups
  if (!isMobile) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={className}
      >
        <option value="">{placeholder}</option>
        {parentCategories.map(parent => {
          const children = childrenMap[parent.id] || []

          if (children.length === 0) {
            // Parent ohne Children
            return (
              <option key={parent.id} value={parent.id}>
                {parent.icon} {parent.name}
              </option>
            )
          }

          // Parent mit Children als optgroup
          return (
            <optgroup key={parent.id} label={`${parent.icon || ''} ${parent.name}`.trim()}>
              <option value={parent.id}>
                {parent.icon} {parent.name}
              </option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  └─ {child.icon} {child.name}
                </option>
              ))}
            </optgroup>
          )
        })}
      </select>
    )
  }

  // Mobile: Custom Dropdown with Touch-optimized UI
  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} flex items-center justify-between`}
      >
        <span className="truncate">
          {selectedCategory ? (
            <>
              {selectedCategory.icon} {selectedCategory.name}
              {selectedCategory.parent_id && (
                <span className="text-slate-400 ml-1 text-xs">
                  (Unterkategorie)
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {/* "Keine" Option */}
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors ${
              !value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            {placeholder}
          </button>

          {/* Parent Categories with Children */}
          {parentCategories.map(parent => {
            const children = childrenMap[parent.id] || []
            const isParentSelected = value === parent.id
            const hasSelectedChild = children.some(child => child.id === value)

            return (
              <div key={parent.id} className="border-t border-slate-200 dark:border-slate-600">
                {/* Parent */}
                <button
                  type="button"
                  onClick={() => handleSelect(parent.id)}
                  className={`w-full text-left px-4 py-3 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 ${
                    isParentSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                  }`}
                  style={parent.color ? { borderLeftColor: parent.color, borderLeftWidth: '4px' } : undefined}
                >
                  {parent.color && (
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: parent.color }}
                    />
                  )}
                  <span className="text-xl">{parent.icon}</span>
                  <span className="flex-1">{parent.name}</span>
                  {children.length > 0 && (
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Children */}
                {children.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800">
                    {children.map(child => {
                      const isSelected = value === child.id
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleSelect(child.id)}
                          className={`w-full text-left px-4 py-3 pl-8 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                          }`}
                          style={child.color ? { borderLeftColor: child.color, borderLeftWidth: '3px' } : undefined}
                        >
                          <span className="text-slate-400 text-xs">└─</span>
                          {child.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: child.color }}
                            />
                          )}
                          <span className="text-lg">{child.icon}</span>
                          <span className="flex-1">{child.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
