import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import webpush from 'web-push'

// VAPID Keys müssen in Umgebungsvariablen gesetzt werden
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@collectorssphere.com',
    vapidPublicKey,
    vapidPrivateKey
  )
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

export async function POST(request: NextRequest) {
  try {
    // Nur Server-zu-Server oder Admin-Aufrufe erlauben
    const authHeader = request.headers.get('authorization')
    const serverSecret = process.env.PUSH_SERVER_SECRET

    // API-Secret prüfen für Server-zu-Server Kommunikation
    if (serverSecret && authHeader !== `Bearer ${serverSecret}`) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { userId, userIds, notification } = await request.json() as {
      userId?: string
      userIds?: string[]
      notification: NotificationPayload
    }

    if (!notification || (!userId && !userIds)) {
      return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 })
    }

    const supabase = await createClient()

    // Hole alle Push-Subscriptions für die Benutzer
    let query = supabase.from('push_subscriptions').select('*')

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    } else if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: subscriptions, error } = await query

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Keine Subscriptions gefunden' })
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192.png',
      badge: notification.badge || '/icons/icon-72.png',
      data: {
        url: notification.url || '/',
        tag: notification.tag
      }
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        try {
          await webpush.sendNotification(pushSubscription, payload)
          return { success: true, endpoint: sub.endpoint }
        } catch (err: any) {
          // Bei 410 Gone - Subscription entfernen
          if (err.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
          }
          return { success: false, endpoint: sub.endpoint, error: err.message }
        }
      })
    )

    const sent = results.filter(
      r => r.status === 'fulfilled' && (r.value as any).success
    ).length

    return NextResponse.json({
      sent,
      total: subscriptions.length,
      results
    })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 })
  }
}
