'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'

interface PriceAlert {
  id: string
  item_id: string
  condition: 'above' | 'below' | 'change_percent'
  threshold_value: number
  status: 'active' | 'triggered' | 'disabled'
  triggered_at: string | null
  triggered_price: number | null
}

interface PriceAlertManagerProps {
  itemId: string
  itemName: string
  currentPrice: number | null
  currency?: string
}

export function PriceAlertManager({
  itemId,
  itemName,
  currentPrice,
  currency = 'EUR'
}: PriceAlertManagerProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    condition: 'above' as 'above' | 'below' | 'change_percent',
    threshold_value: ''
  })
  const { showToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadAlerts()
  }, [itemId])

  async function loadAlerts() {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setAlerts(data || [])
    } catch (error) {
      console.error('Failed to load alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createAlert() {
    if (!formData.threshold_value) {
      showToast('Bitte einen Schwellenwert eingeben', 'error')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          item_id: itemId,
          condition: formData.condition,
          threshold_value: parseFloat(formData.threshold_value),
          status: 'active'
        })

      if (error) throw error

      showToast('Preisalarm erstellt!', 'success')
      setShowForm(false)
      setFormData({ condition: 'above', threshold_value: '' })
      loadAlerts()

    } catch (error: any) {
      console.error('Failed to create alert:', error)
      showToast(error.message || 'Fehler beim Erstellen', 'error')
    }
  }

  async function deleteAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error

      showToast('Alarm gelöscht', 'success')
      loadAlerts()

    } catch (error: any) {
      console.error('Failed to delete alert:', error)
      showToast(error.message || 'Fehler beim Löschen', 'error')
    }
  }

  async function toggleAlert(alertId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active'

    try {
      const { error } = await supabase
        .from('price_alerts')
        .update({ status: newStatus })
        .eq('id', alertId)

      if (error) throw error

      showToast(newStatus === 'active' ? 'Alarm aktiviert' : 'Alarm deaktiviert', 'success')
      loadAlerts()

    } catch (error: any) {
      console.error('Failed to toggle alert:', error)
      showToast(error.message || 'Fehler beim Aktualisieren', 'error')
    }
  }

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'above': return 'über'
      case 'below': return 'unter'
      case 'change_percent': return 'Änderung um'
      default: return condition
    }
  }

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'above': return '📈'
      case 'below': return '📉'
      case 'change_percent': return '🔄'
      default: return '🔔'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Preisalarme
        </h3>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          {showForm ? 'Abbrechen' : '+ Alarm erstellen'}
        </button>
      </div>

      {/* Create Alert Form */}
      {showForm && (
        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Bedingung
            </label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="above">Preis steigt über...</option>
              <option value="below">Preis fällt unter...</option>
              <option value="change_percent">Preis ändert sich um... %</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {formData.condition === 'change_percent' ? 'Prozent' : `Schwellenwert (${currency})`}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.threshold_value}
              onChange={(e) => setFormData({ ...formData, threshold_value: e.target.value })}
              placeholder={formData.condition === 'change_percent' ? '10' : '50.00'}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {currentPrice && formData.threshold_value && formData.condition !== 'change_percent' && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Aktueller Preis: {currentPrice.toFixed(2)} {currency}
              {formData.condition === 'above' && parseFloat(formData.threshold_value) <= currentPrice && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">⚠️ Alarm würde sofort auslösen</span>
              )}
              {formData.condition === 'below' && parseFloat(formData.threshold_value) >= currentPrice && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">⚠️ Alarm würde sofort auslösen</span>
              )}
            </div>
          )}

          <button
            onClick={createAlert}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Alarm erstellen
          </button>
        </div>
      )}

      {/* Alert List */}
      {alerts.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          Noch keine Preisalarme. Erstelle einen, um benachrichtigt zu werden!
        </p>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border transition-all ${
                alert.status === 'triggered'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : alert.status === 'disabled'
                  ? 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600 opacity-60'
                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getConditionIcon(alert.condition)}</span>
                    <span className="font-medium text-slate-900 dark:text-white text-sm">
                      {getConditionLabel(alert.condition)} {alert.threshold_value.toFixed(2)}
                      {alert.condition === 'change_percent' ? '%' : ` ${currency}`}
                    </span>
                    {alert.status === 'triggered' && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 rounded-full">
                        Ausgelöst
                      </span>
                    )}
                    {alert.status === 'disabled' && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 rounded-full">
                        Pausiert
                      </span>
                    )}
                  </div>

                  {alert.triggered_at && alert.triggered_price && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Ausgelöst bei {alert.triggered_price.toFixed(2)} {currency} am{' '}
                      {new Date(alert.triggered_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {alert.status !== 'triggered' && (
                    <button
                      onClick={() => toggleAlert(alert.id, alert.status)}
                      className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                      title={alert.status === 'active' ? 'Pausieren' : 'Aktivieren'}
                    >
                      {alert.status === 'active' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Löschen"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
