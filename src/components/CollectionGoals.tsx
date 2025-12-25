'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Goal {
  id: string
  name: string
  description?: string
  target_count: number
  goal_type: 'count' | 'value' | 'category'
  target_value?: number
  target_category_id?: string
  deadline?: string
  created_at: string
}

interface GoalProgress {
  goal: Goal
  current: number
  percentage: number
  isCompleted: boolean
}

interface CollectionGoalsProps {
  collectionId: string
  itemCount: number
  totalValue: number
  categoryCounts: Map<string, number>
}

export function CollectionGoals({
  collectionId,
  itemCount,
  totalValue,
  categoryCounts
}: CollectionGoalsProps) {
  const supabase = createClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([])

  useEffect(() => {
    loadGoals()
    loadCategories()
  }, [collectionId])

  async function loadGoals() {
    const { data } = await supabase
      .from('collection_goals')
      .select('*')
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: true })

    setGoals(data || [])
    setLoading(false)
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name, icon')
      .order('name')

    setCategories(data || [])
  }

  function calculateProgress(goal: Goal): GoalProgress {
    let current = 0
    let target = goal.target_count

    switch (goal.goal_type) {
      case 'count':
        current = itemCount
        break
      case 'value':
        current = totalValue
        target = goal.target_value || goal.target_count
        break
      case 'category':
        current = categoryCounts.get(goal.target_category_id || '') || 0
        break
    }

    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
    const isCompleted = current >= target

    return { goal, current, percentage, isCompleted }
  }

  async function deleteGoal(goalId: string) {
    if (!confirm('Ziel wirklich löschen?')) return

    await supabase.from('collection_goals').delete().eq('id', goalId)
    setGoals(goals.filter(g => g.id !== goalId))
  }

  const goalsWithProgress = goals.map(calculateProgress)
  const completedCount = goalsWithProgress.filter(g => g.isCompleted).length

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Sammlungsziele
            </h3>
            {goals.length > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {completedCount} von {goals.length} erreicht
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Ziel
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <span className="text-4xl block mb-2">🎯</span>
            <p>Noch keine Ziele definiert</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Erstes Ziel erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {goalsWithProgress.map(({ goal, current, percentage, isCompleted }) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                current={current}
                percentage={percentage}
                isCompleted={isCompleted}
                categories={categories}
                onEdit={() => setEditingGoal(goal)}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingGoal) && (
        <GoalModal
          collectionId={collectionId}
          goal={editingGoal}
          categories={categories}
          onClose={() => {
            setShowAddModal(false)
            setEditingGoal(null)
          }}
          onSave={() => {
            loadGoals()
            setShowAddModal(false)
            setEditingGoal(null)
          }}
        />
      )}
    </>
  )
}

function GoalItem({
  goal,
  current,
  percentage,
  isCompleted,
  categories,
  onEdit,
  onDelete
}: {
  goal: Goal
  current: number
  percentage: number
  isCompleted: boolean
  categories: { id: string; name: string; icon: string }[]
  onEdit: () => void
  onDelete: () => void
}) {
  const [showActions, setShowActions] = useState(false)

  const formatValue = (value: number, type: string) => {
    if (type === 'value') {
      return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
    }
    return value.toString()
  }

  const targetValue = goal.goal_type === 'value'
    ? (goal.target_value || goal.target_count)
    : goal.target_count

  const category = goal.goal_type === 'category'
    ? categories.find(c => c.id === goal.target_category_id)
    : null

  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted

  return (
    <div
      className={`relative p-4 rounded-lg border transition-all ${
        isCompleted
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : isOverdue
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {isCompleted ? '✅' : goal.goal_type === 'value' ? '💰' : goal.goal_type === 'category' ? '📁' : '🎯'}
          </span>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white">{goal.name}</h4>
            {goal.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{goal.description}</p>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
              title="Bearbeiten"
            >
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Löschen"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Category badge */}
      {category && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-xs text-slate-700 dark:text-slate-300">
            {category.icon} {category.name}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600 dark:text-slate-400">
            {formatValue(current, goal.goal_type)} / {formatValue(targetValue, goal.goal_type)}
          </span>
          <span className={`font-medium ${
            isCompleted ? 'text-green-600 dark:text-green-400' :
            isOverdue ? 'text-red-600 dark:text-red-400' :
            'text-slate-600 dark:text-slate-300'
          }`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? 'bg-green-500'
                : isOverdue
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Deadline */}
      {goal.deadline && (
        <div className={`mt-2 text-xs ${
          isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
        }`}>
          {isOverdue ? '⚠️ Überfällig: ' : '📅 Frist: '}
          {new Date(goal.deadline).toLocaleDateString('de-DE')}
        </div>
      )}
    </div>
  )
}

function GoalModal({
  collectionId,
  goal,
  categories,
  onClose,
  onSave
}: {
  collectionId: string
  goal: Goal | null
  categories: { id: string; name: string; icon: string }[]
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(goal?.name || '')
  const [description, setDescription] = useState(goal?.description || '')
  const [goalType, setGoalType] = useState<'count' | 'value' | 'category'>(goal?.goal_type || 'count')
  const [targetCount, setTargetCount] = useState(goal?.target_count?.toString() || '10')
  const [targetValue, setTargetValue] = useState(goal?.target_value?.toString() || '1000')
  const [targetCategoryId, setTargetCategoryId] = useState(goal?.target_category_id || '')
  const [deadline, setDeadline] = useState(goal?.deadline || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      collection_id: collectionId,
      name,
      description: description || null,
      goal_type: goalType,
      target_count: goalType === 'value' ? 0 : parseInt(targetCount) || 1,
      target_value: goalType === 'value' ? parseFloat(targetValue) || 0 : null,
      target_category_id: goalType === 'category' ? targetCategoryId : null,
      deadline: deadline || null,
    }

    try {
      if (goal) {
        const { error: updateError } = await supabase
          .from('collection_goals')
          .update(data)
          .eq('id', goal.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('collection_goals')
          .insert(data)

        if (insertError) throw insertError
      }

      onSave()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {goal ? 'Ziel bearbeiten' : 'Neues Ziel'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Zielname *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="z.B. 100 Bücher sammeln"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Beschreibung
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Zieltyp *
            </label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="count">Anzahl Items</option>
              <option value="value">Gesamtwert erreichen</option>
              <option value="category">Items in Kategorie</option>
            </select>
          </div>

          {goalType === 'count' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Zielanzahl *
              </label>
              <input
                type="number"
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
                min="1"
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {goalType === 'value' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Zielwert (EUR) *
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                min="0"
                step="0.01"
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {goalType === 'category' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Kategorie *
                </label>
                <select
                  value={targetCategoryId}
                  onChange={(e) => setTargetCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Kategorie wählen...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Zielanzahl in Kategorie *
                </label>
                <input
                  type="number"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  min="1"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Frist (optional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? 'Speichere...' : goal ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
