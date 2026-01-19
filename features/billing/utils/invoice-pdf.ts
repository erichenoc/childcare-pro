import type { InvoicePDFData, InvoiceLineItem } from '../services/billing-enhanced.service'

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get status label in Spanish
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviada',
    partial: 'Pago Parcial',
    paid: 'Pagada',
    overdue: 'Vencida',
    cancelled: 'Cancelada',
  }
  return labels[status] || status
}

/**
 * Get status color
 */
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: '#6b7280',
    sent: '#3b82f6',
    partial: '#f59e0b',
    paid: '#10b981',
    overdue: '#ef4444',
    cancelled: '#9ca3af',
  }
  return colors[status] || '#6b7280'
}

/**
 * Generate printable HTML invoice
 */
export function generateInvoiceHTML(data: InvoicePDFData): string {
  const { invoice, organization } = data
  const lineItems = (invoice.line_items || []) as InvoiceLineItem[]
  const balance = (invoice.total || 0) - (invoice.amount_paid || 0)

  const orgAddress = [
    organization.address,
    organization.city,
    organization.state,
    organization.zip,
  ].filter(Boolean).join(', ')

  const familyAddress = invoice.family?.address || ''

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoice.invoice_number}</title>
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
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }

    .logo {
      max-height: 60px;
    }

    .company-info h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1e40af;
    }

    .company-info p {
      font-size: 14px;
      color: #6b7280;
    }

    .invoice-title {
      text-align: right;
    }

    .invoice-title h2 {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
    }

    .invoice-title .invoice-number {
      font-size: 16px;
      color: #6b7280;
    }

    .invoice-title .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 600;
      color: white;
      background: ${getStatusColor(invoice.status || 'draft')};
      margin-top: 8px;
    }

    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }

    .info-block h3 {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    .info-block p {
      font-size: 14px;
      color: #1f2937;
    }

    .info-block .name {
      font-weight: 600;
      font-size: 16px;
    }

    .dates {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .date-item label {
      font-size: 12px;
      color: #6b7280;
      display: block;
    }

    .date-item span {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    th {
      background: #f3f4f6;
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    th:last-child {
      text-align: right;
    }

    td {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }

    td:last-child {
      text-align: right;
      font-weight: 500;
    }

    .item-description {
      font-weight: 500;
    }

    .item-details {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .discount-row td {
      color: #10b981;
    }

    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }

    .totals-table {
      width: 300px;
    }

    .totals-table tr td {
      padding: 8px 16px;
      border: none;
    }

    .totals-table tr td:first-child {
      color: #6b7280;
    }

    .totals-table tr.total td {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      border-top: 2px solid #e5e7eb;
      padding-top: 16px;
    }

    .totals-table tr.balance td {
      font-size: 20px;
      font-weight: 700;
      color: ${balance > 0 ? '#ef4444' : '#10b981'};
    }

    .notes {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 40px;
    }

    .notes h4 {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }

    .notes p {
      font-size: 14px;
      color: #78350f;
    }

    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
    }

    .footer p {
      font-size: 12px;
      color: #9ca3af;
    }

    .payment-info {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .payment-info h4 {
      font-size: 14px;
      font-weight: 600;
      color: #166534;
      margin-bottom: 12px;
    }

    .payment-info p {
      font-size: 14px;
      color: #15803d;
    }

    @media print {
      body {
        padding: 20px;
      }

      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      ${organization.logo_url ? `<img src="${organization.logo_url}" alt="${organization.name}" class="logo">` : ''}
      <h1>${organization.name}</h1>
      ${orgAddress ? `<p>${orgAddress}</p>` : ''}
      ${organization.phone ? `<p>Tel: ${organization.phone}</p>` : ''}
      ${organization.email ? `<p>${organization.email}</p>` : ''}
      ${organization.tax_id ? `<p>Tax ID: ${organization.tax_id}</p>` : ''}
    </div>
    <div class="invoice-title">
      <h2>FACTURA</h2>
      <p class="invoice-number">${invoice.invoice_number}</p>
      <span class="status">${getStatusLabel(invoice.status || 'draft')}</span>
    </div>
  </div>

  <div class="info-section">
    <div class="info-block">
      <h3>Facturar A</h3>
      <p class="name">${invoice.family?.primary_contact_name || 'N/A'}</p>
      ${familyAddress ? `<p>${familyAddress}</p>` : ''}
      ${invoice.family?.primary_contact_phone ? `<p>Tel: ${invoice.family.primary_contact_phone}</p>` : ''}
      ${invoice.family?.primary_contact_email ? `<p>${invoice.family.primary_contact_email}</p>` : ''}
    </div>
    <div class="info-block">
      <h3>Detalles de Pago</h3>
      <p>Métodos aceptados:</p>
      <p>• Tarjeta de crédito/débito</p>
      <p>• Transferencia bancaria</p>
      <p>• Efectivo</p>
      <p>• Cheque</p>
    </div>
  </div>

  <div class="dates">
    <div class="date-item">
      <label>Fecha de Emisión</label>
      <span>${invoice.created_at ? formatDate(invoice.created_at) : 'N/A'}</span>
    </div>
    <div class="date-item">
      <label>Fecha de Vencimiento</label>
      <span>${invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}</span>
    </div>
    <div class="date-item">
      <label>Período</label>
      <span>${invoice.period_start && invoice.period_end
        ? `${formatDate(invoice.period_start)} - ${formatDate(invoice.period_end)}`
        : 'N/A'}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Precio Unit.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems.map(item => `
        <tr class="${item.item_type === 'discount' ? 'discount-row' : ''}">
          <td>
            <div class="item-description">${item.description}</div>
            ${item.child_name ? `<div class="item-details">Niño: ${item.child_name}</div>` : ''}
            ${item.period_start && item.period_end ? `<div class="item-details">${formatDate(item.period_start)} - ${formatDate(item.period_end)}</div>` : ''}
          </td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unit_price)}</td>
          <td>${formatCurrency(item.total)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td>Subtotal</td>
        <td>${formatCurrency(invoice.subtotal || invoice.total || 0)}</td>
      </tr>
      ${invoice.discount && invoice.discount > 0 ? `
        <tr>
          <td>Descuento</td>
          <td>-${formatCurrency(invoice.discount)}</td>
        </tr>
      ` : ''}
      <tr class="total">
        <td>Total</td>
        <td>${formatCurrency(invoice.total || 0)}</td>
      </tr>
      ${(invoice.amount_paid || 0) > 0 ? `
        <tr>
          <td>Pagado</td>
          <td>-${formatCurrency(invoice.amount_paid || 0)}</td>
        </tr>
      ` : ''}
      <tr class="balance">
        <td>Balance</td>
        <td>${formatCurrency(balance)}</td>
      </tr>
    </table>
  </div>

  ${invoice.notes ? `
    <div class="notes">
      <h4>Notas</h4>
      <p>${invoice.notes}</p>
    </div>
  ` : ''}

  ${balance > 0 ? `
    <div class="payment-info">
      <h4>Información de Pago</h4>
      <p>Por favor realice el pago antes de la fecha de vencimiento para evitar cargos por mora.</p>
      <p>Para pagar con tarjeta, visite nuestro portal en línea o contacte a la oficina.</p>
    </div>
  ` : ''}

  <div class="footer">
    <p>Gracias por confiar en ${organization.name}</p>
    <p>Este documento fue generado automáticamente</p>
  </div>
</body>
</html>
  `
}

/**
 * Open print dialog with invoice
 */
export function printInvoice(data: InvoicePDFData): void {
  const html = generateInvoiceHTML(data)
  const printWindow = window.open('', '_blank')

  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

/**
 * Download invoice as HTML file (can be opened in browser and printed to PDF)
 */
export function downloadInvoiceHTML(data: InvoicePDFData): void {
  const html = generateInvoiceHTML(data)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `Factura-${data.invoice.invoice_number}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
