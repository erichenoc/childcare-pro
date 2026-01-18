'use client'

import { useState, useEffect, useCallback } from 'react'
import { pushService, type PushNotificationPayload } from '../services/push.service'

interface UsePushNotificationsResult {
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission
  isLoading: boolean
  error: string | null
  subscribe: (userId: string) => Promise<boolean>
  unsubscribe: (userId: string) => Promise<boolean>
  sendTestNotification: () => Promise<boolean>
  showNotification: (payload: PushNotificationPayload) => Promise<boolean>
}

export function usePushNotifications(userId?: string): UsePushNotificationsResult {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize on mount
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true)
        setError(null)

        // Check if push is supported
        const supported = pushService.isPushSupported()
        setIsSupported(supported)

        if (!supported) {
          setIsLoading(false)
          return
        }

        // Register service worker
        await pushService.registerServiceWorker()

        // Check current permission
        const currentPermission = pushService.getPermissionStatus()
        setPermission(currentPermission)

        // Check subscription status
        if (currentPermission === 'granted') {
          const subscribed = await pushService.getSubscriptionStatus()
          setIsSubscribed(subscribed)
        }
      } catch (err) {
        console.error('[usePushNotifications] Init error:', err)
        setError('Error al inicializar notificaciones')
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async (userId: string): Promise<boolean> => {
    if (!isSupported) {
      setError('Las notificaciones push no son compatibles con este navegador')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const subscription = await pushService.subscribe(userId)

      if (subscription) {
        setIsSubscribed(true)
        setPermission('granted')
        return true
      }

      // Check if permission was denied
      const currentPermission = pushService.getPermissionStatus()
      setPermission(currentPermission)

      if (currentPermission === 'denied') {
        setError('Permiso de notificaciones denegado. Por favor, habilítalo en la configuración del navegador.')
      }

      return false
    } catch (err) {
      console.error('[usePushNotifications] Subscribe error:', err)
      setError('Error al suscribirse a las notificaciones')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (userId: string): Promise<boolean> => {
    if (!isSupported) return false

    setIsLoading(true)
    setError(null)

    try {
      const success = await pushService.unsubscribe(userId)

      if (success) {
        setIsSubscribed(false)
        return true
      }

      return false
    } catch (err) {
      console.error('[usePushNotifications] Unsubscribe error:', err)
      setError('Error al cancelar la suscripción')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      setError('Primero debes habilitar las notificaciones')
      return false
    }

    try {
      return await pushService.sendTestNotification()
    } catch (err) {
      console.error('[usePushNotifications] Test notification error:', err)
      setError('Error al enviar notificación de prueba')
      return false
    }
  }, [isSupported, permission])

  // Show custom notification
  const showNotification = useCallback(async (payload: PushNotificationPayload): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      return false
    }

    try {
      return await pushService.showLocalNotification(payload)
    } catch (err) {
      console.error('[usePushNotifications] Show notification error:', err)
      return false
    }
  }, [isSupported, permission])

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    showNotification,
  }
}

// Export type for use in components
export type { UsePushNotificationsResult }
