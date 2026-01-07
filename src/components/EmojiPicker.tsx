'use client'

import { useState, useRef, useEffect } from 'react'

// Kategorisierte Emoji-Auswahl für Sammlungen
const EMOJI_CATEGORIES = [
  {
    name: 'Sammlungen',
    emojis: ['📦', '📁', '🗂️', '💼', '🎁', '🏆', '⭐', '💎', '👑', '🎯']
  },
  {
    name: 'Fahrzeuge',
    emojis: ['🚗', '🚕', '🚙', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🏍️', '🚲', '✈️', '🚀', '🚁', '⛵', '🚂']
  },
  {
    name: 'Musik & Medien',
    emojis: ['💿', '📀', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '📻', '📺', '🎬', '🎮', '🕹️']
  },
  {
    name: 'Bücher & Schreiben',
    emojis: ['📚', '📖', '📕', '📗', '📘', '📙', '📓', '📔', '📒', '✏️', '🖊️', '📝', '📰']
  },
  {
    name: 'Kunst & Antiquitäten',
    emojis: ['🎨', '🖼️', '🏺', '🗿', '🏛️', '⚱️', '🪔', '🕯️', '🔮', '💍', '📿', '👒']
  },
  {
    name: 'Spielzeug & Spiele',
    emojis: ['🧸', '🎲', '♟️', '🧩', '🪀', '🪁', '🎯', '🎳', '🧱', '🪆', '🤖', '👾']
  },
  {
    name: 'Natur & Tiere',
    emojis: ['🌸', '🌺', '🌻', '🌹', '🦋', '🐚', '🪨', '💎', '🌿', '🍀', '🦎', '🐢']
  },
  {
    name: 'Essen & Trinken',
    emojis: ['🍷', '🍺', '☕', '🍵', '🥃', '🍶', '🧋', '🍾', '🍪', '🍫', '🍬', '🎂']
  },
  {
    name: 'Sport',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '⛳', '🎿', '🛹']
  },
  {
    name: 'Technik',
    emojis: ['📱', '💻', '🖥️', '⌚', '📷', '📹', '🔭', '🔬', '💡', '🔋', '📡', '🛰️']
  },
  {
    name: 'Geld & Wert',
    emojis: ['💰', '💵', '💴', '💶', '💷', '🪙', '💳', '📈', '💹', '🏦']
  },
  {
    name: 'Post & Kommunikation',
    emojis: ['📮', '📫', '📬', '📭', '📪', '✉️', '📧', '📨', '📩', '💌']
  }
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  className?: string
}

export default function EmojiPicker({ value, onChange, className = '' }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 text-3xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl border-2 border-slate-200 dark:border-slate-600 transition-all flex items-center justify-center"
      >
        {value || '📦'}
      </button>

      {/* Picker Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Category Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 p-1 gap-1 scrollbar-hide">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(idx)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  activeCategory === idx
                    ? 'bg-accent-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat.emojis[0]} {cat.name}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="p-3 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange(emoji)
                    setIsOpen(false)
                  }}
                  className={`w-8 h-8 text-xl rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center ${
                    value === emoji ? 'bg-accent-100 dark:bg-accent-900/30 ring-2 ring-accent-500' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
