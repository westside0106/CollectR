import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteItemButton } from './DeleteItemButton'
import { ShareItemButton } from './ShareItemButton'
import { ImageGallery } from '@/components/ImageGallery'

interface PageProps {
  params: Promise<{ id: string; itemId: string }>
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id: collectionId, itemId } = await params
  const supabase = await createClient()

  // Load item with collection name for breadcrumb
  const { data: item, error } = await supabase
    .from('items')
    .select(`
      *,
      category:categories(*),
      item_images(*),
      collection:collections(name)
    `)
    .eq('id', itemId)
    .single()

  if (error || !item) {
    notFound()
  }

  const images = (item.item_images ?? []).map((img: any) => ({
    id: img.id,
    original_url: img.original_url,
    thumbnail_url: img.thumbnail_url,
    is_primary: img.is_primary,
  }))

  // Sort images so primary is first
  images.sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

  const STATUS_CONFIG: Record<string, { label: string; icon: string; className: string }> = {
    'in_collection': { label: 'In Sammlung', icon: '📦', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    'sold': { label: 'Verkauft', icon: '💰', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    'wishlist': { label: 'Wunschliste', icon: '⭐', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    'ordered': { label: 'Bestellt', icon: '📬', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    'lent': { label: 'Verliehen', icon: '🤝', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  }

  const statusInfo = STATUS_CONFIG[item.status] || {
    label: item.status,
    icon: '📋',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-slate-500 dark:text-slate-400">
        <Link href="/collections" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Sammlungen
        </Link>
        <span>/</span>
        <Link
          href={`/collections/${collectionId}`}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {(item.collection as any)?.name || 'Sammlung'}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium truncate max-w-48">
          {item.name}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {item.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {item.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300">
                {item.category.icon} {item.category.name}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
              {statusInfo.icon} {statusInfo.label}
            </span>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <ShareItemButton itemId={itemId} itemName={item.name} collectionId={collectionId} />
          <Link
            href={`/collections/${collectionId}/items/${itemId}/edit`}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center text-slate-700 dark:text-slate-300"
          >
            Bearbeiten
          </Link>
          <DeleteItemButton itemId={itemId} collectionId={collectionId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <ImageGallery images={images} itemName={item.name} />
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Description */}
          {item.description && (
            <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Beschreibung</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
            </section>
          )}

          {/* Purchase Info & Value */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Kauf-Informationen</h2>
            <div className="grid grid-cols-2 gap-4">
              {item.purchase_price !== null && item.purchase_price !== undefined && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Kaufpreis (EK)</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {item.purchase_price.toLocaleString('de-DE', {
                      style: 'currency',
                      currency: item.purchase_currency || 'EUR'
                    })}
                  </p>
                </div>
              )}
              {item.estimated_value !== null && item.estimated_value !== undefined && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Geschätzter Wert (VK)</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {item.estimated_value.toLocaleString('de-DE', {
                      style: 'currency',
                      currency: item.purchase_currency || 'EUR'
                    })}
                  </p>
                </div>
              )}

              {/* Marge/Gewinn Anzeige */}
              {item.purchase_price !== null && item.estimated_value !== null &&
               item.purchase_price !== undefined && item.estimated_value !== undefined && (
                <div className="col-span-2 mt-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Marge / Gewinn</p>
                      {(() => {
                        const margin = item.estimated_value - item.purchase_price
                        const marginPercent = item.purchase_price > 0
                          ? ((margin / item.purchase_price) * 100).toFixed(1)
                          : 0
                        const isProfit = margin >= 0

                        return (
                          <div className="flex items-center gap-3">
                            <p className={`text-2xl font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isProfit ? '+' : ''}{margin.toLocaleString('de-DE', {
                                style: 'currency',
                                currency: item.purchase_currency || 'EUR'
                              })}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                              isProfit
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                            }`}>
                              {isProfit ? '+' : ''}{marginPercent}%
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                    <div className={`text-4xl ${
                      (item.estimated_value - item.purchase_price) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {(item.estimated_value - item.purchase_price) >= 0 ? '📈' : '📉'}
                    </div>
                  </div>
                </div>
              )}

              {item.purchase_date && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Kaufdatum</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {new Date(item.purchase_date).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {item.purchase_location && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Gekauft bei</p>
                  <p className="font-medium text-slate-900 dark:text-white">{item.purchase_location}</p>
                </div>
              )}
              {!item.purchase_price && !item.purchase_date && !item.purchase_location && !item.estimated_value && (
                <p className="col-span-2 text-slate-400 dark:text-slate-500 italic">
                  Keine Kaufinformationen hinterlegt
                </p>
              )}
            </div>
          </section>

          {/* Dynamic Attributes */}
          {item.attributes && Object.keys(item.attributes).length > 0 && (
            <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(item.attributes).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {typeof value === 'boolean'
                        ? (value ? '✓ Ja' : '✗ Nein')
                        : Array.isArray(value)
                        ? value.join(', ')
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {item.notes && (
            <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Notizen</h2>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{item.notes}</p>
            </section>
          )}

          {/* Metadata */}
          <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              {item.created_at && (
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Erstellt: </span>
                  {new Date(item.created_at).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
              {item.updated_at && item.updated_at !== item.created_at && (
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Aktualisiert: </span>
                  {new Date(item.updated_at).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
