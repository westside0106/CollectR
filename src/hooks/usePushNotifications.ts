'use client'

import { useState, useEffect, useCallback } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported' | 'default'

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>('prompt')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prüfe initialen Status
  useEffect(() => {
    async function checkStatus() {
      // Prüfe ob Push unterstützt wird
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPermission('unsupported')
        setIsLoading(false)
        return
      }

      // Prüfe Permission
      const currentPermission = Notification.permission as PushPermissionState
      setPermission(currentPermission)

      // Prüfe bestehende Subscription
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (err) {
        console.error('Error checking push subscription:', err)
      }

      setIsLoading(false)
    }

    checkStatus()
  }, [])

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      setError('Push-Konfiguration fehlt')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Permission anfragen
      const result = await Notification.requestPermission()
      setPermission(result as PushPermissionState)

      if (result !== 'granted') {
        setIsLoading(false)
        return false
      }

      // Service Worker holen
      const registration = await navigator.serviceWorker.ready

      // Push Subscription erstellen
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      // Subscription an Server senden
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON())
      })

      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Subscription')
      }

      setIsSubscribed(true)
      setIsLoading(false)
      return true
    } catch (err: any) {
      console.error('Push subscribe error:', err)
      setError(err.message || 'Fehler beim Aktivieren')
      setIsLoading(false)
      return false
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Server informieren
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        })

        // Lokal unsubscribe
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (err: any) {
      console.error('Push unsubscribe error:', err)
      setError(err.message || 'Fehler beim Deaktivieren')
      setIsLoading(false)
      return false
    }
  }, [])

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    isSupported: permission !== 'unsupported'
  }
}
