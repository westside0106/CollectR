'use client'

interface PieChartData {
  label: string
  value: number
  color: string
}

interface BarChartData {
  label: string
  value: number
  color: string
}

interface DashboardChartsProps {
  categoryDistribution: PieChartData[]
  collectionValues: BarChartData[]
  topItems: {
    id: string
    name: string
    collection_id: string
    collection_name: string
    purchase_price: number
    image_url?: string
  }[]
  statusDistribution: PieChartData[]
}

// Color palette for charts
const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

// Simple Pie Chart using SVG
function PieChart({ data, size = 200 }: { data: PieChartData[], size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null

  let cumulativeAngle = 0
  const radius = size / 2
  const center = size / 2

  const paths = data.map((segment, index) => {
    const angle = (segment.value / total) * 360
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + angle
    cumulativeAngle = endAngle

    const startRad = (startAngle - 90) * (Math.PI / 180)
    const endRad = (endAngle - 90) * (Math.PI / 180)

    const x1 = center + radius * Math.cos(startRad)
    const y1 = center + radius * Math.sin(startRad)
    const x2 = center + radius * Math.cos(endRad)
    const y2 = center + radius * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    const pathD = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    return (
      <path
        key={index}
        d={pathD}
        fill={segment.color}
        className="transition-opacity hover:opacity-80"
      >
        <title>{segment.label}: {segment.value}</title>
      </path>
    )
  })

  return (
    <svg width={size} height={size} className="mx-auto">
      {paths}
    </svg>
  )
}

// Simple Bar Chart using CSS
function BarChart({ data, maxHeight = 150 }: { data: BarChartData[], maxHeight?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="flex items-end justify-center gap-3 h-48">
      {data.map((bar, index) => {
        const height = (bar.value / maxValue) * maxHeight
        return (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-600 font-medium">
              {bar.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </div>
            <div
              className="w-12 rounded-t-lg transition-all hover:opacity-80"
              style={{
                height: `${Math.max(height, 4)}px`,
                backgroundColor: bar.color,
              }}
              title={`${bar.label}: ${bar.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`}
            />
            <div className="text-xs text-gray-600 text-center max-w-16 truncate" title={bar.label}>
              {bar.label.length > 8 ? bar.label.slice(0, 8) + '...' : bar.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Legend component
function ChartLegend({ data }: { data: PieChartData[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-gray-600">
            {item.label} ({item.value})
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardCharts({
  categoryDistribution,
  collectionValues,
  topItems,
  statusDistribution,
}: DashboardChartsProps) {
  const hasCategories = categoryDistribution.length > 0
  const hasCollectionValues = collectionValues.length > 0 && collectionValues.some(c => c.value > 0)
  const hasTopItems = topItems.length > 0
  const hasStatus = statusDistribution.length > 0

  if (!hasCategories && !hasCollectionValues && !hasTopItems && !hasStatus) {
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Category Distribution Pie Chart */}
      {hasCategories && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Verteilung nach Kategorie</h3>
          <PieChart data={categoryDistribution} />
          <ChartLegend data={categoryDistribution} />
        </div>
      )}

      {/* Status Distribution Pie Chart */}
      {hasStatus && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Status-Verteilung</h3>
          <PieChart data={statusDistribution} size={180} />
          <ChartLegend data={statusDistribution} />
        </div>
      )}

      {/* Value by Collection Bar Chart */}
      {hasCollectionValues && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Wert nach Sammlung</h3>
          <BarChart data={collectionValues} />
        </div>
      )}

      {/* Top 5 Valuable Items */}
      {hasTopItems && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Top 5 wertvollste Artikel</h3>
          <div className="space-y-3">
            {topItems.map((item, index) => (
              <a
                key={item.id}
                href={`/collections/${item.collection_id}/items/${item.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white font-bold text-sm">
                  {index + 1}
                </div>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{item.name}</div>
                  <div className="text-xs text-gray-500 truncate">{item.collection_name}</div>
                </div>
                <div className="text-green-600 font-semibold whitespace-nowrap">
                  {item.purchase_price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { CHART_COLORS }
