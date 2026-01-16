'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, User, Building2, ArrowRight, CheckCircle } from 'lucide-react'
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

export default function RegisterPage() {
  const t = useTranslations()
  const router = useRouter()

  const [formData, setFormData] = useState({
    centerName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.centerName.trim()) {
      newErrors.centerName = 'El nombre del centro es requerido'
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = t.auth.passwordRequirements
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Debes aceptar los términos y condiciones'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const nameParts = formData.fullName.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      const result = await authService.signUp(
        formData.email,
        formData.password,
        {
          firstName,
          lastName,
        },
        {
          name: formData.centerName,
          email: formData.email,
        }
      )

      if (!result.success) {
        setErrors({ form: result.error?.message || 'Error al crear la cuenta' })
        return
      }

      if (result.requiresConfirmation) {
        setRequiresConfirmation(true)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setErrors({ form: 'Error al crear la cuenta. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (requiresConfirmation) {
    return (
      <GlassCard variant="frosted" className="animate-fade-in-up">
        <GlassCardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <GlassCardTitle className="text-2xl">
            ¡Revisa tu correo!
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Hemos enviado un enlace de confirmación a <strong>{formData.email}</strong>.
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>
          <GlassButton
            variant="secondary"
            onClick={() => router.push('/login')}
          >
            Volver al inicio de sesión
          </GlassButton>
        </GlassCardContent>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="frosted" className="animate-fade-in-up">
      <GlassCardHeader className="text-center pb-2">
        <GlassCardTitle className="text-2xl">
          {t.auth.createAccount}
        </GlassCardTitle>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Comienza a gestionar tu guardería hoy
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

          {/* Center Name */}
          <GlassInput
            type="text"
            name="centerName"
            label="Nombre del Centro"
            placeholder="Ej: Guardería Sol y Luna"
            value={formData.centerName}
            onChange={handleInputChange}
            leftIcon={<Building2 className="w-5 h-5" />}
            error={errors.centerName}
            required
          />

          {/* Full Name */}
          <GlassInput
            type="text"
            name="fullName"
            label="Nombre Completo"
            placeholder="Tu nombre completo"
            value={formData.fullName}
            onChange={handleInputChange}
            leftIcon={<User className="w-5 h-5" />}
            error={errors.fullName}
            required
            autoComplete="name"
          />

          {/* Email */}
          <GlassInput
            type="email"
            name="email"
            label={t.auth.email}
            placeholder={t.auth.enterYourEmail}
            value={formData.email}
            onChange={handleInputChange}
            leftIcon={<Mail className="w-5 h-5" />}
            error={errors.email}
            required
            autoComplete="email"
          />

          {/* Password */}
          <div className="relative">
            <GlassInput
              type={showPassword ? 'text' : 'password'}
              name="password"
              label={t.auth.password}
              placeholder={t.auth.enterYourPassword}
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

          {/* Confirm Password */}
          <div className="relative">
            <GlassInput
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              label={t.auth.confirmPassword}
              placeholder="Confirma tu contraseña"
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

          {/* Terms and Conditions */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="w-4 h-4 mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Acepto los{' '}
                <Link
                  href="/terms"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t.auth.termsAndConditions}
                </Link>{' '}
                y la{' '}
                <Link
                  href="/privacy"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t.auth.privacyPolicy}
                </Link>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="text-sm text-error mt-1">{errors.agreeToTerms}</p>
            )}
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
            {t.auth.createAccount}
          </GlassButton>

          {/* Login link */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            {t.auth.alreadyHaveAccount}{' '}
            <Link
              href="/login"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              {t.auth.signIn}
            </Link>
          </p>
        </form>
      </GlassCardContent>
    </GlassCard>
  )
}
