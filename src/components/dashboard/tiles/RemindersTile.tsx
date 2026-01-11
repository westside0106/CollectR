'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Reminder } from '@/types/database'

export function RemindersTile() {
  const supabase = createClient()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReminders()
  }, [])

  async function loadReminders() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data } = await supabase
      .from('reminders')
      .select('*, items(name)')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .lte('reminder_date', weekFromNow.toISOString())
      .order('reminder_date', { ascending: true })
      .limit(5)

    setReminders(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        ))}
      </div>
    )
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Keine anstehenden Erinnerungen
        </p>
        <Link
          href="/reminders"
          className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-2 inline-block"
        >
          Alle Erinnerungen →
        </Link>
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="space-y-2">
      {reminders.map(reminder => {
        const reminderDate = new Date(reminder.reminder_date)
        const isOverdue = reminderDate < now
        const isToday = reminderDate.toDateString() === now.toDateString()

        return (
          <Link
            key={reminder.id}
            href="/reminders"
            className={`
              block p-3 rounded-lg transition
              ${isOverdue
                ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                : isToday
                  ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                  : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-2 h-2 rounded-full flex-shrink-0
                ${isOverdue ? 'bg-red-500' : isToday ? 'bg-amber-500' : 'bg-blue-500'}
              `} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {reminder.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isOverdue ? 'Überfällig: ' : ''}
                  {reminderDate.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {isOverdue && (
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full">
                  Überfällig
                </span>
              )}
            </div>
          </Link>
        )
      })}

      <Link
        href="/reminders"
        className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline pt-2"
      >
        Alle Erinnerungen anzeigen →
      </Link>
    </div>
  )
}
