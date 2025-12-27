'use client'

import { useState } from 'react'

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

interface CollectionFinancials {
  name: string
  spent: number      // Ausgaben (Kaufpreis)
  value: number      // Geschätzter Wert
  profit: number     // Gewinn/Verlust
  itemCount: number
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
  collectionFinancials?: CollectionFinancials[]
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
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
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
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-16 truncate" title={bar.label}>
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
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {item.label} ({item.value})
          </span>
        </div>
      ))}
    </div>
  )
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

// Financial Summary Bar Chart
function FinancialBarChart({ data, type }: { data: CollectionFinancials[], type: 'spent' | 'value' | 'profit' }) {
  const maxValue = Math.max(...data.map(d => Math.abs(d[type])), 1)
  const maxHeight = 120

  const getColor = (value: number) => {
    if (type === 'profit') {
      return value >= 0 ? '#10B981' : '#EF4444'
    }
    if (type === 'spent') return '#3B82F6'
    return '#8B5CF6'
  }

  const formatValue = (value: number) => {
    return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  }

  return (
    <div className="flex items-end justify-center gap-2 h-44 pt-6">
      {data.slice(0, 6).map((item, index) => {
        const value = item[type]
        const height = (Math.abs(value) / maxValue) * maxHeight
        const isNegative = value < 0

        return (
          <div key={index} className="flex flex-col items-center gap-1 min-w-0 flex-1 max-w-20">
            <div className={`text-xs font-medium text-center ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {formatValue(value)}
            </div>
            <div
              className="w-full max-w-12 rounded-t-lg transition-all hover:opacity-80"
              style={{
                height: `${Math.max(height, 4)}px`,
                backgroundColor: getColor(value),
              }}
              title={`${item.name}: ${formatValue(value)}`}
            />
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full" title={item.name}>
              {item.name.length > 8 ? item.name.slice(0, 8) + '...' : item.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Financial Summary Stats
function FinancialSummary({ data }: { data: CollectionFinancials[] }) {
  const totals = data.reduce(
    (acc, item) => ({
      spent: acc.spent + item.spent,
      value: acc.value + item.value,
      profit: acc.profit + item.profit,
    }),
    { spent: 0, value: 0, profit: 0 }
  )

  const formatCurrency = (value: number) => {
    return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
  }

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {formatCurrency(totals.spent)}
        </div>
        <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Ausgaben</div>
      </div>
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
          {formatCurrency(totals.value)}
        </div>
        <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Wert</div>
      </div>
      <div className={`rounded-lg p-3 text-center ${
        totals.profit >= 0
          ? 'bg-green-50 dark:bg-green-900/20'
          : 'bg-red-50 dark:bg-red-900/20'
      }`}>
        <div className={`text-lg font-bold ${
          totals.profit >= 0
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {totals.profit >= 0 ? '+' : ''}{formatCurrency(totals.profit)}
        </div>
        <div className={`text-xs ${
          totals.profit >= 0
            ? 'text-green-600/70 dark:text-green-400/70'
            : 'text-red-600/70 dark:text-red-400/70'
        }`}>
          {totals.profit >= 0 ? 'Gewinn' : 'Verlust'}
        </div>
      </div>
    </div>
  )
}

export default function DashboardCharts({
  categoryDistribution,
  collectionValues,
  topItems,
  statusDistribution,
  collectionFinancials = [],
}: DashboardChartsProps) {
  const [distributionTab, setDistributionTab] = useState<'category' | 'status'>('category')
  const [financialTab, setFinancialTab] = useState<'spent' | 'value' | 'profit'>('spent')

  const hasCategories = categoryDistribution.length > 0
  const hasCollectionValues = collectionValues.length > 0 && collectionValues.some(c => c.value > 0)
  const hasTopItems = topItems.length > 0
  const hasStatus = statusDistribution.length > 0
  const hasFinancials = collectionFinancials.length > 0

  if (!hasCategories && !hasCollectionValues && !hasTopItems && !hasStatus && !hasFinancials) {
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Distribution Chart with Tabs (Category / Status) */}
      {(hasCategories || hasStatus) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verteilung</h3>
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              <TabButton
                active={distributionTab === 'category'}
                onClick={() => setDistributionTab('category')}
              >
                Kategorie
              </TabButton>
              <TabButton
                active={distributionTab === 'status'}
                onClick={() => setDistributionTab('status')}
              >
                Status
              </TabButton>
            </div>
          </div>

          {distributionTab === 'category' && hasCategories && (
            <>
              <PieChart data={categoryDistribution} />
              <ChartLegend data={categoryDistribution} />
            </>
          )}

          {distributionTab === 'status' && hasStatus && (
            <>
              <PieChart data={statusDistribution} size={180} />
              <ChartLegend data={statusDistribution} />
            </>
          )}

          {distributionTab === 'category' && !hasCategories && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Keine Kategorien vorhanden</p>
          )}

          {distributionTab === 'status' && !hasStatus && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Keine Status-Daten vorhanden</p>
          )}
        </div>
      )}

      {/* Financial Overview with Tabs (Ausgaben / Wert / Gewinn) */}
      {hasFinancials && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Finanzen</h3>
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              <TabButton
                active={financialTab === 'spent'}
                onClick={() => setFinancialTab('spent')}
              >
                Ausgaben
              </TabButton>
              <TabButton
                active={financialTab === 'value'}
                onClick={() => setFinancialTab('value')}
              >
                Wert
              </TabButton>
              <TabButton
                active={financialTab === 'profit'}
                onClick={() => setFinancialTab('profit')}
              >
                Gewinn
              </TabButton>
            </div>
          </div>

          <FinancialSummary data={collectionFinancials} />
          <FinancialBarChart data={collectionFinancials} type={financialTab} />
        </div>
      )}

      {/* Value by Collection Bar Chart (fallback if no financials) */}
      {hasCollectionValues && !hasFinancials && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Wert nach Sammlung</h3>
          <BarChart data={collectionValues} />
        </div>
      )}

      {/* Top 5 Valuable Items */}
      {hasTopItems && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top 5 wertvollste Artikel</h3>
          <div className="space-y-3">
            {topItems.map((item, index) => (
              <a
                key={item.id}
                href={`/collections/${item.collection_id}/items/${item.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
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
                  <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center text-gray-400">
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.collection_name}</div>
                </div>
                <div className="text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
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
