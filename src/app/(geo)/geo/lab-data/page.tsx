'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

interface LabReport {
  id: string
  specimenName: string
  reportType: string
  labName: string
  date: string
  results: Record<string, string>
  certified: boolean
  pdfUrl?: string
}

export default function GeoLabDataPage() {
  const { showToast } = useToast()
  const [reports, setReports] = useState<LabReport[]>([
    {
      id: '1',
      specimenName: 'Meteorit Fragment #42',
      reportType: 'chemical',
      labName: 'Max-Planck-Institut für Chemie',
      date: '2024-01-10',
      certified: true,
      results: {
        'Nickel-Gehalt': '8.2%',
        'Eisen-Gehalt': '89.1%',
        'Kobalt': '0.6%',
        'Phosphor': '0.15%',
        'Klassifikation': 'Oktaedrit (IIIA)',
        'Widmanstätten-Muster': 'Vorhanden'
      }
    },
    {
      id: '2',
      specimenName: 'Smaragd Kristall',
      reportType: 'gemological',
      labName: 'Deutsche Gemmologische Gesellschaft',
      date: '2024-01-05',
      certified: true,
      results: {
        'Mineral': 'Beryll (Smaragd)',
        'Farbe': 'Tiefgrün',
        'Reinheit': 'VS (Very Slightly Included)',
        'Karat': '3.24 ct',
        'Herkunft': 'Kolumbien',
        'Behandlung': 'Keine festgestellt',
        'Wert-Schätzung': '4.500-5.200 EUR'
      }
    },
    {
      id: '3',
      specimenName: 'Trilobit Fossil',
      reportType: 'paleontological',
      labName: 'Senckenberg Naturmuseum',
      date: '2023-12-15',
      certified: false,
      results: {
        'Art': 'Calymene blumenbachii',
        'Zeitalter': 'Silur (443-419 Mio Jahre)',
        'Fundort': 'Hunsrück-Schiefer',
        'Erhaltung': 'Exzellent (95%)',
        'Authentizität': 'Bestätigt - Kein Replikat'
      }
    }
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [newReport, setNewReport] = useState({
    specimenName: '',
    reportType: 'chemical',
    labName: '',
    results: ''
  })

  const reportTypes: Record<string, { name: string; icon: string; color: string }> = {
    chemical: { name: 'Chemische Analyse', icon: '🧪', color: 'blue' },
    gemological: { name: 'Gemmologisch', icon: '💎', color: 'purple' },
    paleontological: { name: 'Paläontologisch', icon: '🦴', color: 'amber' },
    mineralogical: { name: 'Mineralogisch', icon: '⚗️', color: 'emerald' },
    radiometric: { name: 'Radiometrische Datierung', icon: '☢️', color: 'red' },
    xray: { name: 'Röntgenanalyse', icon: '📡', color: 'cyan' }
  }

  const handleAddReport = () => {
    if (!newReport.specimenName || !newReport.labName) {
      showToast('Bitte fülle alle Pflichtfelder aus', 'error')
      return
    }

    const resultsObj: Record<string, string> = {}
    newReport.results.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim())
      if (key && value) resultsObj[key] = value
    })

    const report: LabReport = {
      id: Date.now().toString(),
      specimenName: newReport.specimenName,
      reportType: newReport.reportType,
      labName: newReport.labName,
      date: new Date().toISOString().split('T')[0],
      certified: false,
      results: resultsObj
    }

    setReports([report, ...reports])
    showToast('Labor-Bericht hinzugefügt!', 'success')
    setShowAddModal(false)
    setNewReport({ specimenName: '', reportType: 'chemical', labName: '', results: '' })
  }

  const deleteReport = (id: string) => {
    const report = reports.find(r => r.id === id)
    if (confirm(`Bericht für "${report?.specimenName}" wirklich löschen?`)) {
      setReports(reports.filter(r => r.id !== id))
      showToast('Bericht gelöscht', 'success')
    }
  }

  const downloadPDF = (reportId: string) => {
    showToast('PDF wird generiert...', 'info')
    setTimeout(() => {
      showToast('PDF-Download gestartet', 'success')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto container-responsive py-6 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:inline-flex sm:flex-row items-center gap-2 sm:gap-3 mb-4">
            <span className="text-4xl sm:text-6xl">🔬</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Labor-Daten & Zertifikate
              </span>
            </h1>
          </div>
          <p className="text-base sm:text-xl text-slate-300 px-4">
            Wissenschaftliche Analysen & Echtheits-Zertifikate deiner Specimens
          </p>
          <Link
            href="/geo"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Geo Übersicht
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700 text-center">
            <div className="text-3xl font-bold text-emerald-400">{reports.length}</div>
            <div className="text-sm text-slate-400">Berichte</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {reports.filter(r => r.certified).length}
            </div>
            <div className="text-sm text-slate-400">Zertifiziert</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700 text-center">
            <div className="text-3xl font-bold text-purple-400">
              {new Set(reports.map(r => r.reportType)).size}
            </div>
            <div className="text-sm text-slate-400">Analysearten</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700 text-center">
            <div className="text-3xl font-bold text-amber-400">
              {new Set(reports.map(r => r.labName)).size}
            </div>
            <div className="text-sm text-slate-400">Labore</div>
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>➕</span> Neuer Labor-Bericht
          </button>
        </div>

        {/* Reports List */}
        <div className="space-y-6">
          {reports.map((report) => {
            const type = reportTypes[report.reportType]
            return (
              <div
                key={report.id}
                className="bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className={`text-5xl flex-shrink-0`}>{type.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{report.specimenName}</h3>
                        <div className="text-sm text-slate-400">
                          {type.name} • {report.labName}
                        </div>
                      </div>
                      {report.certified && (
                        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg px-3 py-1 flex items-center gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span className="text-xs font-semibold text-emerald-300">Zertifiziert</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mb-4">
                      {new Date(report.date).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-white mb-3 text-sm">Analyseergebnisse:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(report.results).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4 py-2 border-b border-slate-700 last:border-0">
                        <span className="text-sm text-slate-400">{key}:</span>
                        <span className="text-sm text-white font-medium text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => downloadPDF(report.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    <span>📄</span> PDF Download
                  </button>
                  <button
                    onClick={() => alert('Specimen Details öffnen')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    📦 Zum Specimen
                  </button>
                  <button
                    onClick={() => alert('Bericht bearbeiten')}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    ✏️ Bearbeiten
                  </button>
                  <button
                    onClick={() => deleteReport(report.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    🗑️ Löschen
                  </button>
                </div>
              </div>
            )
          })}

          {reports.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔬</div>
              <p className="text-slate-400">Noch keine Labor-Berichte erfasst</p>
              <p className="text-sm text-slate-500 mt-2">
                Füge deinen ersten Bericht hinzu
              </p>
            </div>
          )}
        </div>

        {/* Add Report Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl modal-responsive card-padding max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Neuer Labor-Bericht</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Specimen Name *
                  </label>
                  <input
                    type="text"
                    value={newReport.specimenName}
                    onChange={(e) => setNewReport({ ...newReport, specimenName: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="z.B. Meteorit Fragment #42"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Analyse-Art *
                  </label>
                  <select
                    value={newReport.reportType}
                    onChange={(e) => setNewReport({ ...newReport, reportType: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.entries(reportTypes).map(([key, type]) => (
                      <option key={key} value={key}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Labor / Institut *
                  </label>
                  <input
                    type="text"
                    value={newReport.labName}
                    onChange={(e) => setNewReport({ ...newReport, labName: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="z.B. Max-Planck-Institut für Chemie"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Ergebnisse (ein Wert pro Zeile: "Schlüssel: Wert")
                  </label>
                  <textarea
                    value={newReport.results}
                    onChange={(e) => setNewReport({ ...newReport, results: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                    rows={8}
                    placeholder={`Nickel-Gehalt: 8.2%
Eisen-Gehalt: 89.1%
Klassifikation: Oktaedrit
Authentizität: Bestätigt`}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddReport}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Bericht Hinzufügen
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewReport({ specimenName: '', reportType: 'chemical', labName: '', results: '' })
                  }}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Types Info */}
        <div className="mt-8 bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Verfügbare Analysearten</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(reportTypes).map(([key, type]) => (
              <div key={key} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg">
                <span className="text-3xl">{type.icon}</span>
                <span className="text-sm text-slate-300">{type.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 card-padding rounded-xl bg-blue-500/10 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>💡</span> Labor-Daten Tipps
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Bewahre Original-Zertifikate sicher auf (physisch & digital)</li>
            <li>• Notiere Labor-Referenznummern für Rückfragen</li>
            <li>• Lasse wertvolle Stücke von anerkannten Instituten prüfen</li>
            <li>• Chemische Analysen können Authentizität beweisen</li>
            <li>• Gemmologische Zertifikate erhöhen den Verkaufswert</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
