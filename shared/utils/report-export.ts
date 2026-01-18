/**
 * Report Export Utilities
 *
 * Centralized utilities for exporting reports to various formats:
 * - Excel (XLSX)
 * - CSV
 * - PDF (via print)
 */

import * as XLSX from 'xlsx'

export interface ExportColumn {
  header: string
  key: string
  width?: number
}

export interface ReportData {
  title: string
  subtitle?: string
  generatedAt: Date
  columns: ExportColumn[]
  rows: Record<string, unknown>[]
  summary?: Record<string, string | number>
}

/**
 * Export data to Excel file with automatic download
 */
export function exportToExcel(data: ReportData, filename: string): void {
  // Create workbook
  const wb = XLSX.utils.book_new()

  // Prepare header row
  const headers = data.columns.map(col => col.header)

  // Prepare data rows
  const rows = data.rows.map(row =>
    data.columns.map(col => row[col.key] ?? '')
  )

  // Create worksheet data
  const wsData = [
    [data.title],
    [data.subtitle || ''],
    [`Generado: ${data.generatedAt.toLocaleString('es-ES')}`],
    [], // Empty row
    headers,
    ...rows
  ]

  // Add summary if present
  if (data.summary) {
    wsData.push([]) // Empty row
    wsData.push(['RESUMEN'])
    Object.entries(data.summary).forEach(([key, value]) => {
      wsData.push([key, String(value)])
    })
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  ws['!cols'] = data.columns.map(col => ({ wch: col.width || 15 }))

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')

  // Generate and download
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * Export data to CSV file with automatic download
 */
export function exportToCSV(data: ReportData, filename: string): void {
  // Prepare headers
  const headers = data.columns.map(col => col.header).join(',')

  // Prepare rows
  const rows = data.rows.map(row =>
    data.columns.map(col => {
      const value = row[col.key]
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    }).join(',')
  ).join('\n')

  // Create CSV content
  const csvContent = `${data.title}\n${data.subtitle || ''}\nGenerado: ${data.generatedAt.toLocaleString('es-ES')}\n\n${headers}\n${rows}`

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate and open PDF via print dialog
 */
export function exportToPDF(data: ReportData, filename: string): void {
  // Create printable HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.title}</title>
      <style>
        @page { margin: 1cm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #1f2937;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #3b82f6;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          margin: 0;
        }
        .subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 5px 0;
        }
        .generated {
          font-size: 11px;
          color: #9ca3af;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th {
          background: #f3f4f6;
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #d1d5db;
          font-size: 11px;
          text-transform: uppercase;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:hover { background: #f9fafb; }
        .summary {
          margin-top: 20px;
          padding: 15px;
          background: #f3f4f6;
          border-radius: 8px;
        }
        .summary h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${data.title}</h1>
        ${data.subtitle ? `<p class="subtitle">${data.subtitle}</p>` : ''}
        <p class="generated">Generado: ${data.generatedAt.toLocaleString('es-ES')}</p>
      </div>

      <table>
        <thead>
          <tr>
            ${data.columns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(row => `
            <tr>
              ${data.columns.map(col => `<td>${row[col.key] ?? '-'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${data.summary ? `
        <div class="summary">
          <h3>Resumen</h3>
          ${Object.entries(data.summary).map(([key, value]) => `
            <div class="summary-item">
              <span>${key}</span>
              <strong>${value}</strong>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `

  // Open print dialog
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date value
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}
