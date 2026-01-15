'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import { useTranslations } from '@/shared/lib/i18n'
import { authService } from '@/features/auth/services/auth.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassInput,
  GlassButton,
} from '@/shared/components/ui'

export default function ForgotPasswordPage() {
  const t = useTranslations()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await authService.resetPassword(email)

      if (!result.success) {
        setError(result.error?.message || 'Error al enviar el enlace')
        return
      }

      setIsSuccess(true)
    } catch {
      setError('Error al enviar el enlace. Por favor, intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <GlassCard variant="frosted" className="animate-fade-in-up">
        <GlassCardContent className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t.auth.checkYourEmail}
          </h2>

          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t.auth.passwordResetSent}
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Hemos enviado un enlace de recuperación a{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {email}
            </span>
          </p>

          <Link href="/login">
            <GlassButton
              variant="primary"
              leftIcon={<ArrowLeft className="w-5 h-5" />}
            >
              {t.auth.backToLogin}
            </GlassButton>
          </Link>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            ¿No recibiste el correo?{' '}
            <button
              onClick={() => {
                setIsSuccess(false)
                setEmail('')
              }}
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Intentar de nuevo
            </button>
          </p>
        </GlassCardContent>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="frosted" className="animate-fade-in-up">
      <GlassCardHeader className="text-center pb-2">
        <GlassCardTitle className="text-2xl">
          {t.auth.forgotPassword}
        </GlassCardTitle>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </GlassCardHeader>

      <GlassCardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Email */}
          <GlassInput
            type="email"
            name="email"
            label={t.auth.email}
            placeholder={t.auth.enterYourEmail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-5 h-5" />}
            required
            autoComplete="email"
          />

          {/* Submit button */}
          <GlassButton
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            isLoading={isLoading}
            rightIcon={<Send className="w-5 h-5" />}
          >
            {t.auth.sendResetLink}
          </GlassButton>

          {/* Back to login */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.auth.backToLogin}
            </Link>
          </div>
        </form>
      </GlassCardContent>
    </GlassCard>
  )
}
