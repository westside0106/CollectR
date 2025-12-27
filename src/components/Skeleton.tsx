'use client'

interface SkeletonProps {
  className?: string
}

// Base Skeleton with pulse animation
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
    />
  )
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  )
}

// Collection Card Skeleton
export function CollectionCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

// Item Card Skeleton
export function ItemCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

// Dashboard Stats Skeleton
export function StatsSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  )
}

// Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="flex items-end justify-center gap-3 h-48">
        <Skeleton className="w-12 h-24" />
        <Skeleton className="w-12 h-36" />
        <Skeleton className="w-12 h-20" />
        <Skeleton className="w-12 h-32" />
        <Skeleton className="w-12 h-28" />
      </div>
    </div>
  )
}

// Item Detail Skeleton
export function ItemDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Image */}
      <Skeleton className="w-full h-64 rounded-xl" />

      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 space-y-3">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  )
}

// List Skeleton (for recent items, etc.)
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="w-12 h-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

// Dashboard Full Skeleton
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsSkeleton />
          <StatsSkeleton />
          <StatsSkeleton />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-12 w-48 rounded-lg" />
          <Skeleton className="h-12 w-40 rounded-lg" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>

        {/* Recent Items */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <ListSkeleton count={5} />
        </div>
      </main>
    </div>
  )
}

// Collections Grid Skeleton
export function CollectionsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CollectionCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Items Grid Skeleton
export function ItemsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  )
}
