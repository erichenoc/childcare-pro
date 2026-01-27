'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Send } from 'lucide-react'
import { guardianAuthService } from '@/features/family-portal/services/guardian-auth.service'
import { useI18n } from '@/shared/lib/i18n'
import { NeumorphicLanguageSwitcher } from '@/shared/components/language-switcher'

type LoginMode = 'password' | 'magic-link'

export default function FamilyPortalLoginPage() {
  const router = useRouter()
  const { t } = useI18n()

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
        setError(result.error?.message || t.auth.invalidCredentials)
        return
      }

      router.push('/family-portal')
      router.refresh()
    } catch {
      setError(`${t.errors.somethingWentWrong}. ${t.errors.tryAgain}`)
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
        setError(result.error?.message || t.errors.somethingWentWrong)
        return
      }

      setMagicLinkSent(true)
    } catch {
      setError(`${t.errors.somethingWentWrong}. ${t.errors.tryAgain}`)
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
      <div className="min-h-screen bg-[#e6e7ee] flex items-center justify-center p-4">
        {/* Language Switcher - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <NeumorphicLanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          {/* Magic Link Sent Card - Neumorphism */}
          <div className="bg-[#e6e7ee] rounded-3xl shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#e6e7ee] shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Send className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
              {t.auth.checkYourEmail}
            </h2>
            <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
              {t.auth.passwordResetSent} <strong className="text-gray-700">{formData.email}</strong>
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
              Check your spam folder if you don&apos;t see it.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false)
                setFormData({ email: '', password: '' })
              }}
              className="bg-[#e6e7ee] rounded-xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] px-6 py-3 text-blue-600 font-medium transition-shadow duration-200 text-sm sm:text-base"
            >
              Use different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#e6e7ee] flex items-center justify-center p-4">
      {/* Language Switcher - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <NeumorphicLanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        {/* Main Card - Neumorphism */}
        <div className="bg-[#e6e7ee] rounded-3xl shadow-[12px_12px_24px_#b8b9be,-12px_-12px_24px_#ffffff] overflow-hidden">
          {/* Header - Logo Section */}
          <div className="p-6 sm:p-8 text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-4">
              <Image
                src="https://res.cloudinary.com/dbftvu8ab/image/upload/w_256,h_256,c_fit,q_100,f_png,e_sharpen:100/v1768428103/ChildCarePro_Logo_1_f0gqth.png"
                alt="ChildCare Pro Logo"
                width={256}
                height={256}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                priority
                unoptimized
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-1">
              {t.parentPortal.title}
            </h1>
            <p className="text-gray-500 text-sm">
              {t.parentPortal.welcome}
            </p>
          </div>

          {/* Login Mode Selector - Neumorphism */}
          <div className="px-6 sm:px-8">
            <div className="bg-[#e6e7ee] rounded-xl shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] p-1 flex">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={`
                  flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200
                  ${loginMode === 'password'
                    ? 'bg-[#e6e7ee] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] text-gray-700'
                    : 'text-gray-500'
                  }
                `}
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-1.5 -mt-0.5" />
                {t.auth.password}
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('magic-link')}
                className={`
                  flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200
                  ${loginMode === 'magic-link'
                    ? 'bg-[#e6e7ee] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] text-gray-700'
                    : 'text-gray-500'
                  }
                `}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-1.5 -mt-0.5" />
                Magic Link
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 sm:px-8 py-6">
            <form onSubmit={loginMode === 'password' ? handlePasswordLogin : handleMagicLinkLogin} className="space-y-4 sm:space-y-5">
              {/* Error message */}
              {error && (
                <div className="p-3 sm:p-4 rounded-xl bg-[#e6e7ee] shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] border-l-4 border-red-500 text-red-600 text-xs sm:text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Email Input - Neumorphism Inset */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                  {t.auth.email}
                </label>
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    autoComplete="email"
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-[#e6e7ee] rounded-xl shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] text-gray-700 placeholder-gray-400 outline-none focus:shadow-[inset_6px_6px_12px_#b8b9be,inset_-6px_-6px_12px_#ffffff] transition-shadow duration-200 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Password Input - Only for password mode */}
              {loginMode === 'password' && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    {t.auth.password}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder={t.auth.enterYourPassword}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-[#e6e7ee] rounded-xl shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] text-gray-700 placeholder-gray-400 outline-none focus:shadow-[inset_6px_6px_12px_#b8b9be,inset_-6px_-6px_12px_#ffffff] transition-shadow duration-200 text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
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
                    className="text-xs sm:text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    {t.auth.forgotPassword}?
                  </Link>
                </div>
              )}

              {/* Magic Link Info */}
              {loginMode === 'magic-link' && (
                <div className="bg-[#e6e7ee] shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] rounded-xl p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block mr-1.5 -mt-0.5 text-blue-500" />
                    {t.kiosk.welcomeMessage ? 'We\'ll send a magic link to your email. Just click to sign in without a password.' : 'We\'ll send a magic link to your email. Just click to sign in without a password.'}
                  </p>
                </div>
              )}

              {/* Submit button - Neumorphism */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 sm:py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] hover:shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t.common.loading}</span>
                  </>
                ) : (
                  <>
                    <span>{loginMode === 'password' ? t.auth.signIn : 'Send Magic Link'}</span>
                    {loginMode === 'password' ? <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              {t.auth.dontHaveAccount}{' '}
              <span className="text-gray-600 font-medium">
                {t.parentPortal.contactUs}
              </span>
            </p>
          </div>
        </div>

        {/* Footer decorativo */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            {t.landing.footerTagline}
          </p>
        </div>
      </div>
    </div>
  )
}
