'use client'

import { useState } from 'react'
import GradingInput, { type GradingValue } from '@/components/GradingInput'

/**
 * DEMO PAGE für GradingInput Komponente
 *
 * URL: http://localhost:3000/demo/grading
 *
 * Zeigt alle Features der GradingInput Komponente:
 * - Alle Grading Companies (PSA, BGS, CGC, SGC)
 * - Grade-Auswahl
 * - Zertifikatsnummer
 * - Live Preview
 * - Dark Mode Support
 */
export default function GradingDemoPage() {
  const [value1, setValue1] = useState<GradingValue>({ company: '', grade: '', certNumber: '' })
  const [value2, setValue2] = useState<GradingValue>({ company: 'PSA', grade: '10', certNumber: '82364721' })
  const [value3, setValue3] = useState<GradingValue>({ company: 'BGS', grade: '9.5', certNumber: '0012345678' })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            GradingInput Komponente Demo
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Interaktive Demonstration der TCG Grading-Komponente für PSA, BGS, CGC und SGC
          </p>
        </div>

        {/* Example 1: Empty State */}
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            1. Leere Grading-Eingabe
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Standard-Zustand beim Erstellen eines neuen Items ohne Grading.
          </p>
          <GradingInput
            value={value1}
            onChange={setValue1}
          />
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
              Value: {JSON.stringify(value1, null, 2)}
            </p>
          </div>
        </section>

        {/* Example 2: PSA 10 */}
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            2. PSA 10 Gem Mint (Beispiel: Glurak 1st Edition)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Höchstes PSA Grading - perfekte Karte im Gem Mint Zustand.
          </p>
          <GradingInput
            value={value2}
            onChange={setValue2}
            required
          />
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
              Value: {JSON.stringify(value2, null, 2)}
            </p>
          </div>
        </section>

        {/* Example 3: BGS 9.5 */}
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            3. BGS 9.5 Gem Mint (Beispiel: Dark Magician LOB-005)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Beckett Grading mit .5 Schritten - sehr nah an BGS 10 Pristine.
          </p>
          <GradingInput
            value={value3}
            onChange={setValue3}
          />
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
              Value: {JSON.stringify(value3, null, 2)}
            </p>
          </div>
        </section>

        {/* All Companies Overview */}
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            4. Alle Grading-Anbieter
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PSA */}
            <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full bg-red-500"></span>
                <h3 className="font-semibold dark:text-white">PSA</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Professional Sports Authenticator
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Grades: 1-10 (Ganzzahlen)
              </p>
            </div>

            {/* BGS */}
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full bg-blue-500"></span>
                <h3 className="font-semibold dark:text-white">BGS (Beckett)</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Beckett Grading Services
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Grades: 1-10 (.5 Schritte)
              </p>
            </div>

            {/* CGC */}
            <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full bg-orange-500"></span>
                <h3 className="font-semibold dark:text-white">CGC</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Certified Guaranty Company
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Grades: 1-10 (.5 Schritte)
              </p>
            </div>

            {/* SGC */}
            <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full bg-green-500"></span>
                <h3 className="font-semibold dark:text-white">SGC</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sportscard Guaranty
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Grades: 1-10 (.5 Schritte)
              </p>
            </div>
          </div>
        </section>

        {/* Features List */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            ✨ Features
          </h2>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>4 Grading Companies:</strong> PSA, BGS, CGC, SGC</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Company-spezifische Grade-Skalen:</strong> PSA (1-10), BGS/CGC/SGC (1-10 mit .5)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Zertifikatsnummer-Tracking:</strong> Für PSA/BGS Registry</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Live Preview:</strong> Zeigt ausgewähltes Grading mit Farbkodierung</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Dark Mode Support:</strong> Perfekt lesbar in Light & Dark Mode</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Abwärtskompatibilität:</strong> Parse alter "PSA 10" String-Werte</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Auto-Integration:</strong> Erkennt "grading" Attribute automatisch</span>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            CollectR - Phase 5 TCG Vertical | GradingInput v1.0
          </p>
          <p className="mt-1">
            <a href="/collections" className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Zurück zu Sammlungen
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
