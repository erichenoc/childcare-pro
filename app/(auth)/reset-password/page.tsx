'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
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

export default function ResetPasswordPage() {
  const t = useTranslations()
  const router = useRouter()

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = t.auth.passwordRequirements
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const result = await authService.updatePassword(formData.password)

      if (!result.success) {
        setErrors({ form: result.error?.message || 'Error al restablecer la contraseña' })
        return
      }

      setIsSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch {
      setErrors({ form: 'Error al restablecer la contraseña. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
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
            ¡Contraseña Actualizada!
          </h2>

          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Tu contraseña ha sido restablecida exitosamente.
            Serás redirigido al inicio de sesión...
          </p>

          <Link href="/login">
            <GlassButton variant="primary">
              {t.auth.signIn}
            </GlassButton>
          </Link>
        </GlassCardContent>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="frosted" className="animate-fade-in-up">
      <GlassCardHeader className="text-center pb-2">
        <GlassCardTitle className="text-2xl">
          {t.auth.resetPassword}
        </GlassCardTitle>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Ingresa tu nueva contraseña
        </p>
      </GlassCardHeader>

      <GlassCardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Form error */}
          {errors.form && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm animate-fade-in">
              {errors.form}
            </div>
          )}

          {/* New Password */}
          <div className="relative">
            <GlassInput
              type={showPassword ? 'text' : 'password'}
              name="password"
              label={t.auth.newPassword}
              placeholder="Ingresa tu nueva contraseña"
              value={formData.password}
              onChange={handleInputChange}
              leftIcon={<Lock className="w-5 h-5" />}
              hint={t.auth.passwordRequirements}
              error={errors.password}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Confirm New Password */}
          <div className="relative">
            <GlassInput
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              label={t.auth.confirmPassword}
              placeholder="Confirma tu nueva contraseña"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              leftIcon={<Lock className="w-5 h-5" />}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Password strength indicator */}
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tu contraseña debe contener:
            </p>
            <ul className="space-y-1">
              <PasswordRequirement
                met={formData.password.length >= 8}
                text="Al menos 8 caracteres"
              />
              <PasswordRequirement
                met={/[A-Z]/.test(formData.password)}
                text="Una letra mayúscula"
              />
              <PasswordRequirement
                met={/[a-z]/.test(formData.password)}
                text="Una letra minúscula"
              />
              <PasswordRequirement
                met={/[0-9]/.test(formData.password)}
                text="Un número"
              />
            </ul>
          </div>

          {/* Submit button */}
          <GlassButton
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            {t.auth.resetPassword}
          </GlassButton>
        </form>
      </GlassCardContent>
    </GlassCard>
  )
}

// Password requirement component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <li className={`text-sm flex items-center gap-2 ${met ? 'text-success' : 'text-gray-400'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${met ? 'bg-success/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
        {met && <CheckCircle className="w-3 h-3" />}
      </div>
      {text}
    </li>
  )
}
