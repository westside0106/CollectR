'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { Reminder, ReminderType } from '@/types/database'

interface ReminderModalProps {
  itemId?: string
  itemName?: string
  reminder?: Reminder
  onClose: () => void
  onSave?: (reminder: Reminder) => void
}

const REMINDER_TYPES: Record<ReminderType, string> = {
  once: 'Einmalig',
  recurring_weekly: 'Wöchentlich',
  recurring_monthly: 'Monatlich',
  recurring_yearly: 'Jährlich'
}

export function ReminderModal({ itemId, itemName, reminder, onClose, onSave }: ReminderModalProps) {
  const supabase = createClient()
  const { showToast } = useToast()

  const [title, setTitle] = useState(reminder?.title || '')
  const [reminderDate, setReminderDate] = useState(
    reminder?.reminder_date
      ? new Date(reminder.reminder_date).toISOString().slice(0, 16)
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  )
  const [reminderType, setReminderType] = useState<ReminderType>(reminder?.reminder_type || 'once')
  const [notes, setNotes] = useState(reminder?.notes || '')
  const [saving, setSaving] = useState(false)

  const isEditing = !!reminder

  async function handleSave() {
    if (!title.trim()) {
      showToast('Bitte Titel eingeben', 'error')
      return
    }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast('Nicht eingeloggt', 'error')
      setSaving(false)
      return
    }

    const reminderData = {
      title: title.trim(),
      reminder_date: new Date(reminderDate).toISOString(),
      reminder_type: reminderType,
      notes: notes.trim() || null,
      item_id: itemId || null,
      user_id: user.id,
      is_completed: false,
      completed_at: null
    }

    let result
    if (isEditing) {
      const { data, error } = await supabase
        .from('reminders')
        .update({
          title: reminderData.title,
          reminder_date: reminderData.reminder_date,
          reminder_type: reminderData.reminder_type,
          notes: reminderData.notes
        })
        .eq('id', reminder.id)
        .select()
        .single()

      result = { data, error }
    } else {
      const { data, error } = await supabase
        .from('reminders')
        .insert(reminderData)
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      showToast('Fehler beim Speichern', 'error')
      console.error(result.error)
    } else {
      showToast(isEditing ? 'Erinnerung aktualisiert' : 'Erinnerung erstellt', 'success')
      onSave?.(result.data)
      onClose()
    }

    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold dark:text-white">
                {isEditing ? 'Erinnerung bearbeiten' : 'Neue Erinnerung'}
              </h2>
              {itemName && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Für: {itemName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Titel */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Ausleihe zurückholen"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Datum/Zeit */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Datum & Uhrzeit *
            </label>
            <input
              type="datetime-local"
              value={reminderDate}
              onChange={e => setReminderDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Typ */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Wiederholung
            </label>
            <select
              value={reminderType}
              onChange={e => setReminderType(e.target.value as ReminderType)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(REMINDER_TYPES).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </select>
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notizen
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optionale Notizen..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Speichern...' : isEditing ? 'Aktualisieren' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  )
}
