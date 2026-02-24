// Push Notifications Service - ChildCare Pro
// Handles browser push notifications using Service Workers

import { createClient } from '@/shared/lib/supabase/client'

// ============================================
// TYPES
// ============================================

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  type?: 'attendance' | 'incident' | 'billing' | 'announcement' | 'reminder' | 'emergency'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  data?: Record<string, unknown>
  vibrate?: number[]
  actions?: { action: string; title: string; icon?: string }[]
}

export type NotificationPermission = 'default' | 'granted' | 'denied'

// ============================================
// SERVICE CLASS
// ============================================

class PushService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private isSupported: boolean = false

  constructor() {
    // Check support on client side only
    if (typeof window !== 'undefined') {
      this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window
    }
  }

  // ============================================
  // SERVICE WORKER REGISTRATION
  // ============================================

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      console.warn('[Push] Service Workers not supported')
      return null
    }

    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })

      console.log('[Push] Service Worker registered:', registration.scope)

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready
      this.serviceWorkerRegistration = registration

      // Check for updates periodically
      setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000) // Every hour

      return registration
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error)
      return null
    }
  }

  async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (this.serviceWorkerRegistration) {
      return this.serviceWorkerRegistration
    }

    if (!this.isSupported) return null

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        this.serviceWorkerRegistration = registration
        return registration
      }
      return this.registerServiceWorker()
    } catch {
      return null
    }
  }

  // ============================================
  // PERMISSION HANDLING
  // ============================================

  getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }
    return Notification.permission as NotificationPermission
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      console.log('[Push] Permission:', permission)
      return permission as NotificationPermission
    } catch (error) {
      console.error('[Push] Error requesting permission:', error)
      return 'denied'
    }
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.isSupported) {
      console.warn('[Push] Push not supported')
      return null
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      console.warn('[Push] Permission not granted')
      return null
    }

    try {
      const registration = await this.getServiceWorkerRegistration()
      if (!registration) {
        throw new Error('Service Worker not registered')
      }

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.warn('[Push] VAPID public key not configured, using local notifications only')
        return null
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey)

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      })

      console.log('[Push] Subscribed:', subscription.endpoint)

      // Save subscription to Supabase
      const savedSubscription = await this.saveSubscription(userId, subscription)
      return savedSubscription
    } catch (error) {
      console.error('[Push] Error subscribing:', error)
      return null
    }
  }

  async unsubscribe(userId: string): Promise<boolean> {
    try {
      const registration = await this.getServiceWorkerRegistration()
      if (!registration) return false

      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) return true

      // Unsubscribe from push
      await subscription.unsubscribe()

      // Remove from database
      await this.removeSubscription(userId, subscription.endpoint)

      console.log('[Push] Unsubscribed successfully')
      return true
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error)
      return false
    }
  }

  async getSubscriptionStatus(): Promise<boolean> {
    try {
      const registration = await this.getServiceWorkerRegistration()
      if (!registration) return false

      const subscription = await registration.pushManager.getSubscription()
      return !!subscription
    } catch {
      return false
    }
  }

  // ============================================
  // DATABASE OPERATIONS
  // ============================================

  private async saveSubscription(
    userId: string,
    subscription: globalThis.PushSubscription
  ): Promise<PushSubscription | null> {
    const supabase = createClient()

    const keys = subscription.toJSON().keys
    if (!keys) {
      console.error('[Push] No keys in subscription')
      return null
    }

    const subscriptionData = {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: navigator.userAgent,
      is_active: true,
    }

    // Upsert based on endpoint to avoid duplicates
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData, { onConflict: 'endpoint' })
      .select()
      .single()

    if (error) {
      console.error('[Push] Error saving subscription:', error)
      // Don't throw - subscription still works locally
      return null
    }

    return data
  }

  private async removeSubscription(userId: string, endpoint: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint)

    if (error) {
      console.error('[Push] Error removing subscription:', error)
    }
  }

  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('[Push] Error getting subscriptions:', error)
      return []
    }

    return data || []
  }

  // ============================================
  // LOCAL NOTIFICATIONS (fallback)
  // ============================================

  async showLocalNotification(payload: PushNotificationPayload): Promise<boolean> {
    const permission = this.getPermissionStatus()
    if (permission !== 'granted') {
      return false
    }

    try {
      const registration = await this.getServiceWorkerRegistration()
      if (!registration) {
        // Fallback to Notification API
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/badge-72x72.png',
          tag: payload.tag || 'default',
          data: { url: payload.url, ...payload.data },
        })
        return true
      }

      // Use Service Worker notification
      const notificationOptions: NotificationOptions & Record<string, unknown> = {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        tag: payload.tag || 'default',
        data: { url: payload.url || '/dashboard/notifications', ...payload.data },
        requireInteraction: payload.priority === 'urgent' || payload.priority === 'high',
        vibrate: payload.vibrate || [200, 100, 200],
        actions: payload.actions,
      }
      await registration.showNotification(payload.title, notificationOptions as NotificationOptions)

      return true
    } catch (error) {
      console.error('[Push] Error showing notification:', error)
      return false
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  }

  isPushSupported(): boolean {
    return this.isSupported
  }

  // ============================================
  // TEST NOTIFICATION
  // ============================================

  async sendTestNotification(): Promise<boolean> {
    return this.showLocalNotification({
      title: 'ChildCare Pro',
      body: 'Las notificaciones push están funcionando correctamente.',
      type: 'announcement',
      priority: 'normal',
      url: '/dashboard/notifications',
    })
  }
}

// Export singleton instance
export const pushService = new PushService()
