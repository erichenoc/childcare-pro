'use client'

import { useEffect } from 'react'
import { pushService } from '../services/push.service'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register on client side
    if (typeof window === 'undefined') return

    // Register service worker on mount
    async function registerSW() {
      try {
        await pushService.registerServiceWorker()
        console.log('[App] Service Worker registered')
      } catch (error) {
        console.error('[App] Service Worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  // This component doesn't render anything
  return null
}

export default ServiceWorkerRegistration
