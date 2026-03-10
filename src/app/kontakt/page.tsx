import Link from 'next/link'

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-[#d4a038] hover:text-[#e8b84a] text-sm transition-colors mb-8 inline-block">
          ← Zurück zur Startseite
        </Link>
        <h1 className="text-3xl font-bold mb-6">Kontakt</h1>
        <div className="text-white/60 leading-relaxed space-y-4">
          <p>Du hast Fragen oder Feedback zu Collectorssphere?</p>
          <p>
            Schreib uns gerne an:{' '}
            <a
              href="mailto:hallo@collectorssphere.com"
              className="text-[#d4a038] hover:text-[#e8b84a] transition-colors"
            >
              hallo@collectorssphere.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
