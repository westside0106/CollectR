'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { ReminderModal } from '@/components/ReminderModal'
import { Reminder } from '@/types/database'
import Link from 'next/link'

type FilterType = 'all' | 'today' | 'week' | 'overdue' | 'completed'

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'Alle',
  today: 'Heute',
  week: 'Diese Woche',
  overdue: 'Überfällig',
  completed: 'Erledigt'
}

const REMINDER_TYPE_LABELS: Record<string, string> = {
  once: 'Einmalig',
  recurring_weekly: 'Wöchentlich',
  recurring_monthly: 'Monatlich',
  recurring_yearly: 'Jährlich'
}

interface ReminderWithItem extends Reminder {
  items?: {
    id: string
    name: string
    collection_id: string
  } | null
}

export default function RemindersPage() {
  const supabase = createClient()
  const { showToast } = useToast()

  const [reminders, setReminders] = useState<ReminderWithItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined)

  useEffect(() => {
    loadReminders()
  }, [])

  async function loadReminders() {
    setLoading(true)

    const { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        items (
          id,
          name,
          collection_id
        )
      `)
      .order('reminder_date', { ascending: true })

    if (error) {
      console.error('Error loading reminders:', error)
      showToast('Fehler beim Laden der Erinnerungen', 'error')
    } else {
      setReminders(data || [])
    }

    setLoading(false)
  }

  async function toggleComplete(reminder: ReminderWithItem) {
    const newCompleted = !reminder.is_completed

    const { error } = await supabase
      .from('reminders')
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      })
      .eq('id', reminder.id)

    if (error) {
      showToast('Fehler beim Aktualisieren', 'error')
    } else {
      setReminders(prev =>
        prev.map(r =>
          r.id === reminder.id
            ? { ...r, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
            : r
        )
      )
      showToast(newCompleted ? 'Als erledigt markiert' : 'Als offen markiert', 'success')
    }
  }

  async function deleteReminder(id: string) {
    if (!confirm('Erinnerung wirklich löschen?')) return

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)

    if (error) {
      showToast('Fehler beim Löschen', 'error')
    } else {
      setReminders(prev => prev.filter(r => r.id !== id))
      showToast('Erinnerung gelöscht', 'success')
    }
  }

  function handleEdit(reminder: ReminderWithItem) {
    setEditingReminder(reminder)
    setShowModal(true)
  }

  function handleModalClose() {
    setShowModal(false)
    setEditingReminder(undefined)
  }

  function handleSave() {
    loadReminders()
  }

  const filteredReminders = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfWeek = new Date(today)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminder_date)

      switch (filter) {
        case 'today':
          return !reminder.is_completed &&
            reminderDate >= today &&
            reminderDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
        case 'week':
          return !reminder.is_completed &&
            reminderDate >= today &&
            reminderDate < endOfWeek
        case 'overdue':
          return !reminder.is_completed && reminderDate < now
        case 'completed':
          return reminder.is_completed
        default:
          return !reminder.is_completed
      }
    })
  }, [reminders, filter])

  const overdueCount = useMemo(() => {
    const now = new Date()
    return reminders.filter(r => !r.is_completed && new Date(r.reminder_date) < now).length
  }, [reminders])

  const todayCount = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    return reminders.filter(r =>
      !r.is_completed &&
      new Date(r.reminder_date) >= today &&
      new Date(r.reminder_date) < tomorrow
    ).length
  }, [reminders])

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    if (date >= today && date < tomorrow) {
      return `Heute, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (date >= tomorrow && date < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
      return `Morgen, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
    }
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function isOverdue(dateStr: string) {
    return new Date(dateStr) < new Date()
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pt-14 lg:pt-0">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Erinnerungen
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {overdueCount > 0 ? (
                <span className="text-red-600 dark:text-red-400">{overdueCount} überfällig</span>
              ) : todayCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">{todayCount} heute fällig</span>
              ) : (
                'Keine fälligen Erinnerungen'
              )}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neue Erinnerung
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(Object.keys(FILTER_LABELS) as FilterType[]).map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {FILTER_LABELS[filterType]}
              {filterType === 'overdue' && overdueCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {overdueCount}
                </span>
              )}
              {filterType === 'today' && todayCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {todayCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reminders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 dark:text-slate-400 mt-4">Laden...</p>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Keine Erinnerungen
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {filter === 'all'
                ? 'Du hast noch keine offenen Erinnerungen.'
                : `Keine Erinnerungen in "${FILTER_LABELS[filter]}".`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Erste Erinnerung erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map(reminder => (
              <div
                key={reminder.id}
                className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm transition ${
                  reminder.is_completed ? 'opacity-60' : ''
                } ${isOverdue(reminder.reminder_date) && !reminder.is_completed ? 'border-l-4 border-red-500' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(reminder)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      reminder.is_completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                    }`}
                  >
                    {reminder.is_completed && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${reminder.is_completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                      {reminder.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm">
                      {/* Date */}
                      <span className={`${
                        isOverdue(reminder.reminder_date) && !reminder.is_completed
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {formatDate(reminder.reminder_date)}
                      </span>

                      {/* Type */}
                      {reminder.reminder_type !== 'once' && (
                        <span className="text-slate-400 dark:text-slate-500">
                          {REMINDER_TYPE_LABELS[reminder.reminder_type]}
                        </span>
                      )}

                      {/* Linked Item */}
                      {reminder.items && (
                        <Link
                          href={`/collections/${reminder.items.collection_id}/items/${reminder.items.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {reminder.items.name}
                        </Link>
                      )}
                    </div>

                    {/* Notes */}
                    {reminder.notes && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        {reminder.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(reminder)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition"
                      title="Bearbeiten"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition"
                      title="Löschen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Modal */}
      {showModal && (
        <ReminderModal
          reminder={editingReminder}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
