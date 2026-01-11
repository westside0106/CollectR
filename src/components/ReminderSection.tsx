'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { ReminderModal } from '@/components/ReminderModal'
import { Reminder } from '@/types/database'

interface ReminderSectionProps {
  itemId: string
  itemName: string
}

const REMINDER_TYPE_LABELS: Record<string, string> = {
  once: 'Einmalig',
  recurring_weekly: 'Wöchentlich',
  recurring_monthly: 'Monatlich',
  recurring_yearly: 'Jährlich'
}

export function ReminderSection({ itemId, itemName }: ReminderSectionProps) {
  const supabase = createClient()
  const { showToast } = useToast()

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined)

  useEffect(() => {
    loadReminders()
  }, [itemId])

  async function loadReminders() {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('item_id', itemId)
      .order('reminder_date', { ascending: true })

    if (!error && data) {
      setReminders(data)
    }
    setLoading(false)
  }

  async function toggleComplete(reminder: Reminder) {
    const newCompleted = !reminder.is_completed

    const { error } = await supabase
      .from('reminders')
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      })
      .eq('id', reminder.id)

    if (!error) {
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

    if (!error) {
      setReminders(prev => prev.filter(r => r.id !== id))
      showToast('Erinnerung gelöscht', 'success')
    }
  }

  function handleEdit(reminder: Reminder) {
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

  const activeReminders = reminders.filter(r => !r.is_completed)
  const overdueReminders = activeReminders.filter(r => isOverdue(r.reminder_date))

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Erinnerungen</h2>
          {overdueReminders.length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
              {overdueReminders.length} überfällig
            </span>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Hinzufügen
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : reminders.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 italic text-center py-4">
          Keine Erinnerungen für dieses Item
        </p>
      ) : (
        <div className="space-y-2">
          {reminders.map(reminder => (
            <div
              key={reminder.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition ${
                reminder.is_completed
                  ? 'bg-slate-50 dark:bg-slate-700/30 opacity-60'
                  : isOverdue(reminder.reminder_date)
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-slate-50 dark:bg-slate-700/50'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleComplete(reminder)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                  reminder.is_completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                }`}
              >
                {reminder.is_completed && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${reminder.is_completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                  {reminder.title}
                </p>
                <p className={`text-xs ${
                  isOverdue(reminder.reminder_date) && !reminder.is_completed
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {formatDate(reminder.reminder_date)}
                  {reminder.reminder_type !== 'once' && (
                    <span className="ml-2 text-slate-400">
                      ({REMINDER_TYPE_LABELS[reminder.reminder_type]})
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(reminder)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded transition"
                  title="Bearbeiten"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded transition"
                  title="Löschen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ReminderModal
          itemId={itemId}
          itemName={itemName}
          reminder={editingReminder}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </section>
  )
}
