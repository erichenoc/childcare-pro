'use client'

import { useState } from 'react'
import { Bell, BellOff, Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { GlassButton } from '@/shared/components/ui'

interface PushNotificationToggleProps {
  userId: string
  showTestButton?: boolean
  className?: string
}

export function PushNotificationToggle({
  userId,
  showTestButton = true,
  className = '',
}: PushNotificationToggleProps) {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications(userId)

  const [testSent, setTestSent] = useState(false)

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe(userId)
    } else {
      await subscribe(userId)
    }
  }

  const handleSendTest = async () => {
    const sent = await sendTestNotification()
    if (sent) {
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    }
  }

  // Not supported
  if (!isSupported) {
    return (
      <div className={`p-4 rounded-xl bg-yellow-50 border border-yellow-200 ${className}`}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">Notificaciones no disponibles</p>
            <p className="text-sm text-yellow-600">
              Tu navegador no soporta notificaciones push. Prueba con Chrome, Firefox o Safari.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <div className={`p-4 rounded-xl bg-red-50 border border-red-200 ${className}`}>
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Notificaciones bloqueadas</p>
            <p className="text-sm text-red-600">
              Las notificaciones están bloqueadas. Ve a la configuración de tu navegador para habilitarlas.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <div className="p-2 rounded-full bg-green-100">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
          ) : (
            <div className="p-2 rounded-full bg-gray-200">
              <BellOff className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">
              Notificaciones Push
            </p>
            <p className="text-sm text-gray-500">
              {isSubscribed
                ? 'Recibirás notificaciones en este dispositivo'
                : 'Habilita para recibir alertas importantes'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            isSubscribed ? 'bg-green-500' : 'bg-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              isSubscribed ? 'translate-x-7' : 'translate-x-0.5'
            }`}
          />
          {isLoading && (
            <Loader2 className="absolute inset-0 m-auto w-4 h-4 text-gray-600 animate-spin" />
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Test Button */}
      {showTestButton && isSubscribed && (
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={handleSendTest}
          disabled={isLoading || testSent}
          className="w-full"
        >
          {testSent ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Notificación enviada
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar notificación de prueba
            </>
          )}
        </GlassButton>
      )}

      {/* Info Text */}
      {!isSubscribed && (
        <p className="text-xs text-gray-500 text-center">
          Al habilitar, recibirás notificaciones sobre asistencia, incidentes, facturación y más.
        </p>
      )}
    </div>
  )
}

export default PushNotificationToggle
