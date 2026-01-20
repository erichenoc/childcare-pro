// =====================================================
// AI Assistant Tool Definitions
// =====================================================
// These define the actions the AI can execute

import type { ToolDefinition, ToolMetadata } from '../types'

// =====================================================
// CHILDREN TOOLS
// =====================================================

export const childrenTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'children_list',
      description: 'Lista todos los niños inscritos en la organización. Puede filtrar por salón, estado o tipo de programa.',
      parameters: {
        type: 'object',
        properties: {
          classroom_id: { type: 'string', description: 'ID del salón para filtrar' },
          status: { type: 'string', description: 'Estado del niño', enum: ['active', 'inactive', 'pending'] },
          program_type: { type: 'string', description: 'Tipo de programa', enum: ['private', 'vpk', 'vpk_wraparound', 'school_readiness', 'sr_copay'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'children_get',
      description: 'Obtiene información detallada de un niño específico incluyendo su familia, salón y programa.',
      parameters: {
        type: 'object',
        properties: {
          child_id: { type: 'string', description: 'ID del niño' },
        },
        required: ['child_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'children_search',
      description: 'Busca niños por nombre (parcial o completo).',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Texto a buscar en el nombre' },
        },
        required: ['query'],
      },
    },
  },
]

// =====================================================
// FAMILIES TOOLS
// =====================================================

export const familiesTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'families_list',
      description: 'Lista todas las familias registradas en la organización.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Estado de la familia', enum: ['active', 'inactive'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'families_get',
      description: 'Obtiene información detallada de una familia incluyendo contactos y niños.',
      parameters: {
        type: 'object',
        properties: {
          family_id: { type: 'string', description: 'ID de la familia' },
        },
        required: ['family_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'families_get_balance',
      description: 'Obtiene el balance pendiente de una familia (facturas no pagadas).',
      parameters: {
        type: 'object',
        properties: {
          family_id: { type: 'string', description: 'ID de la familia' },
        },
        required: ['family_id'],
      },
    },
  },
]

// =====================================================
// ATTENDANCE TOOLS
// =====================================================

export const attendanceTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'attendance_get_today',
      description: 'Obtiene el resumen de asistencia del día actual. Incluye presentes, ausentes y pendientes de salida.',
      parameters: {
        type: 'object',
        properties: {
          classroom_id: { type: 'string', description: 'Filtrar por salón específico' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'attendance_get_stats',
      description: 'Obtiene estadísticas de asistencia para un período.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', description: 'Período de tiempo', enum: ['today', 'week', 'month'] },
          classroom_id: { type: 'string', description: 'Filtrar por salón' },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'attendance_check_in',
      description: 'Registra la entrada de un niño. REQUIERE CONFIRMACIÓN.',
      parameters: {
        type: 'object',
        properties: {
          child_id: { type: 'string', description: 'ID del niño' },
          classroom_id: { type: 'string', description: 'ID del salón' },
          drop_off_person: { type: 'string', description: 'Nombre de quien trae al niño' },
        },
        required: ['child_id', 'classroom_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'attendance_check_out',
      description: 'Registra la salida de un niño. REQUIERE CONFIRMACIÓN.',
      parameters: {
        type: 'object',
        properties: {
          child_id: { type: 'string', description: 'ID del niño' },
          pickup_person: { type: 'string', description: 'Nombre de quien recoge al niño' },
        },
        required: ['child_id'],
      },
    },
  },
]

// =====================================================
// CLASSROOMS TOOLS
// =====================================================

export const classroomsTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'classrooms_list',
      description: 'Lista todos los salones con su capacidad y ocupación actual.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'classrooms_get_ratios',
      description: 'Obtiene los ratios actuales de todos los salones según regulaciones DCF de Florida.',
      parameters: {
        type: 'object',
        properties: {
          classroom_id: { type: 'string', description: 'Filtrar por salón específico' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'classrooms_check_compliance',
      description: 'Verifica si los ratios actuales cumplen con las regulaciones DCF.',
      parameters: {
        type: 'object',
        properties: {
          classroom_id: { type: 'string', description: 'Salón a verificar (opcional, verifica todos si no se especifica)' },
        },
      },
    },
  },
]

// =====================================================
// STAFF TOOLS
// =====================================================

export const staffTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'staff_list',
      description: 'Lista todo el personal de la organización.',
      parameters: {
        type: 'object',
        properties: {
          role: { type: 'string', description: 'Filtrar por rol', enum: ['teacher', 'assistant', 'director', 'admin'] },
          status: { type: 'string', description: 'Estado del empleado', enum: ['active', 'inactive'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'staff_get',
      description: 'Obtiene información detallada de un empleado.',
      parameters: {
        type: 'object',
        properties: {
          staff_id: { type: 'string', description: 'ID del empleado' },
        },
        required: ['staff_id'],
      },
    },
  },
]

// =====================================================
// INCIDENTS TOOLS
// =====================================================

export const incidentsTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'incidents_list',
      description: 'Lista todos los incidentes reportados.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Estado del incidente', enum: ['open', 'pending_signature', 'resolved'] },
          severity: { type: 'string', description: 'Severidad', enum: ['minor', 'moderate', 'serious', 'critical'] },
          child_id: { type: 'string', description: 'Filtrar por niño' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'incidents_create',
      description: 'Crea un nuevo reporte de incidente. REQUIERE CONFIRMACIÓN.',
      parameters: {
        type: 'object',
        properties: {
          child_id: { type: 'string', description: 'ID del niño involucrado' },
          incident_type: { type: 'string', description: 'Tipo de incidente', enum: ['injury', 'illness', 'behavior', 'accident', 'other'] },
          description: { type: 'string', description: 'Descripción del incidente' },
          severity: { type: 'string', description: 'Severidad', enum: ['minor', 'moderate', 'serious', 'critical'] },
          first_aid_given: { type: 'string', description: 'Primeros auxilios aplicados' },
        },
        required: ['child_id', 'incident_type', 'description', 'severity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'incidents_get_requiring_followup',
      description: 'Obtiene incidentes que requieren seguimiento.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
]

// =====================================================
// BILLING TOOLS
// =====================================================

export const billingTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'billing_get_invoices',
      description: 'Lista las facturas de la organización.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Estado de la factura', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] },
          family_id: { type: 'string', description: 'Filtrar por familia' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'billing_get_overdue',
      description: 'Obtiene todas las facturas vencidas con detalles de las familias.',
      parameters: {
        type: 'object',
        properties: {
          days_overdue: { type: 'number', description: 'Mínimo de días vencidos (default: 1)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'billing_create_invoice',
      description: 'Crea una nueva factura para una familia. REQUIERE CONFIRMACIÓN.',
      parameters: {
        type: 'object',
        properties: {
          family_id: { type: 'string', description: 'ID de la familia' },
          amount: { type: 'number', description: 'Monto total' },
          description: { type: 'string', description: 'Descripción de la factura' },
          due_date: { type: 'string', description: 'Fecha de vencimiento (YYYY-MM-DD)' },
        },
        required: ['family_id', 'amount', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'billing_send_reminder',
      description: 'Envía un recordatorio de pago a una familia. REQUIERE CONFIRMACIÓN.',
      parameters: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'ID de la factura' },
          message: { type: 'string', description: 'Mensaje personalizado (opcional)' },
        },
        required: ['invoice_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'billing_get_stats',
      description: 'Obtiene estadísticas financieras del período.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', description: 'Período', enum: ['month', 'quarter', 'year'] },
        },
        required: ['period'],
      },
    },
  },
]

// =====================================================
// ANALYTICS TOOLS
// =====================================================

export const analyticsTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'analytics_daily_summary',
      description: 'Genera un resumen ejecutivo del día incluyendo asistencia, incidentes, alertas y tareas pendientes.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Fecha (YYYY-MM-DD), default: hoy' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analytics_get_alerts',
      description: 'Obtiene todas las alertas activas del sistema (ratios, vencimientos, pagos pendientes, etc.).',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analytics_enrollment_stats',
      description: 'Estadísticas de inscripción por programa y salón.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
]

// =====================================================
// COMMUNICATION TOOLS
// =====================================================

export const communicationTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'communication_send_email',
      description: 'Envía un email a una familia o a todos los padres. REQUIERE CONFIRMACIÓN.',
      parameters: {
        type: 'object',
        properties: {
          recipients: { type: 'string', description: 'ID de familia o "all" para todos', },
          subject: { type: 'string', description: 'Asunto del email' },
          body: { type: 'string', description: 'Contenido del email' },
        },
        required: ['recipients', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'communication_draft_message',
      description: 'Genera un borrador de mensaje para revisión antes de enviar.',
      parameters: {
        type: 'object',
        properties: {
          purpose: { type: 'string', description: 'Propósito del mensaje', enum: ['payment_reminder', 'event_announcement', 'incident_notification', 'general'] },
          context: { type: 'string', description: 'Contexto adicional para personalizar el mensaje' },
          tone: { type: 'string', description: 'Tono del mensaje', enum: ['formal', 'friendly', 'urgent'] },
          language: { type: 'string', description: 'Idioma', enum: ['es', 'en'] },
        },
        required: ['purpose'],
      },
    },
  },
]

// =====================================================
// ALL TOOLS COMBINED
// =====================================================

export const allTools: ToolDefinition[] = [
  ...childrenTools,
  ...familiesTools,
  ...attendanceTools,
  ...classroomsTools,
  ...staffTools,
  ...incidentsTools,
  ...billingTools,
  ...analyticsTools,
  ...communicationTools,
]

// =====================================================
// TOOL METADATA (for UI and confirmation logic)
// =====================================================

export const toolMetadata: Record<string, ToolMetadata> = {
  // Children - Read only
  children_list: { name: 'Listar Niños', category: 'children', description: 'Lista niños inscritos', requiresConfirmation: false, isReadOnly: true },
  children_get: { name: 'Ver Niño', category: 'children', description: 'Detalles de un niño', requiresConfirmation: false, isReadOnly: true },
  children_search: { name: 'Buscar Niños', category: 'children', description: 'Buscar por nombre', requiresConfirmation: false, isReadOnly: true },

  // Families - Read only
  families_list: { name: 'Listar Familias', category: 'families', description: 'Lista familias', requiresConfirmation: false, isReadOnly: true },
  families_get: { name: 'Ver Familia', category: 'families', description: 'Detalles de familia', requiresConfirmation: false, isReadOnly: true },
  families_get_balance: { name: 'Ver Balance', category: 'families', description: 'Balance de familia', requiresConfirmation: false, isReadOnly: true },

  // Attendance - Mixed
  attendance_get_today: { name: 'Asistencia Hoy', category: 'attendance', description: 'Resumen del día', requiresConfirmation: false, isReadOnly: true },
  attendance_get_stats: { name: 'Estadísticas', category: 'attendance', description: 'Estadísticas de asistencia', requiresConfirmation: false, isReadOnly: true },
  attendance_check_in: { name: 'Registrar Entrada', category: 'attendance', description: 'Check-in de niño', requiresConfirmation: true, isReadOnly: false },
  attendance_check_out: { name: 'Registrar Salida', category: 'attendance', description: 'Check-out de niño', requiresConfirmation: true, isReadOnly: false },

  // Classrooms - Read only
  classrooms_list: { name: 'Listar Salones', category: 'classrooms', description: 'Lista salones', requiresConfirmation: false, isReadOnly: true },
  classrooms_get_ratios: { name: 'Ver Ratios', category: 'classrooms', description: 'Ratios DCF', requiresConfirmation: false, isReadOnly: true },
  classrooms_check_compliance: { name: 'Verificar Cumplimiento', category: 'compliance', description: 'Cumplimiento DCF', requiresConfirmation: false, isReadOnly: true },

  // Staff - Read only
  staff_list: { name: 'Listar Personal', category: 'staff', description: 'Lista empleados', requiresConfirmation: false, isReadOnly: true },
  staff_get: { name: 'Ver Empleado', category: 'staff', description: 'Detalles de empleado', requiresConfirmation: false, isReadOnly: true },

  // Incidents - Mixed
  incidents_list: { name: 'Listar Incidentes', category: 'incidents', description: 'Lista incidentes', requiresConfirmation: false, isReadOnly: true },
  incidents_create: { name: 'Crear Incidente', category: 'incidents', description: 'Reportar incidente', requiresConfirmation: true, isReadOnly: false },
  incidents_get_requiring_followup: { name: 'Seguimientos Pendientes', category: 'incidents', description: 'Incidentes con seguimiento', requiresConfirmation: false, isReadOnly: true },

  // Billing - Mixed
  billing_get_invoices: { name: 'Listar Facturas', category: 'billing', description: 'Lista facturas', requiresConfirmation: false, isReadOnly: true },
  billing_get_overdue: { name: 'Facturas Vencidas', category: 'billing', description: 'Pagos pendientes', requiresConfirmation: false, isReadOnly: true },
  billing_create_invoice: { name: 'Crear Factura', category: 'billing', description: 'Nueva factura', requiresConfirmation: true, isReadOnly: false },
  billing_send_reminder: { name: 'Enviar Recordatorio', category: 'billing', description: 'Recordatorio de pago', requiresConfirmation: true, isReadOnly: false },
  billing_get_stats: { name: 'Estadísticas Financieras', category: 'billing', description: 'Resumen financiero', requiresConfirmation: false, isReadOnly: true },

  // Analytics - Read only
  analytics_daily_summary: { name: 'Resumen Diario', category: 'analytics', description: 'Resumen del día', requiresConfirmation: false, isReadOnly: true },
  analytics_get_alerts: { name: 'Ver Alertas', category: 'analytics', description: 'Alertas activas', requiresConfirmation: false, isReadOnly: true },
  analytics_enrollment_stats: { name: 'Estadísticas Inscripción', category: 'analytics', description: 'Inscripciones por programa', requiresConfirmation: false, isReadOnly: true },

  // Communication - Requires confirmation
  communication_send_email: { name: 'Enviar Email', category: 'communication', description: 'Enviar correo', requiresConfirmation: true, isReadOnly: false },
  communication_draft_message: { name: 'Crear Borrador', category: 'communication', description: 'Borrador de mensaje', requiresConfirmation: false, isReadOnly: true },
}

// Helper to check if tool requires confirmation
export function requiresConfirmation(toolName: string): boolean {
  return toolMetadata[toolName]?.requiresConfirmation ?? false
}

// Helper to get tool info
export function getToolInfo(toolName: string): ToolMetadata | undefined {
  return toolMetadata[toolName]
}
