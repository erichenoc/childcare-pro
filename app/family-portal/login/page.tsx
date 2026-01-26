'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Send } from 'lucide-react'
import { guardianAuthService } from '@/features/family-portal/services/guardian-auth.service'

type LoginMode = 'password' | 'magic-link'

export default function FamilyPortalLoginPage() {
  const router = useRouter()

  const [loginMode, setLoginMode] = useState<LoginMode>('password')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await guardianAuthService.signIn(formData.email, formData.password)

      if (!result.success) {
        setError(result.error?.message || 'Credenciales incorrectas')
        return
      }

      router.push('/family-portal')
      router.refresh()
    } catch {
      setError('Error al iniciar sesion. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await guardianAuthService.sendMagicLink(formData.email)

      if (!result.success) {
        setError(result.error?.message || 'Error al enviar el enlace')
        return
      }

      setMagicLinkSent(true)
    } catch {
      setError('Error al enviar el enlace. Intenta de nuevo.')
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
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Revisa tu correo
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Enviamos un enlace magico a <strong>{formData.email}</strong>.
              Haz clic en el enlace para iniciar sesion.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              El enlace expira en 1 hora. Revisa tu carpeta de spam si no lo encuentras.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false)
                setFormData({ email: '', password: '' })
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Usar otro correo
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-pink-400/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <Image
                src="https://res.cloudinary.com/dbftvu8ab/image/upload/v1768428103/ChildCarePro_Logo_1_f0gqth.png"
                alt="ChildCare Pro Logo"
                width={80}
                height={80}
                className="drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Portal de Padres
            </h1>
            <p className="text-blue-100 text-sm">
              Accede a la informacion de tus hijos
            </p>
          </div>

          {/* Login Mode Selector */}
          <div className="px-8 pt-6">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={`
                  flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
                  ${loginMode === 'password'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                <Lock className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                Contrasena
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('magic-link')}
                className={`
                  flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
                  ${loginMode === 'magic-link'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                <Sparkles className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                Magic Link
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-6">
            <form onSubmit={loginMode === 'password' ? handlePasswordLogin : handleMagicLinkLogin} className="space-y-5">
              {/* Error message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Correo electronico
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password (only for password mode) */}
              {loginMode === 'password' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Contrasena
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Tu contrasena"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autoComplete="current-password"
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot password link */}
              {loginMode === 'password' && (
                <div className="text-right">
                  <Link
                    href="/family-portal/forgot-password"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
                  >
                    Olvidaste tu contrasena?
                  </Link>
                </div>
              )}

              {/* Magic Link Info */}
              {loginMode === 'magic-link' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <Sparkles className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                    Te enviaremos un enlace magico a tu correo. Solo haz clic para iniciar sesion sin contrasena.
                  </p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{loginMode === 'password' ? 'Entrando...' : 'Enviando...'}</span>
                  </>
                ) : (
                  <>
                    <span>{loginMode === 'password' ? 'Iniciar Sesion' : 'Enviar Magic Link'}</span>
                    {loginMode === 'password' ? <ArrowRight className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No tienes acceso?{' '}
              <span className="text-gray-700 dark:text-gray-300">
                Contacta a tu guarderia
              </span>
            </p>
          </div>
        </div>

        {/* Footer decorativo */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Protegido con encriptacion de ultima generacion
          </p>
        </div>
      </div>
    </div>
  )
}
