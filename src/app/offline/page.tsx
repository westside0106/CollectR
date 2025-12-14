'use client'

import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">📴</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Du bist offline</h1>
        <p className="text-gray-600 mb-6">
          Diese Seite ist nicht im Cache verfügbar. Bitte stelle eine Internetverbindung her.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          🔄 Erneut versuchen
        </button>
      </div>
    </div>
  )
}
