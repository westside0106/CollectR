'use client'

import { AIAnalysisResult } from './AIAnalyzeButton'

interface AIResultModalProps {
  result: AIAnalysisResult
  onApply: (fields: Partial<AIAnalysisResult>) => void
  onClose: () => void
}

export function AIResultModal({ result, onApply, onClose }: AIResultModalProps) {
  const confidencePercent = Math.round((result.confidence || 0) * 100)

  function handleApplyAll() {
    onApply(result)
    onClose()
  }

  function handleApplyField(field: keyof AIAnalysisResult) {
    onApply({ [field]: result[field] })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="text-lg font-bold dark:text-white">KI-Analyse Ergebnis</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full ${
              confidencePercent >= 80
                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                : confidencePercent >= 50
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
            }`}>
              {confidencePercent}% sicher
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Name */}
          {result.name && (
            <ResultField
              label="Name"
              value={result.name}
              onApply={() => handleApplyField('name')}
            />
          )}

          {/* Description */}
          {result.description && (
            <ResultField
              label="Beschreibung"
              value={result.description}
              onApply={() => handleApplyField('description')}
            />
          )}

          {/* Category */}
          {result.category && (
            <ResultField
              label="Kategorie"
              value={result.category}
              onApply={() => handleApplyField('category')}
            />
          )}

          {/* Estimated Value */}
          {result.estimatedValue && (
            <ResultField
              label="Geschätzter Wert"
              value={`${result.estimatedValue.min} - ${result.estimatedValue.max} ${result.estimatedValue.currency}`}
              onApply={() => handleApplyField('estimatedValue')}
            />
          )}

          {/* Attributes */}
          {result.attributes && Object.keys(result.attributes).length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Attribute</span>
                <button
                  onClick={() => handleApplyField('attributes')}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Alle übernehmen
                </button>
              </div>
              <div className="space-y-2">
                {Object.entries(result.attributes).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Abbrechen
          </button>
          <button
            onClick={handleApplyAll}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition font-medium"
          >
            Alles übernehmen
          </button>
        </div>
      </div>
    </div>
  )
}

function ResultField({
  label,
  value,
  onApply
}: {
  label: string
  value: string
  onApply: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{label}</span>
        <span className="text-sm text-slate-900 dark:text-white font-medium break-words">{value}</span>
      </div>
      <button
        onClick={onApply}
        className="shrink-0 text-xs px-2 py-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition"
      >
        Übernehmen
      </button>
    </div>
  )
}
