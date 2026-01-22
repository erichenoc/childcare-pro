'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Award,
  ArrowLeft,
  Eye,
  Calendar,
  TrendingUp,
  Loader2,
  GraduationCap,
  FileWarning,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassBadge,
  GlassAvatar,
  GlassTable,
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHead,
  GlassTableCell,
  GlassTableEmpty,
} from '@/shared/components/ui'
import { staffService } from '@/features/staff/services/staff.service'
import {
  certificationService,
  type CertificationWithProfile,
  type ComplianceResult,
} from '@/features/staff/services/certification.service'
import type { Profile } from '@/shared/types/database.types'

interface StaffWithCompliance extends Profile {
  compliance: ComplianceResult
}

export default function StaffCompliancePage() {
  const t = useTranslations()
  const { formatDate } = useI18n()

  const [staffList, setStaffList] = useState<StaffWithCompliance[]>([])
  const [expiring, setExpiring] = useState<CertificationWithProfile[]>([])
  const [expired, setExpired] = useState<CertificationWithProfile[]>([])
  const [stats, setStats] = useState({
    totalStaff: 0,
    compliantCount: 0,
    complianceRate: 0,
    expiringSoon: 0,
    missingTraining: 0,
    expiredCerts: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)

      // Load staff
      const staff = await staffService.getAll()

      // Load compliance for each staff member
      const staffWithCompliance: StaffWithCompliance[] = await Promise.all(
        staff.map(async (member) => {
          const compliance = await certificationService.checkCompliance(member.id)
          return { ...member, compliance }
        })
      )

      // Sort by compliance score (lowest first for attention)
      staffWithCompliance.sort((a, b) => a.compliance.compliance_score - b.compliance.compliance_score)

      // Load expiring and expired certifications
      const [expiringData, expiredData, statsData] = await Promise.all([
        certificationService.getExpiring(30),
        certificationService.getExpired(),
        certificationService.getComplianceStats(),
      ])

      setStaffList(staffWithCompliance)
      setExpiring(expiringData)
      setExpired(expiredData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading compliance data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function getComplianceColor(score: number) {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getComplianceBgColor(score: number) {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
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
          <Link href="/dashboard/staff">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Cumplimiento DCF
            </h1>
            <p className="text-gray-500">
              Estado de certificaciones y entrenamientos del personal
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
              <p className="text-sm text-gray-500">Total Staff</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.compliantCount}</p>
              <p className="text-sm text-gray-500">Cumpliendo</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.complianceRate}%</p>
              <p className="text-sm text-gray-500">Tasa Cumplimiento</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
              <p className="text-sm text-gray-500">Por Vencer</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.missingTraining}</p>
              <p className="text-sm text-gray-500">Entrenam. Faltante</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <FileWarning className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiredCerts}</p>
              <p className="text-sm text-gray-500">Certs Expirados</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Staff Compliance List */}
        <div className="lg:col-span-2">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Estado de Cumplimiento por Empleado
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="p-0">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableHead>Empleado</GlassTableHead>
                    <GlassTableHead className="text-center">Puntaje</GlassTableHead>
                    <GlassTableHead>Estado</GlassTableHead>
                    <GlassTableHead>Problemas</GlassTableHead>
                    <GlassTableHead className="text-right">Acciones</GlassTableHead>
                  </GlassTableRow>
                </GlassTableHeader>
                <GlassTableBody>
                  {staffList.length === 0 ? (
                    <GlassTableEmpty title="No hay personal registrado" />
                  ) : (
                    staffList.map((member) => (
                      <GlassTableRow key={member.id}>
                        <GlassTableCell>
                          <div className="flex items-center gap-3">
                            <GlassAvatar name={`${member.first_name} ${member.last_name}`} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.first_name} {member.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{member.role}</p>
                            </div>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`text-lg font-bold ${getComplianceColor(member.compliance.compliance_score)}`}>
                              {member.compliance.compliance_score}%
                            </span>
                            <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getComplianceBgColor(member.compliance.compliance_score)}`}
                                style={{ width: `${member.compliance.compliance_score}%` }}
                              />
                            </div>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>
                          {member.compliance.is_compliant ? (
                            <GlassBadge variant="success" size="sm">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Cumple
                            </GlassBadge>
                          ) : (
                            <GlassBadge variant="error" size="sm">
                              <XCircle className="w-3 h-3 mr-1" />
                              Pendiente
                            </GlassBadge>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.compliance.missing_requirements.slice(0, 2).map((req, idx) => (
                              <span key={idx} className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                {req.length > 20 ? req.substring(0, 20) + '...' : req}
                              </span>
                            ))}
                            {member.compliance.missing_requirements.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{member.compliance.missing_requirements.length - 2} más
                              </span>
                            )}
                            {member.compliance.expiring_soon.slice(0, 1).map((exp, idx) => (
                              <span key={idx} className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                                {exp.length > 20 ? exp.substring(0, 20) + '...' : exp}
                              </span>
                            ))}
                          </div>
                        </GlassTableCell>
                        <GlassTableCell className="text-right">
                          <Link href={`/dashboard/staff/${member.id}/certifications`}>
                            <GlassButton variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </GlassButton>
                          </Link>
                        </GlassTableCell>
                      </GlassTableRow>
                    ))
                  )}
                </GlassTableBody>
              </GlassTable>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Expiring Soon */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-yellow-700">
                <Clock className="w-5 h-5" />
                Por Vencer (30 días)
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {expiring.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No hay certificaciones por vencer
                </p>
              ) : (
                <div className="space-y-3">
                  {expiring.slice(0, 5).map((cert) => (
                    <div key={cert.id} className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {cert.profile?.first_name} {cert.profile?.last_name}
                          </p>
                          <p className="text-xs text-gray-600">{cert.certification_name}</p>
                        </div>
                        <GlassBadge variant="warning" size="sm">
                          {formatDate(cert.expiration_date!)}
                        </GlassBadge>
                      </div>
                    </div>
                  ))}
                  {expiring.length > 5 && (
                    <p className="text-sm text-center text-gray-500">
                      +{expiring.length - 5} más
                    </p>
                  )}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Expired */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Expirados
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {expired.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    No hay certificaciones expiradas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expired.slice(0, 5).map((cert) => (
                    <div key={cert.id} className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {cert.profile?.first_name} {cert.profile?.last_name}
                          </p>
                          <p className="text-xs text-gray-600">{cert.certification_name}</p>
                        </div>
                        <GlassBadge variant="error" size="sm">
                          Expiró {formatDate(cert.expiration_date!)}
                        </GlassBadge>
                      </div>
                    </div>
                  ))}
                  {expired.length > 5 && (
                    <p className="text-sm text-center text-gray-500">
                      +{expired.length - 5} más
                    </p>
                  )}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Acciones Rápidas
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-2">
              <Link href="/dashboard/staff/training" className="block">
                <GlassButton variant="secondary" className="w-full justify-start">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Registrar Horas In-Service
                </GlassButton>
              </Link>
              <Link href="/dashboard/reports" className="block">
                <GlassButton variant="secondary" className="w-full justify-start">
                  <FileWarning className="w-4 h-4 mr-2" />
                  Generar Reporte DCF
                </GlassButton>
              </Link>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
