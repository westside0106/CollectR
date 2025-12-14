import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteItemButton } from './DeleteItemButton'

interface PageProps {
  params: Promise<{ id: string; itemId: string }>
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id: collectionId, itemId } = await params
  const supabase = await createClient()
  
  const { data: item, error } = await supabase
    .from('items')
    .select(`
      *,
      category:categories(*),
      item_images(*)
    `)
    .eq('id', itemId)
    .single()

  if (error || !item) {
    notFound()
  }

  const images = item.item_images ?? []
  const primaryImage = images.find((img: any) => img.is_primary) ?? images[0]

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link 
            href={`/collections/${collectionId}`}
            className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 mb-2"
          >
            ← Zurück zur Sammlung
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{item.name}</h1>
          {item.category && (
            <span className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded-full text-sm">
              {item.category.icon} {item.category.name}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href={`/collections/${collectionId}/items/${itemId}/edit`}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Bearbeiten
          </Link>
          <DeleteItemButton itemId={itemId} collectionId={collectionId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bilder */}
        <div>
          <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden mb-4">
            {primaryImage ? (
              <img 
                src={primaryImage.original_url}
                alt={item.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-slate-300">
                📷
              </div>
            )}
          </div>
          
          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img: any) => (
                <div 
                  key={img.id}
                  className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-slate-200"
                >
                  <img 
                    src={img.thumbnail_url ?? img.original_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Beschreibung */}
          {item.description && (
            <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-2">Beschreibung</h2>
              <p className="text-slate-600">{item.description}</p>
            </section>
          )}

          {/* Kauf-Info */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">Kauf-Informationen</h2>
            <div className="grid grid-cols-2 gap-4">
              {item.purchase_price && (
                <div>
                  <p className="text-slate-500 text-sm">Kaufpreis</p>
                  <p className="text-xl font-bold">{item.purchase_price.toFixed(2)} {item.purchase_currency}</p>
                </div>
              )}
              {item.purchase_date && (
                <div>
                  <p className="text-slate-500 text-sm">Kaufdatum</p>
                  <p className="font-medium">{new Date(item.purchase_date).toLocaleDateString('de-DE')}</p>
                </div>
              )}
              {item.purchase_location && (
                <div className="col-span-2">
                  <p className="text-slate-500 text-sm">Gekauft bei</p>
                  <p className="font-medium">{item.purchase_location}</p>
                </div>
              )}
            </div>
          </section>

          {/* Dynamische Attribute */}
          {item.attributes && Object.keys(item.attributes).length > 0 && (
            <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(item.attributes).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-slate-500 text-sm capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium">
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

          {/* Status */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-2">Status</h2>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              item.status === 'in_collection' ? 'bg-green-100 text-green-700' :
              item.status === 'sold' ? 'bg-blue-100 text-blue-700' :
              item.status === 'wishlist' ? 'bg-purple-100 text-purple-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {item.status === 'in_collection' ? '📦 In Sammlung' :
               item.status === 'sold' ? '💰 Verkauft' :
               item.status === 'wishlist' ? '⭐ Wunschliste' :
               item.status === 'ordered' ? '📬 Bestellt' : item.status}
            </span>
          </section>

          {/* Notizen */}
          {item.notes && (
            <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-2">Notizen</h2>
              <p className="text-slate-600 whitespace-pre-wrap">{item.notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
