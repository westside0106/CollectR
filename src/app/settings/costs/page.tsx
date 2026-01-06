'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface ServiceCost {
  id: string
  service_name: string
  category: 'hosting' | 'database' | 'ai' | 'api' | 'storage' | 'other'
  current_cost: number
  monthly_limit: number
  billing_cycle_start: string
  billing_cycle_end: string
  notes: string | null
  last_updated: string
}

const SERVICE_CATEGORIES = {
  hosting: { label: 'Hosting', icon: '🌐', color: 'blue' },
  database: { label: 'Datenbank', icon: '💾', color: 'green' },
  ai: { label: 'KI / AI', icon: '🤖', color: 'purple' },
  api: { label: 'APIs', icon: '🔌', color: 'orange' },
  storage: { label: 'Storage', icon: '📦', color: 'cyan' },
  other: { label: 'Andere', icon: '📊', color: 'slate' }
}

const DEFAULT_SERVICES = [
  {
    service_name: 'Vercel',
    category: 'hosting' as const,
    monthly_limit: 20,
    notes: 'Hobby Plan - $20/mo included credits'
  },
  {
    service_name: 'Supabase',
    category: 'database' as const,
    monthly_limit: 0,
    notes: 'Free Tier - 500MB Database, 1GB Storage, 2GB Bandwidth'
  },
  {
    service_name: 'Anthropic Claude API',
    category: 'ai' as const,
    monthly_limit: 50,
    notes: 'Image Analysis - ~$0.01 per Bild'
  },
  {
    service_name: 'Discogs API',
    category: 'api' as const,
    monthly_limit: 0,
    notes: 'Free Tier - 60 requests/min'
  }
]

export default function CostsPage() {
  const supabase = createClient()
  const [services, setServices] = useState<ServiceCost[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddService, setShowAddService] = useState(false)
  const [editingService, setEditingService] = useState<ServiceCost | null>(null)

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('service_costs')
      .select('*')
      .eq('user_id', user.id)
      .order('service_name')

    if (data && data.length > 0) {
      setServices(data)
    } else {
      // Initialize with default services
      await initializeDefaultServices(user.id)
    }
    setLoading(false)
  }

  async function initializeDefaultServices(userId: string) {
    const now = new Date()
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const defaultData = DEFAULT_SERVICES.map(service => ({
      user_id: userId,
      ...service,
      current_cost: 0,
      billing_cycle_start: cycleStart.toISOString(),
      billing_cycle_end: cycleEnd.toISOString(),
      last_updated: new Date().toISOString()
    }))

    const { data } = await supabase
      .from('service_costs')
      .insert(defaultData)
      .select()

    if (data) setServices(data)
  }

  async function updateServiceCost(serviceId: string, newCost: number) {
    const { error } = await supabase
      .from('service_costs')
      .update({
        current_cost: newCost,
        last_updated: new Date().toISOString()
      })
      .eq('id', serviceId)

    if (!error) {
      setServices(prev =>
        prev.map(s => s.id === serviceId ? { ...s, current_cost: newCost } : s)
      )
    }
  }

  const totalCost = services.reduce((sum, s) => sum + s.current_cost, 0)
  const totalLimit = services.reduce((sum, s) => sum + s.monthly_limit, 0)
  const utilizationPercent = totalLimit > 0 ? (totalCost / totalLimit) * 100 : 0

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            💰 Service Kosten
          </h1>
          <Link
            href="/settings"
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            ← Zurück
          </Link>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Übersicht aller externen Services und deren Kosten
        </p>
      </div>

      {/* Total Overview Card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-blue-100 text-sm mb-1">Aktueller Monat</p>
            <p className="text-4xl font-bold">${totalCost.toFixed(2)}</p>
            <p className="text-blue-100 text-xs mt-1">
              von ${totalLimit.toFixed(2)} Budget
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">Auslastung</p>
            <p className="text-4xl font-bold">{utilizationPercent.toFixed(1)}%</p>
            <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all"
                style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">Verbleibend</p>
            <p className="text-4xl font-bold">${(totalLimit - totalCost).toFixed(2)}</p>
            <p className="text-blue-100 text-xs mt-1">
              {new Date(services[0]?.billing_cycle_end || new Date()).getDate() - new Date().getDate()} Tage bis Cycle-Ende
            </p>
          </div>
        </div>
      </div>

      {/* Services by Category */}
      {Object.entries(SERVICE_CATEGORIES).map(([category, config]) => {
        const categoryServices = services.filter(s => s.category === category)
        if (categoryServices.length === 0) return null

        return (
          <div key={category} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{config.icon}</span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {config.label}
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ({categoryServices.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryServices.map(service => {
                const percent = service.monthly_limit > 0
                  ? (service.current_cost / service.monthly_limit) * 100
                  : 0
                const isWarning = percent > 80
                const isDanger = percent > 95

                return (
                  <div
                    key={service.id}
                    className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {service.service_name}
                        </h3>
                        {service.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {service.notes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingService(service)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        ✏️
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          ${service.current_cost.toFixed(2)}
                        </span>
                        {service.monthly_limit > 0 && (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            / ${service.monthly_limit.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {service.monthly_limit > 0 && (
                        <>
                          <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isDanger
                                  ? 'bg-red-500'
                                  : isWarning
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {percent.toFixed(1)}% genutzt
                          </p>
                        </>
                      )}

                      <button
                        onClick={() => {
                          const newCost = prompt(
                            `Aktueller Kostenstand für ${service.service_name} (in $):`,
                            service.current_cost.toString()
                          )
                          if (newCost !== null) {
                            const parsed = parseFloat(newCost)
                            if (!isNaN(parsed)) {
                              updateServiceCost(service.id, parsed)
                            }
                          }
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Kosten aktualisieren
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Quick Links */}
      <div className="mt-8 bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          📊 Service Dashboards
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <a
            href="https://vercel.com/dashboard/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm text-slate-700 dark:text-slate-200"
          >
            <span>🌐</span>
            <span>Vercel Usage</span>
            <span className="ml-auto text-slate-400">↗</span>
          </a>
          <a
            href="https://supabase.com/dashboard/project/_/settings/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm text-slate-700 dark:text-slate-200"
          >
            <span>💾</span>
            <span>Supabase Billing</span>
            <span className="ml-auto text-slate-400">↗</span>
          </a>
          <a
            href="https://console.anthropic.com/settings/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm text-slate-700 dark:text-slate-200"
          >
            <span>🤖</span>
            <span>Anthropic Billing</span>
            <span className="ml-auto text-slate-400">↗</span>
          </a>
          <a
            href="https://www.discogs.com/settings/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm text-slate-700 dark:text-slate-200"
          >
            <span>🔌</span>
            <span>Discogs API</span>
            <span className="ml-auto text-slate-400">↗</span>
          </a>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Tipp:</strong> Aktualisiere deine Kosten regelmäßig aus den Service-Dashboards.
          So behältst du die Kontrolle über dein Budget!
        </p>
      </div>
    </div>
  )
}
