'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Syringe,
  Baby,
  Calendar,
  AlertCircle,
  Info,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
} from '@/shared/components/ui'
import { immunizationsService } from '@/features/immunizations/services/immunizations.service'
import type { DcfVaccineRequirement } from '@/shared/types/immunizations'

export default function DcfRequirementsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [requirements, setRequirements] = useState<DcfVaccineRequirement[]>([])

  useEffect(() => {
    loadRequirements()
  }, [])

  async function loadRequirements() {
    try {
      setIsLoading(true)
      const data = await immunizationsService.getVaccineRequirements()
      setRequirements(data)
    } catch (error) {
      console.error('Error loading requirements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Group requirements by age range
  const groupedRequirements = requirements.reduce((acc, req) => {
    const ageKey = `${req.min_age_months}-${req.max_age_months || '+'}`
    if (!acc[ageKey]) {
      acc[ageKey] = {
        minAge: req.min_age_months,
        maxAge: req.max_age_months,
        vaccines: [],
      }
    }
    acc[ageKey].vaccines.push(req)
    return acc
  }, {} as Record<string, { minAge: number; maxAge: number | null; vaccines: DcfVaccineRequirement[] }>)

  const formatAgeRange = (minMonths: number, maxMonths: number | null): string => {
    const formatMonths = (months: number) => {
      if (months < 12) return `${months} months`
      const years = Math.floor(months / 12)
      const remainingMonths = months % 12
      if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
      return `${years}y ${remainingMonths}m`
    }

    if (maxMonths === null) return `${formatMonths(minMonths)} and older`
    if (minMonths === maxMonths) return formatMonths(minMonths)
    return `${formatMonths(minMonths)} to ${formatMonths(maxMonths)}`
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/immunizations">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-primary-600" />
              DCF Immunization Requirements
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Florida Department of Children and Families vaccine schedule
            </p>
          </div>
        </div>

        <a
          href="https://www.floridahealth.gov/programs-and-services/immunization/children-and-adolescents/school-immunization-requirements/index.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GlassButton variant="secondary" rightIcon={<ExternalLink className="w-4 h-4" />}>
            Official DCF Guide
          </GlassButton>
        </a>
      </div>

      {/* Info Banner */}
      <GlassCard className="border-l-4 border-l-blue-500">
        <GlassCardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Important Information
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                These requirements are based on Florida DCF regulations for licensed child care facilities.
                All children attending licensed child care in Florida must meet these immunization
                requirements or have an approved exemption on file.
              </p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Requirements by Age */}
      <div className="space-y-6">
        {Object.entries(groupedRequirements)
          .sort((a, b) => a[1].minAge - b[1].minAge)
          .map(([key, group]) => (
            <GlassCard key={key}>
              <GlassCardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                    <Baby className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <GlassCardTitle>
                      {formatAgeRange(group.minAge, group.maxAge)}
                    </GlassCardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {group.vaccines.length} required vaccines
                    </p>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.vaccines.map((vaccine) => (
                    <div
                      key={vaccine.id}
                      className="p-4 rounded-xl shadow-neu dark:shadow-neu-dark"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <Syringe className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {vaccine.vaccine_name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Code: {vaccine.vaccine_code}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <Calendar className="w-3 h-3" />
                              {vaccine.required_doses} dose{vaccine.required_doses > 1 ? 's' : ''} required
                            </span>
                          </div>
                          {vaccine.notes && (
                            <p className="text-xs text-gray-400 mt-2 italic">
                              {vaccine.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
      </div>

      {/* Exemptions Info */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <GlassCardTitle>Exemptions</GlassCardTitle>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Medical Exemption
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Requires a signed statement from a licensed physician (MD or DO)
                indicating that specific immunizations would be harmful to the child.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                Religious Exemption
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Parents must provide a signed religious exemption form stating that
                immunizations are against their religious beliefs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                Temporary/Provisional
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Children may be enrolled provisionally for up to 30 days while
                obtaining required immunizations or documentation.
              </p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Quick Reference */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Quick Reference - Common Vaccines</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Vaccine</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Full Name</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Doses</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Age Range</th>
                </tr>
              </thead>
              <tbody>
                {requirements.slice(0, 10).map((req) => (
                  <tr key={req.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium text-primary-600 dark:text-primary-400">
                      {req.vaccine_code}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {req.vaccine_name}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {req.required_doses}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                      {formatAgeRange(req.min_age_months, req.max_age_months)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
