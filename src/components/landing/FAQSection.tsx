'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    q: 'Ist Collectorssphere wirklich kostenlos?',
    a: 'Ja — der Starter-Plan ist für immer kostenlos, ohne versteckte Kosten oder Kreditkarte. Du kannst bis zu 3 Sammlungen mit unbegrenzt vielen Items anlegen.',
  },
  {
    q: 'Welche Sammelgebiete werden unterstützt?',
    a: 'Aktuell über 50 Kategorien: Hot Wheels, Diecast, Trading Cards (MTG, Pokémon, Yu-Gi-Oh), Vinyl, Briefmarken, LEGO, Kameras, Münzen, Sneakers, Gaming, Bücher, Uhren und viele mehr. Eigene Kategorien kannst du jederzeit selbst erstellen.',
  },
  {
    q: 'Wie funktioniert die KI-Erkennung?',
    a: 'Foto von deinem Item machen — unsere KI analysiert es und füllt automatisch Name, Kategorie, Zustand und weitere Attribute aus. Im Starter-Plan stehen dir 10 Erkennungen pro Monat zur Verfügung, im Pro-Plan unbegrenzt.',
  },
  {
    q: 'Funktioniert die App auf iOS und Android?',
    a: 'Ja. Collectorssphere ist eine Progressive Web App (PWA) und kann direkt vom Browser auf dem Homescreen installiert werden — ohne App Store. Sie funktioniert auch offline dank Service Worker.',
  },
  {
    q: 'Kann ich meine Sammlung mit anderen teilen?',
    a: 'Im Free-Plan kannst du Sammlungen als öffentlichen Link teilen (Nur-Lesen). Mit dem Pro-Plan vergibst du Viewer- oder Editor-Rollen pro Sammlung und kollaborierst mit anderen Sammlern.',
  },
  {
    q: 'Wie sicher sind meine Daten?',
    a: 'Deine Daten werden verschlüsselt in der EU gespeichert (Supabase / PostgreSQL). Wir verkaufen keine Nutzerdaten. Du kannst deine Daten jederzeit exportieren oder dein Konto löschen.',
  },
]

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
        open ? 'border-[#d4a038]/30 bg-[#d4a038]/5' : 'border-white/[0.08] bg-white/[0.03]'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm sm:text-base font-medium text-white/85">{q}</span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-6 h-6 rounded-full border border-white/15 flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16M4 12h16" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 text-sm text-white/55 leading-relaxed border-t border-white/[0.06] pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[#d4a038] mb-4 block">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Häufige Fragen
          </h2>
        </motion.div>

        {/* FAQ list */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
