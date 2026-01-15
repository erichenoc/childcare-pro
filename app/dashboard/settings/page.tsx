'use client'

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
  const [settings, setSettings] = useState<OrganizationSettings>({})

  // Form state
  const [orgName, setOrgName] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgAddress, setOrgAddress] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const org = await organizationService.get()

      if (org) {
        setOrganization(org)
        setOrgName(org.name || '')
        setOrgEmail(org.email || '')
        setOrgPhone(org.phone || '')
        setOrgAddress(org.address || '')
        setSettings((org.settings as OrganizationSettings) || {})
      }
    } catch (error) {
      console.error('Error loading organization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveOrganization() {
    try {
      setIsSaving(true)
      await organizationService.update({
        name: orgName,
        email: orgEmail,
        phone: orgPhone,
        address: orgAddress,
      })
      // Show success (could use a toast)
    } catch (error) {
      console.error('Error saving organization:', error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveNotifications(key: keyof OrganizationSettings, value: boolean) {
    try {
      await organizationService.updateSettings({ [key]: value })
      setSettings(prev => ({ ...prev, [key]: value }))
    } catch (error) {
      console.error('Error saving notification settings:', error)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

                <div className="pt-4 border-t border-blue-100">
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
                    onChange={(e) => organizationService.updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
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
                  <GlassButton variant="secondary" className="text-red-500">
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
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>{t.settings.billingSettings}</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="p-4 border border-blue-100 rounded-xl mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{t.settings.currentPlan}</h4>
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {organization?.subscription_plan || 'Pro'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {organization?.subscription_status === 'active' ? t.settings.subscriptionActive : `${t.settings.subscriptionStatus}: ${organization?.subscription_status || t.common.active.toLowerCase()}`}
                  </p>
                </div>

                <div className="flex gap-3">
                  <GlassButton variant="secondary">
                    {t.settings.upgradePlan}
                  </GlassButton>
                  <GlassButton variant="ghost" className="text-red-500">
                    {t.settings.cancelSubscription}
                  </GlassButton>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
