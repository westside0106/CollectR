// Type for exportable item data
type ExportableItem = Record<string, unknown>

// CSV Export Helper
export function exportToCSV(items: ExportableItem[], filename: string) {
  if (items.length === 0) return

  // Spalten definieren
  const columns = [
    'name',
    'description',
    'status',
    'purchase_price',
    'purchase_currency',
    'purchase_date',
    'purchase_location',
    'barcode',
    'notes',
    'created_at',
  ]

  // Header
  const header = columns.join(';')

  // Rows
  const rows = items.map(item => {
    return columns.map(col => {
      let value = item[col]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(';')
  })

  const csv = [header, ...rows].join('\n')
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

// JSON Export Helper
export function exportToJSON(items: ExportableItem[], filename: string) {
  const data = items.map(item => ({
    name: item.name,
    description: item.description,
    status: item.status,
    purchase_price: item.purchase_price,
    purchase_currency: item.purchase_currency,
    purchase_date: item.purchase_date,
    purchase_location: item.purchase_location,
    barcode: item.barcode,
    notes: item.notes,
    attributes: item.attributes,
    created_at: item.created_at,
  }))

  const json = JSON.stringify(data, null, 2)
  downloadFile(json, `${filename}.json`, 'application/json')
}

// Download Helper
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// CSV Parser
export function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ''
    })
    rows.push(row)
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  // Detect delimiter
  const delimiter = line.includes(';') ? ';' : ','

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result
}

// JSON Parser
export function parseJSON(content: string): ExportableItem[] {
  try {
    const data = JSON.parse(content) as unknown
    return Array.isArray(data) ? (data as ExportableItem[]) : ([data] as ExportableItem[])
  } catch {
    return []
  }
}
