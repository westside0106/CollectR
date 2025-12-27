'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

interface ShareItemButtonProps {
  itemId: string
  itemName: string
  collectionId: string
}

export function ShareItemButton({ itemId, itemName, collectionId }: ShareItemButtonProps) {
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [itemUrl, setItemUrl] = useState('')

  useEffect(() => {
    setItemUrl(`${window.location.origin}/collections/${collectionId}/items/${itemId}`)
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [collectionId, itemId])

  async function copyLink() {
    await navigator.clipboard.writeText(itemUrl)
    showToast('Link kopiert!')
  }

  async function shareNative() {
    if (canShare) {
      try {
        await navigator.share({
          title: itemName,
          text: `Schau dir "${itemName}" an!`,
          url: itemUrl,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      copyLink()
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2"
        title="Item teilen"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span className="hidden sm:inline">Teilen</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 dark:text-white">Item teilen</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Teile "{itemName}" mit anderen
            </p>

            <div className="space-y-3">
              {/* Native Share (Mobile) */}
              {canShare && (
                <button
                  onClick={shareNative}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium dark:text-white">Teilen via...</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">WhatsApp, E-Mail, etc.</div>
                  </div>
                </button>
              )}

              {/* Copy Link */}
              <button
                onClick={() => {
                  copyLink()
                  setShowModal(false)
                }}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium dark:text-white">Link kopieren</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">In die Zwischenablage</div>
                </div>
              </button>
            </div>

            {/* URL Preview */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400 break-all font-mono">
                {itemUrl}
              </p>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  )
}
