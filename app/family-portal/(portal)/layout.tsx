'use client'

import { PortalLayout } from '@/features/family-portal/components/portal-layout'

export default function PortalPagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortalLayout>{children}</PortalLayout>
}
