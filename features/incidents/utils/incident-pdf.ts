import type { IncidentWithDetails } from '../services/incidents-enhanced.service'

interface OrganizationInfo {
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  phone?: string | null
  email?: string | null
  logo_url?: string | null
  license_number?: string | null
}

export interface IncidentPDFData {
  incident: IncidentWithDetails
  organization: OrganizationInfo
}

/**
 * Format date for display
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format time for display
 */
function formatTime(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format datetime for display
 */
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get incident type label in Spanish
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    injury: 'Lesión/Accidente',
    illness: 'Enfermedad',
    behavioral: 'Comportamiento',
    medication: 'Medicación',
    property_damage: 'Daño a Propiedad',
    security: 'Seguridad',
    other: 'Otro',
  }
  return labels[type] || type
}

/**
 * Get severity label and color
 */
function getSeverityInfo(severity: string): { label: string; color: string; bgColor: string } {
  const info: Record<string, { label: string; color: string; bgColor: string }> = {
    minor: { label: 'Menor', color: '#166534', bgColor: '#dcfce7' },
    moderate: { label: 'Moderado', color: '#ca8a04', bgColor: '#fef9c3' },
    serious: { label: 'Serio', color: '#ea580c', bgColor: '#ffedd5' },
    critical: { label: 'Crítico', color: '#dc2626', bgColor: '#fee2e2' },
  }
  return info[severity] || { label: severity, color: '#6b7280', bgColor: '#f3f4f6' }
}

/**
 * Get status label in Spanish
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: 'Abierto',
    pending_signature: 'Pendiente de Firma',
    pending_closure: 'Pendiente de Cierre',
    closed: 'Cerrado',
  }
  return labels[status] || status
}

/**
 * Get notification method label
 */
function getNotificationMethodLabel(method: string | null): string {
  if (!method) return 'N/A'
  const labels: Record<string, string> = {
    phone: 'Teléfono',
    in_person: 'En Persona',
    email: 'Correo Electrónico',
    text: 'Mensaje de Texto',
  }
  return labels[method] || method
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: string | null): string {
  if (!dob) return 'N/A'
  const today = new Date()
  const birthDate = new Date(dob)
  const months = (today.getFullYear() - birthDate.getFullYear()) * 12 +
                 (today.getMonth() - birthDate.getMonth())

  if (months < 12) {
    return `${months} ${months === 1 ? 'mes' : 'meses'}`
  }
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'año' : 'años'}`
}

/**
 * Generate professional incident report HTML
 */
export function generateIncidentHTML(data: IncidentPDFData): string {
  const { incident, organization } = data
  const severityInfo = getSeverityInfo(incident.severity)

  const orgAddress = [
    organization.address,
    organization.city,
    organization.state,
    organization.zip,
  ].filter(Boolean).join(', ')

  const childName = incident.child
    ? `${incident.child.first_name} ${incident.child.last_name}`
    : 'N/A'

  const reportingTeacher = incident.reporting_teacher
    ? `${incident.reporting_teacher.first_name} ${incident.reporting_teacher.last_name}`
    : 'N/A'

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Incidente ${incident.incident_number || ''}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      background: #fff;
      padding: 30px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #1e40af;
    }

    .logo-section {
      flex: 1;
    }

    .logo {
      max-height: 50px;
      margin-bottom: 8px;
    }

    .company-info h1 {
      font-size: 20px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 4px;
    }

    .company-info p {
      font-size: 11px;
      color: #6b7280;
      margin: 2px 0;
    }

    .report-title {
      text-align: right;
    }

    .report-title h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .report-title .incident-number {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }

    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
      background: ${severityInfo.bgColor};
      color: ${severityInfo.color};
      border: 1px solid ${severityInfo.color};
    }

    .section {
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .section-header {
      background: #f3f4f6;
      padding: 10px 15px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-content {
      padding: 15px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .info-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }

    .info-item label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .info-item p {
      font-size: 13px;
      color: #1f2937;
    }

    .info-item p.highlight {
      font-weight: 600;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .description-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      font-size: 13px;
      color: #1f2937;
      white-space: pre-wrap;
      min-height: 80px;
    }

    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }

    .checkbox {
      width: 16px;
      height: 16px;
      border: 2px solid #d1d5db;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .checkbox.checked {
      background: #1e40af;
      border-color: #1e40af;
      color: white;
    }

    .checkbox.checked::after {
      content: '✓';
      font-size: 11px;
      font-weight: bold;
    }

    .signature-section {
      margin-top: 30px;
      border: 2px solid #1e40af;
      border-radius: 8px;
      overflow: hidden;
    }

    .signature-header {
      background: #1e40af;
      color: white;
      padding: 12px 15px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .signature-content {
      padding: 20px;
    }

    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 20px;
    }

    .signature-box {
      border-bottom: 2px solid #1f2937;
      padding-bottom: 8px;
      min-height: 60px;
      display: flex;
      align-items: flex-end;
    }

    .signature-box img {
      max-height: 50px;
      max-width: 200px;
    }

    .signature-label {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }

    .confirmation-text {
      font-size: 12px;
      color: #4b5563;
      font-style: italic;
      margin-top: 15px;
      padding: 10px;
      background: #f9fafb;
      border-radius: 4px;
      text-align: center;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #9ca3af;
    }

    .copy-indicator {
      display: flex;
      gap: 15px;
    }

    .copy-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      background: ${incident.status === 'closed' ? '#dcfce7' : '#fef3c7'};
      color: ${incident.status === 'closed' ? '#166534' : '#92400e'};
    }

    @media print {
      body {
        padding: 15px;
      }

      .section {
        page-break-inside: avoid;
      }

      .signature-section {
        page-break-inside: avoid;
      }

      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="company-info">
        ${organization.logo_url ? `<img src="${organization.logo_url}" alt="${organization.name}" class="logo">` : ''}
        <h1>${organization.name}</h1>
        ${orgAddress ? `<p>${orgAddress}</p>` : ''}
        ${organization.phone ? `<p>Tel: ${organization.phone}</p>` : ''}
        ${organization.license_number ? `<p>Licencia: ${organization.license_number}</p>` : ''}
      </div>
    </div>
    <div class="report-title">
      <h2>Reporte de Incidente</h2>
      <p class="incident-number">${incident.incident_number || 'Sin número'}</p>
      <span class="severity-badge">${severityInfo.label}</span>
    </div>
  </div>

  <!-- Información del Niño -->
  <div class="section">
    <div class="section-header">Información del Niño</div>
    <div class="section-content">
      <div class="info-grid">
        <div class="info-item">
          <label>Nombre Completo</label>
          <p class="highlight">${childName}</p>
        </div>
        <div class="info-item">
          <label>Fecha de Nacimiento</label>
          <p>${formatDate(incident.child?.date_of_birth || null)} (${calculateAge(incident.child?.date_of_birth || null)})</p>
        </div>
        <div class="info-item">
          <label>Salón</label>
          <p>${incident.classroom?.name || 'N/A'}</p>
        </div>
        <div class="info-item">
          <label>Estado</label>
          <p><span class="status-badge">${getStatusLabel(incident.status)}</span></p>
        </div>
      </div>
    </div>
  </div>

  <!-- Detalles del Incidente -->
  <div class="section">
    <div class="section-header">Detalles del Incidente</div>
    <div class="section-content">
      <div class="info-grid-3">
        <div class="info-item">
          <label>Fecha</label>
          <p class="highlight">${formatDate(incident.occurred_at)}</p>
        </div>
        <div class="info-item">
          <label>Hora</label>
          <p class="highlight">${formatTime(incident.occurred_at)}</p>
        </div>
        <div class="info-item">
          <label>Ubicación</label>
          <p>${incident.location || 'No especificada'}</p>
        </div>
      </div>

      <div class="info-grid" style="margin-top: 15px;">
        <div class="info-item">
          <label>Tipo de Incidente</label>
          <div class="checkbox-grid" style="margin-top: 8px;">
            <div class="checkbox-item">
              <span class="checkbox ${incident.incident_type === 'injury' ? 'checked' : ''}"></span>
              Accidente/Lesión
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${incident.incident_type === 'illness' ? 'checked' : ''}"></span>
              Enfermedad
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${incident.incident_type === 'behavioral' ? 'checked' : ''}"></span>
              Comportamiento
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${incident.incident_type === 'medication' ? 'checked' : ''}"></span>
              Medicación
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${incident.incident_type === 'other' ? 'checked' : ''}"></span>
              Otro
            </div>
          </div>
        </div>
        <div class="info-item">
          <label>Severidad</label>
          <div class="checkbox-grid" style="margin-top: 8px;">
            <div class="checkbox-item">
              <span class="checkbox ${incident.severity === 'minor' ? 'checked' : ''}"></span>
              Menor
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${incident.severity === 'moderate' ? 'checked' : ''}"></span>
              Moderado
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${incident.severity === 'serious' ? 'checked' : ''}"></span>
              Serio
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${incident.severity === 'critical' ? 'checked' : ''}"></span>
              Crítico
            </div>
          </div>
        </div>
      </div>

      <div class="info-item full-width" style="margin-top: 15px;">
        <label>Descripción Detallada del Incidente</label>
        <div class="description-box">${incident.description || 'Sin descripción'}</div>
      </div>
    </div>
  </div>

  <!-- Acción Tomada -->
  <div class="section">
    <div class="section-header">Acción Tomada</div>
    <div class="section-content">
      <div class="description-box">${incident.action_taken || 'Sin acción registrada'}</div>
    </div>
  </div>

  <!-- Personal Involucrado -->
  <div class="section">
    <div class="section-header">Personal Involucrado</div>
    <div class="section-content">
      <div class="info-grid">
        <div class="info-item">
          <label>Reportado Por</label>
          <p class="highlight">${reportingTeacher}</p>
        </div>
        <div class="info-item">
          <label>Testigos</label>
          <p>${incident.witness_names?.join(', ') || 'Ninguno registrado'}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Notificación a Padres -->
  <div class="section">
    <div class="section-header">Notificación a Padres/Tutores</div>
    <div class="section-content">
      <div class="info-grid">
        <div class="info-item">
          <label>Padre/Tutor Notificado</label>
          <p class="highlight">${incident.parent_notified ? 'Sí' : 'No'}</p>
        </div>
        <div class="info-item">
          <label>Hora de Notificación</label>
          <p>${formatDateTime(incident.parent_notified_at)}</p>
        </div>
        <div class="info-item">
          <label>Método de Notificación</label>
          <div class="checkbox-grid" style="margin-top: 8px;">
            <div class="checkbox-item">
              <span class="checkbox ${incident.parent_notified_method === 'phone' ? 'checked' : ''}"></span>
              Teléfono
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${incident.parent_notified_method === 'in_person' ? 'checked' : ''}"></span>
              En Persona
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${incident.parent_notified_method === 'email' ? 'checked' : ''}"></span>
              Correo
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${incident.parent_notified_method === 'text' ? 'checked' : ''}"></span>
              Mensaje
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Firma del Padre/Tutor (OBLIGATORIA) -->
  <div class="signature-section">
    <div class="signature-header">
      Firma del Padre/Tutor (Obligatoria)
    </div>
    <div class="signature-content">
      <div class="signature-grid">
        <div>
          <div class="signature-box">
            ${incident.parent_signature_data
              ? `<img src="${incident.parent_signature_data}" alt="Firma del padre/tutor">`
              : ''
            }
          </div>
          <p class="signature-label">Firma del Padre/Tutor</p>
        </div>
        <div>
          <div class="signature-box" style="align-items: center; justify-content: center;">
            <span>${formatDate(incident.parent_signed_at)}</span>
          </div>
          <p class="signature-label">Fecha</p>
        </div>
      </div>

      <div class="info-grid" style="margin-top: 15px;">
        <div class="info-item">
          <label>Nombre del Firmante</label>
          <p class="highlight">${incident.parent_signed_by_name || '________________________'}</p>
        </div>
        <div class="info-item">
          <label>Relación con el Niño</label>
          <p>${incident.parent_signed_by_relationship || '________________________'}</p>
        </div>
      </div>

      <div class="confirmation-text">
        "Confirmo que he sido informado(a) del incidente descrito anteriormente y que he recibido copia de este reporte."
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <p>Documento generado: ${formatDateTime(new Date().toISOString())}</p>
      <p>${organization.name} - Sistema de Gestión ChildCare Pro</p>
    </div>
    <div class="copy-indicator">
      <div class="copy-item">
        <span class="checkbox checked"></span>
        Copia para Daycare
      </div>
      <div class="copy-item">
        <span class="checkbox ${incident.parent_copy_sent ? 'checked' : ''}"></span>
        Copia para Padre/Tutor
      </div>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Open print dialog with incident report
 */
export function printIncidentReport(data: IncidentPDFData): void {
  const html = generateIncidentHTML(data)
  const printWindow = window.open('', '_blank')

  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    // Wait for content and images to load then print
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}

/**
 * Download incident report as HTML file
 */
export function downloadIncidentHTML(data: IncidentPDFData): void {
  const html = generateIncidentHTML(data)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  const incidentNumber = data.incident.incident_number || data.incident.id.slice(0, 8)
  const link = document.createElement('a')
  link.href = url
  link.download = `Reporte-Incidente-${incidentNumber}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate and open incident report for preview
 */
export function previewIncidentReport(data: IncidentPDFData): void {
  const html = generateIncidentHTML(data)
  const previewWindow = window.open('', '_blank')

  if (previewWindow) {
    previewWindow.document.write(html)
    previewWindow.document.close()
  }
}
