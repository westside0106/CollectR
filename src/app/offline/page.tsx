export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
      <div className="text-center">
        <span className="text-8xl">📴</span>
        <h1 className="text-3xl font-bold mt-6 text-slate-900">Du bist offline</h1>
        <p className="text-slate-500 mt-2 max-w-md">
          Keine Internetverbindung. Sobald du wieder online bist, 
          kannst du CollectR wie gewohnt nutzen.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
