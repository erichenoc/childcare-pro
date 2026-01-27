'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Building2, Users, Lock, Gift } from 'lucide-react'
import { LanguageSwitcher } from '@/shared/components/language-switcher'
import { useI18n } from '@/shared/lib/i18n'

const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1768428103/ChildCarePro_Logo_1_f0gqth.png'

export function CityNav() {
  const { t } = useI18n()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="neu rounded-neu-full px-4 sm:px-6 py-2 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            {/* LOGO - Grande pero contenedor compacto */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16">
              <Image
                src={LOGO_URL}
                alt="ChildCare Pro"
                fill
                sizes="(max-width: 640px) 56px, 64px"
                className="object-contain drop-shadow-lg scale-150 transition-transform duration-300 group-hover:scale-[1.6]"
              />
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="compact" className="hidden sm:flex" />
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-gray-900 transition px-3 py-2 text-sm font-medium"
            >
              <Building2 className="w-4 h-4" />
              Home
            </Link>
            <Link
              href="/family-portal/login"
              className="hidden sm:flex items-center gap-2 text-purple-600 hover:text-purple-700 transition px-3 py-2 text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              {t.parentPortal.title}
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition px-3 py-2 text-sm font-medium"
            >
              <Lock className="w-4 h-4" />
              {t.auth.signIn}
            </Link>
            <Link
              href="/register"
              className="btn-neu-primary px-4 sm:px-6 py-2.5 rounded-neu-full text-sm font-semibold flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              {t.landing.freeTrial}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
