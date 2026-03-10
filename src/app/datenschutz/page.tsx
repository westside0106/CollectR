import Link from 'next/link'

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-[#d4a038] hover:text-[#e8b84a] text-sm transition-colors mb-8 inline-block">
          ← Zurück zur Startseite
        </Link>
        <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung</h1>
        <div className="text-white/60 leading-relaxed space-y-4">
          <p>Informationen zum Umgang mit personenbezogenen Daten gemäß DSGVO.</p>
          <p className="text-white/40 italic">Die vollständige Datenschutzerklärung wird in Kürze ergänzt.</p>
        </div>
      </div>
    </div>
  )
}
