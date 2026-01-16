'use client'
// Stripe subscription integration - v2
import { useState, useEffect } from 'react'
import {
  Building2,
  Users,
  CreditCard,
  Bell,
  Globe,
  Palette,
  Shield,
  Settings2,
  ChevronRight,
  MapPin,
  Clock,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Crown,
  Sparkles,
} from 'lucide-react'
import { useTranslations, useI18n, LOCALE_NAMES, SUPPORTED_LOCALES, type Locale } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
} from '@/shared/components/ui'
import { organizationService, type Organization, type OrganizationSettings } from '@/features/organization/services/organization.service'
import { subscriptionService, type SubscriptionDetails } from '@/features/organization/services/subscription.service'
import { stripeService, type BillingCycle, PLAN_PRICING } from '@/features/billing/services/stripe.service'
import { LogoUpload } from '@/features/organization/components/LogoUpload'

type SettingsTab = 'organization' | 'locations' | 'users' | 'billing' | 'notifications' | 'appearance' | 'security'

const getSettingsSections = (t: ReturnType<typeof useTranslations>) => [
  { id: 'organization' as SettingsTab, icon: Building2, label: t.settings.organization, color: 'blue' },
  { id: 'locations' as SettingsTab, icon: MapPin, label: t.settings.locations, color: 'green' },
  { id: 'users' as SettingsTab, icon: Users, label: t.settings.users, color: 'purple' },
  { id: 'billing' as SettingsTab, icon: CreditCard, label: t.settings.billing, color: 'orange' },
  { id: 'notifications' as SettingsTab, icon: Bell, label: t.settings.notifications, color: 'pink' },
  { id: 'appearance' as SettingsTab, icon: Palette, label: t.settings.appearance, color: 'teal' },
  { id: 'security' as SettingsTab, icon: Shield, label: t.settings.security, color: 'red' },
]

export default function SettingsPage() {
  const t = useTranslations()
  const { locale, setLocale } = useI18n()

  const [activeTab, setActiveTab] = useState<SettingsTab>('organization')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [settings, setSettings] = useState<OrganizationSettings>({})
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Form state
  const [orgName, setOrgName] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgAddress, setOrgAddress] = useState('')
  const [orgCity, setOrgCity] = useState('')
  const [orgState, setOrgState] = useState('')
  const [orgZipCode, setOrgZipCode] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const org = await organizationService.getCurrentUserOrg()

      if (org) {
        setOrganization(org)
        setOrgName(org.name || '')
        setOrgEmail(org.email || '')
        setOrgPhone(org.phone || '')
        setOrgAddress(org.address || '')
        setOrgCity(org.city || '')
        setOrgState(org.state || '')
        setOrgZipCode(org.zip_code || '')
        setSettings((org.settings as OrganizationSettings) || {})

        // Load subscription details
        const subDetails = await subscriptionService.getDetails(org.id)
        setSubscription(subDetails)
      }
    } catch (error) {
      console.error('Error loading organization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveOrganization() {
    if (!organization) return

    try {
      setIsSaving(true)
      const updated = await organizationService.update(organization.id, {
        name: orgName,
        email: orgEmail,
        phone: orgPhone,
        address: orgAddress,
        city: orgCity,
        state: orgState,
        zip_code: orgZipCode,
      })
      setOrganization(updated)
    } catch (error) {
      console.error('Error saving organization:', error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveNotifications(key: keyof OrganizationSettings, value: boolean) {
    if (!organization) return

    try {
      const updated = await organizationService.updateSettings(organization.id, { [key]: value })
      setSettings((updated.settings as OrganizationSettings) || {})
    } catch (error) {
      console.error('Error saving notification settings:', error)
    }
  }

  async function handleSaveTheme(theme: 'light' | 'dark' | 'system') {
    if (!organization) return

    try {
      await organizationService.updateSettings(organization.id, { theme })
      setSettings(prev => ({ ...prev, theme }))
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  function handleLogoChange(url: string | null) {
    if (organization) {
      setOrganization({ ...organization, logo_url: url || null })
    }
  }

  async function handleSelectPlan(plan: 'starter' | 'professional' | 'enterprise') {
    if (!organization) return

    // If already on this plan, don't do anything
    if (organization.plan === plan) return

    setIsCheckingOut(true)
    setCheckoutError(null)

    try {
      const result = await stripeService.createSubscriptionCheckout({
        organizationId: organization.id,
        plan,
        billingCycle,
        customerEmail: organization.email || undefined,
        customerName: organization.name || undefined,
      })

      if (result.error) {
        setCheckoutError(result.error)
        return
      }

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Error selecting plan:', error)
      setCheckoutError('Error al procesar. Intente de nuevo.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  async function handleManageSubscription() {
    if (!organization) return

    setIsCheckingOut(true)
    setCheckoutError(null)

    try {
      const result = await stripeService.openCustomerPortal(organization.id)

      if (result.error) {
        setCheckoutError(result.error)
        return
      }

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Error opening portal:', error)
      setCheckoutError('Error al abrir el portal. Intente de nuevo.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const languageOptions = SUPPORTED_LOCALES.map((loc) => ({
    value: loc,
    label: LOCALE_NAMES[loc as Locale],
  }))

  const themeOptions = [
    { value: 'light', label: t.settings.lightMode },
    { value: 'dark', label: t.settings.darkMode },
    { value: 'system', label: t.settings.systemDefault },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
      teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' },
    }
    return colors[color] || colors.blue
  }

  const getPlanBadgeColor = (plan: string | null | undefined) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-600'
      case 'professional': return 'bg-blue-100 text-blue-600'
      case 'starter': return 'bg-green-100 text-green-600'
      case 'trial': return 'bg-yellow-100 text-yellow-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getPlanIcon = (plan: string | null | undefined) => {
    switch (plan) {
      case 'enterprise': return Crown
      case 'professional': return Sparkles
      default: return CheckCircle
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trial Warning Banner */}
      {subscription?.isTrial && subscription.daysRemaining <= 7 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Tu período de prueba termina en {subscription.daysRemaining} días
            </p>
            <p className="text-sm text-yellow-700">
              Actualiza tu plan para continuar usando todas las funcionalidades.
            </p>
          </div>
          <GlassButton variant="primary" size="sm" onClick={() => setActiveTab('billing')}>
            Ver Planes
          </GlassButton>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t.settings.title}
        </h1>
        <p className="text-gray-500">
          {t.settings.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation - Mobile Horizontal Scroll */}
        <div className="lg:col-span-1">
          <GlassCard className="p-2">
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {getSettingsSections(t).map((section) => {
                const Icon = section.icon
                const colors = getColorClasses(section.color)
                const isActive = activeTab === section.id

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl whitespace-nowrap transition-all w-full
                      ${isActive
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:bg-blue-50'
                      }
                    `}
                  >
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <span className={`flex-1 text-left ${isActive ? 'font-medium' : ''}`}>
                      {section.label}
                    </span>
                    <ChevronRight className="w-4 h-4 hidden lg:block" />
                  </button>
                )
              })}
            </div>
          </GlassCard>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* Organization Settings */}
          {activeTab === 'organization' && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>{t.settings.organizationSettings}</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="flex flex-col items-center pb-6 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Logo de la Organización</h4>
                  <LogoUpload
                    currentLogoUrl={organization?.logo_url}
                    onLogoChange={handleLogoChange}
                    organizationId={organization?.id}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.organizationName}
                    </label>
                    <GlassInput
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.email}
                    </label>
                    <GlassInput
                      type="email"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.phone}
                    </label>
                    <GlassInput
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.licenseNumber}
                    </label>
                    <GlassInput
                      value={organization?.license_number || ''}
                      disabled
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Dirección</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección
                      </label>
                      <GlassInput
                        value={orgAddress}
                        onChange={(e) => setOrgAddress(e.target.value)}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ciudad
                      </label>
                      <GlassInput
                        value={orgCity}
                        onChange={(e) => setOrgCity(e.target.value)}
                        placeholder="Orlando"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado
                        </label>
                        <GlassInput
                          value={orgState}
                          onChange={(e) => setOrgState(e.target.value)}
                          placeholder="FL"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP
                        </label>
                        <GlassInput
                          value={orgZipCode}
                          onChange={(e) => setOrgZipCode(e.target.value)}
                          placeholder="32801"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">{t.settings.dcfCertifications}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900">{t.settings.dcfLicense}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {organization?.license_number
                          ? `${t.settings.licenseNumberLabel}: ${organization.license_number}`
                          : t.settings.notRegistered}
                      </p>
                    </div>
                    {settings.has_gold_seal && (
                      <div className="p-4 bg-yellow-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🏆</span>
                          <span className="font-medium text-gray-900">{t.settings.goldSeal}</span>
                        </div>
                        <p className="text-sm text-gray-600">{t.settings.qualityCertificationActive}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <GlassButton variant="primary" onClick={handleSaveOrganization} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {t.common.save}
                  </GlassButton>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Locations Settings */}
          {activeTab === 'locations' && (
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <GlassCardTitle>{t.settings.locations}</GlassCardTitle>
                  <GlassButton variant="primary" size="sm">
                    {t.settings.addLocation}
                  </GlassButton>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="p-4 border border-blue-100 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{organization?.name || t.settings.mainCenter}</h4>
                        <p className="text-sm text-gray-500">
                          {organization?.address
                            ? `${organization.address}, ${organization.city || ''}, ${organization.state || ''} ${organization.zip_code || ''}`
                            : t.settings.addressNotConfigured}
                        </p>
                      </div>
                    </div>
                    <GlassButton variant="ghost" size="sm">
                      {t.common.edit}
                    </GlassButton>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">{t.settings.phone}:</span>
                      <p className="text-gray-900">{organization?.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t.settings.schedule}:</span>
                      <p className="text-gray-900">{settings.opening_time || '6:30 AM'} - {settings.closing_time || '6:30 PM'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t.settings.capacity}:</span>
                      <p className="text-gray-900">{settings.capacity || 150} {t.settings.capacityChildren}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t.settings.email}:</span>
                      <p className="text-gray-900">{organization?.email || '-'}</p>
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>{t.settings.notificationSettings}</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                {[
                  { key: 'notification_email' as const, label: t.settings.emailNotifications, description: t.settings.emailNotificationsDesc, enabled: settings.notification_email !== false },
                  { key: 'notification_sms' as const, label: t.settings.smsNotifications, description: t.settings.smsNotificationsDesc, enabled: settings.notification_sms === true },
                  { key: 'notification_push' as const, label: t.settings.pushNotifications, description: t.settings.pushNotificationsDesc, enabled: settings.notification_push !== false },
                ].map((notification) => (
                  <div key={notification.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{notification.label}</p>
                      <p className="text-sm text-gray-500">{notification.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notification.enabled}
                        onChange={(e) => handleSaveNotifications(notification.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                ))}
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>{t.settings.appearance}</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.settings.language}
                  </label>
                  <GlassSelect
                    options={languageOptions}
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as Locale)}
                    className="w-full max-w-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.settings.theme}
                  </label>
                  <GlassSelect
                    options={themeOptions}
                    value={settings.theme || 'light'}
                    onChange={(e) => handleSaveTheme(e.target.value as 'light' | 'dark' | 'system')}
                    className="w-full max-w-xs"
                  />
                </div>

                <div className="flex justify-end">
                  <GlassButton variant="primary">
                    {t.common.save}
                  </GlassButton>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>{t.settings.security}</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="p-4 border border-blue-100 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-2">{t.settings.changePassword}</h4>
                  <p className="text-sm text-gray-500 mb-4">{t.settings.changePasswordDesc}</p>
                  <GlassButton variant="secondary">
                    {t.settings.changePassword}
                  </GlassButton>
                </div>

                <div className="p-4 border border-blue-100 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-2">{t.settings.twoFactorAuth}</h4>
                  <p className="text-sm text-gray-500 mb-4">{t.settings.twoFactorAuthDesc}</p>
                  <GlassButton variant="secondary">
                    {t.settings.enable2FA}
                  </GlassButton>
                </div>

                <div className="p-4 border border-blue-100 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-2">{t.settings.sessions}</h4>
                  <p className="text-sm text-gray-500 mb-4">{t.settings.sessionsDesc}</p>
                  <GlassButton variant="ghost" className="text-red-500">
                    {t.settings.logoutAllSessions}
                  </GlassButton>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Users Settings */}
          {activeTab === 'users' && (
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <GlassCardTitle>{t.settings.userManagement}</GlassCardTitle>
                  <GlassButton variant="primary" size="sm">
                    {t.settings.addUser}
                  </GlassButton>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-gray-500 text-center py-8">
                  {t.settings.userManagementDescription}
                </p>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan Card */}
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>{t.settings.billingSettings}</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="p-4 border border-blue-100 rounded-xl mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const PlanIcon = getPlanIcon(organization?.plan)
                          return (
                            <div className={`w-12 h-12 rounded-xl ${getPlanBadgeColor(organization?.plan)} flex items-center justify-center`}>
                              <PlanIcon className="w-6 h-6" />
                            </div>
                          )
                        })()}
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Plan {organization?.plan?.charAt(0).toUpperCase()}{organization?.plan?.slice(1) || 'Trial'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {subscription?.isTrial
                              ? `Prueba gratis - ${subscription.daysRemaining} días restantes`
                              : subscription?.isActive
                                ? 'Suscripción activa'
                                : 'Suscripción inactiva'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(organization?.plan)}`}>
                        {subscription?.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Usage Limits */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Niños</p>
                        <p className="font-semibold text-gray-900">
                          -- / {organization?.max_children || 15}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Staff</p>
                        <p className="font-semibold text-gray-900">
                          -- / {organization?.max_staff || 3}
                        </p>
                      </div>
                    </div>

                    {subscription?.isTrial && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg mb-4">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Tu prueba termina el {subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : '--'}
                        </p>
                      </div>
                    )}
                  </div>

                  {checkoutError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <p className="text-sm text-red-600">{checkoutError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <GlassButton
                      variant="primary"
                      onClick={() => setActiveTab('billing')}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      {subscription?.isTrial ? 'Elegir Plan' : t.settings.upgradePlan}
                    </GlassButton>
                    {!subscription?.isTrial && subscription?.isActive && (
                      <GlassButton
                        variant="secondary"
                        onClick={handleManageSubscription}
                        disabled={isCheckingOut}
                      >
                        Gestionar Suscripción
                      </GlassButton>
                    )}
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Available Plans */}
              <GlassCard>
                <GlassCardHeader>
                  <div className="flex items-center justify-between">
                    <GlassCardTitle>Planes Disponibles</GlassCardTitle>
                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          billingCycle === 'monthly'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Mensual
                      </button>
                      <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          billingCycle === 'annual'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Anual
                        <span className="ml-1 text-xs text-green-600 font-semibold">-17%</span>
                      </button>
                    </div>
                  </div>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Starter */}
                    <div className={`p-4 border rounded-xl ${organization?.plan === 'starter' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Starter</h4>
                        {organization?.plan === 'starter' && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Actual</span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        ${billingCycle === 'monthly' ? PLAN_PRICING.starter.monthly : Math.round(PLAN_PRICING.starter.annual / 12)}
                        <span className="text-sm font-normal text-gray-500">/mes</span>
                      </p>
                      {billingCycle === 'annual' && (
                        <p className="text-xs text-green-600 mb-2">
                          ${PLAN_PRICING.starter.annual}/año (ahorra ${PLAN_PRICING.starter.monthly * 12 - PLAN_PRICING.starter.annual})
                        </p>
                      )}
                      <ul className="text-sm text-gray-600 space-y-1 mb-4">
                        <li>• Hasta 25 niños</li>
                        <li>• 5 usuarios staff</li>
                        <li>• Asistencia básica</li>
                        <li>• Reportes esenciales</li>
                      </ul>
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        fullWidth
                        disabled={organization?.plan === 'starter' || isCheckingOut}
                        onClick={() => handleSelectPlan('starter')}
                      >
                        {isCheckingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : organization?.plan === 'starter' ? (
                          'Plan Actual'
                        ) : (
                          'Seleccionar'
                        )}
                      </GlassButton>
                    </div>

                    {/* Professional */}
                    <div className={`p-4 border-2 rounded-xl ${organization?.plan === 'professional' ? 'border-blue-500 bg-blue-50' : 'border-blue-300'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Professional</h4>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Popular</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        ${billingCycle === 'monthly' ? PLAN_PRICING.professional.monthly : Math.round(PLAN_PRICING.professional.annual / 12)}
                        <span className="text-sm font-normal text-gray-500">/mes</span>
                      </p>
                      {billingCycle === 'annual' && (
                        <p className="text-xs text-green-600 mb-2">
                          ${PLAN_PRICING.professional.annual}/año (ahorra ${PLAN_PRICING.professional.monthly * 12 - PLAN_PRICING.professional.annual})
                        </p>
                      )}
                      <ul className="text-sm text-gray-600 space-y-1 mb-4">
                        <li>• Hasta 70 niños</li>
                        <li>• 10 usuarios staff</li>
                        <li>• Facturación integrada</li>
                        <li>• Comunicación con padres</li>
                        <li>• Reportes DCF</li>
                      </ul>
                      <GlassButton
                        variant="primary"
                        size="sm"
                        fullWidth
                        disabled={organization?.plan === 'professional' || isCheckingOut}
                        onClick={() => handleSelectPlan('professional')}
                      >
                        {isCheckingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : organization?.plan === 'professional' ? (
                          'Plan Actual'
                        ) : (
                          'Seleccionar'
                        )}
                      </GlassButton>
                    </div>

                    {/* Enterprise */}
                    <div className={`p-4 border rounded-xl ${organization?.plan === 'enterprise' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Enterprise</h4>
                        {organization?.plan === 'enterprise' && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">Actual</span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        ${billingCycle === 'monthly' ? PLAN_PRICING.enterprise.monthly : Math.round(PLAN_PRICING.enterprise.annual / 12)}
                        <span className="text-sm font-normal text-gray-500">/mes</span>
                      </p>
                      {billingCycle === 'annual' && (
                        <p className="text-xs text-green-600 mb-2">
                          ${PLAN_PRICING.enterprise.annual}/año (ahorra ${PLAN_PRICING.enterprise.monthly * 12 - PLAN_PRICING.enterprise.annual})
                        </p>
                      )}
                      <ul className="text-sm text-gray-600 space-y-1 mb-4">
                        <li>• Niños ilimitados</li>
                        <li>• Staff ilimitado</li>
                        <li>• Multi-ubicación</li>
                        <li>• Soporte prioritario</li>
                        <li>• API Access</li>
                      </ul>
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        fullWidth
                        disabled={organization?.plan === 'enterprise' || isCheckingOut}
                        onClick={() => handleSelectPlan('enterprise')}
                      >
                        {isCheckingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : organization?.plan === 'enterprise' ? (
                          'Plan Actual'
                        ) : (
                          'Seleccionar'
                        )}
                      </GlassButton>
                    </div>
                  </div>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    Todos los planes incluyen 14 días de prueba gratis. Ahorra 2 meses con facturación anual.
                  </p>
                </GlassCardContent>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
