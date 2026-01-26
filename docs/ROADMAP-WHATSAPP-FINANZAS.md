# ROADMAP: WhatsApp Agent + Automatización Financiera

## Resumen Ejecutivo

| Proyecto | Duración Est. | Prioridad |
|----------|---------------|-----------|
| WhatsApp Agent Multi-Tenant | 3-4 semanas | ALTA |
| Automatización Financiera | 5-6 semanas | MEDIA |
| **Total** | **8-10 semanas** | - |

---

## INFRAESTRUCTURA EXISTENTE

| Servicio | URL | Plataforma |
|----------|-----|------------|
| **Easypanel** | https://easypanel.henocmarketing.com | VPS Management |
| **n8n** | https://n8n.henocmarketing.com | Workflows |
| **Evolution API** | (en Easypanel) | WhatsApp Multi-Instance |
| **Supabase** | (cloud) | Base de datos |
| **ChildCare Pro** | (Vercel) | Aplicación SaaS |

---

## ARQUITECTURA GENERAL (CON EVOLUTION API)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHILDCARE PRO SaaS                                 │
│                    CON EVOLUTION API + EASYPANEL                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    EASYPANEL (VPS)                                   │   │
│  │                 easypanel.henocmarketing.com                         │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                 │   │
│  │  │    EVOLUTION API    │    │        n8n          │                 │   │
│  │  │   (Multi-Instance)  │◄──►│   (Workflows)       │                 │   │
│  │  │                     │    │ n8n.henocmarketing  │                 │   │
│  │  │  Instance 1: sunny  │    │       .com          │                 │   │
│  │  │  Instance 2: happy  │    │                     │                 │   │
│  │  │  Instance N: ...    │    │                     │                 │   │
│  │  └─────────────────────┘    └──────────┬──────────┘                 │   │
│  │                                        │                             │   │
│  └────────────────────────────────────────┼─────────────────────────────┘   │
│                                           │                                 │
│                                           ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CHILDCARE PRO (Vercel)                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │   │
│  │  │  WhatsApp   │    │   Sistema   │    │  Finanzas   │              │   │
│  │  │    APIs     │◄──►│    Core     │◄──►│  Avanzadas  │              │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘              │   │
│  │         │                  │                  │                      │   │
│  │         └──────────────────┼──────────────────┘                      │   │
│  │                            ▼                                         │   │
│  └────────────────────────────┼─────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│                    ┌─────────────────────┐                                  │
│                    │     SUPABASE        │                                  │
│                    │  (Multi-Tenant BD)  │                                  │
│                    └─────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## FLUJO DE MENSAJES WHATSAPP

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Padre      │     │  Evolution   │     │    n8n       │     │ ChildCare    │
│  WhatsApp    │     │    API       │     │  Workflow    │     │   Pro API    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │  1. Envía mensaje  │                    │                    │
       │───────────────────>│                    │                    │
       │                    │                    │                    │
       │                    │ 2. Webhook POST    │                    │
       │                    │ (instance: "sunny")│                    │
       │                    │───────────────────>│                    │
       │                    │                    │                    │
       │                    │                    │ 3. GET /identify   │
       │                    │                    │ (instance=sunny)   │
       │                    │                    │───────────────────>│
       │                    │                    │                    │
       │                    │                    │ 4. Return org_id   │
       │                    │                    │<───────────────────│
       │                    │                    │                    │
       │                    │                    │ 5. AI: Detectar    │
       │                    │                    │    intención       │
       │                    │                    │                    │
       │                    │                    │ 6. GET /child-     │
       │                    │                    │    summary         │
       │                    │                    │───────────────────>│
       │                    │                    │                    │
       │                    │                    │ 7. Return data     │
       │                    │                    │<───────────────────│
       │                    │                    │                    │
       │                    │                    │ 8. AI: Generar     │
       │                    │                    │    respuesta       │
       │                    │                    │                    │
       │                    │ 9. POST /sendText  │                    │
       │                    │<───────────────────│                    │
       │                    │                    │                    │
       │ 10. Recibe resp.   │                    │                    │
       │<───────────────────│                    │                    │
       │                    │                    │                    │
```

---

## VARIABLES DE ENTORNO REQUERIDAS

### ChildCare Pro (.env.local)
```env
# Evolution API
EVOLUTION_API_URL=https://evo.henocmarketing.com  # Tu URL de Evolution en Easypanel
EVOLUTION_API_KEY=tu_api_key_de_evolution

# n8n Webhook
N8N_WEBHOOK_BASE_URL=https://n8n.henocmarketing.com/webhook
```

### n8n (Credentials)
```
Evolution API:
- Base URL: https://evo.henocmarketing.com
- API Key: tu_api_key_de_evolution

ChildCare Pro API:
- Base URL: https://tu-app.vercel.app/api
- API Key: (crear en settings)
```

---

## ONBOARDING DE NUEVO CLIENTE (DAYCARE)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PASO 1: Admin crea organización en ChildCare Pro                           │
│          Dashboard → Organizations → New                                    │
│          → name: "Sunny Kids Daycare"                                       │
│          → slug: "sunny-kids"                                               │
│          → organization_id: "org_abc123"                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PASO 2: Sistema crea instancia en Evolution API AUTOMÁTICAMENTE            │
│                                                                             │
│  POST https://evo.henocmarketing.com/instance/create                        │
│  Headers: { "apikey": "EVOLUTION_API_KEY" }                                 │
│  Body: {                                                                    │
│    "instanceName": "sunny-kids",        ← Slug de la organización          │
│    "integration": "WHATSAPP-BAILEYS",                                       │
│    "qrcode": true,                                                          │
│    "webhook": {                                                             │
│      "url": "https://n8n.henocmarketing.com/webhook/whatsapp",             │
│      "byEvents": false,                                                     │
│      "base64": true,                                                        │
│      "events": ["MESSAGES_UPSERT"]                                          │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PASO 3: Daycare escanea QR desde su panel de admin                         │
│                                                                             │
│  Dashboard → Settings → WhatsApp → "Conectar WhatsApp"                      │
│                                                                             │
│  ┌─────────────────────────────────┐                                        │
│  │       ┌─────────────────┐       │                                        │
│  │       │    █▀▀▀▀▀▀▀█    │       │                                        │
│  │       │    █ QR    █    │       │  Escanea este código QR                │
│  │       │    █ CODE  █    │       │  con tu WhatsApp                       │
│  │       │    █▄▄▄▄▄▄▄█    │       │                                        │
│  │       └─────────────────┘       │                                        │
│  │                                 │                                        │
│  │  Estado: Esperando conexión...  │                                        │
│  └─────────────────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PASO 4: WhatsApp conectado y listo                                         │
│                                                                             │
│  ┌─────────────────────────────────┐                                        │
│  │  ✅ WhatsApp Conectado          │                                        │
│  │                                 │                                        │
│  │  Número: +1 (305) 555-0001      │                                        │
│  │  Estado: Conectado              │                                        │
│  │  Instancia: sunny-kids          │                                        │
│  │                                 │                                        │
│  │  [Desconectar]  [Ver mensajes]  │                                        │
│  └─────────────────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# FASE 1: INFRAESTRUCTURA BASE
## Prioridad: CRÍTICA | Duración: 1 semana

### 1.1 Migración de Base de Datos (Evolution API)
**Prioridad:** P0 (Bloquea todo lo demás)
**Archivo:** `supabase/migrations/022_whatsapp_evolution.sql`

```sql
-- =====================================================
-- WHATSAPP EVOLUTION API - MULTI-TENANT INFRASTRUCTURE
-- =====================================================

-- 1. Instancias de WhatsApp (1 por organización)
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  instance_name TEXT UNIQUE NOT NULL,           -- "sunny-kids" (slug)
  phone_number TEXT,                             -- +13055550001 (cuando conecta)
  status TEXT DEFAULT 'disconnected',            -- connected, disconnected, connecting
  qr_code_base64 TEXT,                           -- QR actual si desconectado
  webhook_url TEXT,                              -- URL del webhook configurado
  connected_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sesiones de conversación (contexto)
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL,                      -- 1234567890@s.whatsapp.net
  guardian_id UUID REFERENCES guardians(id),     -- NULL si prospecto
  family_id UUID REFERENCES families(id),
  current_child_id UUID REFERENCES children(id), -- Contexto: de qué hijo hablan
  is_prospect BOOLEAN DEFAULT false,
  prospect_data JSONB,                           -- Datos recolectados de prospecto
  session_context JSONB,                         -- Estado de conversación
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por número
CREATE INDEX idx_whatsapp_sessions_jid ON whatsapp_sessions(remote_jid, organization_id);

-- 3. Historial de mensajes
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  remote_jid TEXT NOT NULL,
  message_id TEXT NOT NULL,                      -- ID de WhatsApp
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL,                    -- text, image, audio, document, etc.
  content TEXT,                                  -- Contenido del mensaje
  media_url TEXT,                                -- URL de media (si aplica)
  media_mimetype TEXT,
  intent_detected TEXT,                          -- Intención detectada por AI
  response_time_ms INTEGER,                      -- Tiempo de respuesta
  status TEXT DEFAULT 'received',                -- received, processing, sent, delivered, read, failed
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda de mensajes
CREATE INDEX idx_whatsapp_messages_session ON whatsapp_messages(session_id);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);

-- 4. Templates de respuesta personalizables por organización
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,                    -- greeting, menu, invoice_reminder, etc.
  template_name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[],                              -- Variables disponibles: {child_name}, {amount}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, template_key)
);

-- 5. Configuración del bot por organización
CREATE TABLE whatsapp_bot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  bot_name TEXT DEFAULT 'Asistente',
  welcome_message TEXT DEFAULT '¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte?',
  business_hours_start TIME DEFAULT '07:00',
  business_hours_end TIME DEFAULT '18:00',
  after_hours_message TEXT DEFAULT 'Nuestro horario de atención es de 7am a 6pm.',
  enable_ai_responses BOOLEAN DEFAULT true,
  enable_photo_sharing BOOLEAN DEFAULT true,
  enable_invoice_payments BOOLEAN DEFAULT true,
  max_messages_per_hour INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Estadísticas de uso (para analytics)
CREATE TABLE whatsapp_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_received INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  intents_breakdown JSONB,                       -- {"daily_summary": 45, "invoices": 23, ...}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, date)
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas: Solo ver datos de tu organización
CREATE POLICY "Users can view own org whatsapp_instances"
  ON whatsapp_instances FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view own org whatsapp_sessions"
  ON whatsapp_sessions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view own org whatsapp_messages"
  ON whatsapp_messages FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- =====================================================
-- SEED: Templates por defecto
-- =====================================================

-- Se insertan cuando se crea una organización (via trigger o código)
```

**Tareas:**
- [ ] Crear migración SQL
- [ ] Crear tipos TypeScript (`shared/types/whatsapp.types.ts`)
- [ ] Crear RLS policies
- [ ] Ejecutar migración en Supabase
- [ ] Crear trigger para insertar templates por defecto

**Estimación:** 4-6 horas

---

### 1.2 APIs para WhatsApp (Endpoints que n8n consumirá)
**Prioridad:** P0
**Ubicación:** `app/api/whatsapp/`

#### APIs para n8n (Workflow)
| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/whatsapp/identify` | POST | Identificar org + padre por instance + phone | API Key |
| `/api/whatsapp/child-summary/[childId]` | GET | Resumen del día del niño | API Key |
| `/api/whatsapp/attendance/[childId]` | GET | Estado de asistencia | API Key |
| `/api/whatsapp/invoices/[familyId]` | GET | Facturas pendientes | API Key |
| `/api/whatsapp/incidents/[childId]` | GET | Incidentes recientes | API Key |
| `/api/whatsapp/photos/[childId]` | GET | Fotos del día (URLs) | API Key |
| `/api/whatsapp/public-info` | GET | Info pública por instance | API Key |
| `/api/whatsapp/create-lead` | POST | Crear lead desde WhatsApp | API Key |
| `/api/whatsapp/create-appointment` | POST | Agendar tour | API Key |
| `/api/whatsapp/log-message` | POST | Guardar mensaje en historial | API Key |

#### APIs para Admin Panel (Dashboard)
| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/whatsapp/instance` | GET | Estado de instancia de la org | User Auth |
| `/api/whatsapp/instance/create` | POST | Crear instancia en Evolution | User Auth |
| `/api/whatsapp/instance/qr` | GET | Obtener QR code para conectar | User Auth |
| `/api/whatsapp/instance/status` | GET | Verificar estado de conexión | User Auth |
| `/api/whatsapp/instance/disconnect` | POST | Desconectar WhatsApp | User Auth |
| `/api/whatsapp/messages` | GET | Historial de mensajes | User Auth |
| `/api/whatsapp/analytics` | GET | Estadísticas de uso | User Auth |
| `/api/whatsapp/config` | GET/PUT | Configuración del bot | User Auth |
| `/api/whatsapp/templates` | GET/PUT | Templates de respuesta | User Auth |

#### Ejemplo: `/api/whatsapp/identify`
```typescript
// POST /api/whatsapp/identify
// Body: { instance: "sunny-kids", remoteJid: "1234567890@s.whatsapp.net" }

// Response para PADRE REGISTRADO:
{
  "type": "parent",
  "organization": {
    "id": "org_abc123",
    "name": "Sunny Kids Daycare",
    "instance_name": "sunny-kids"
  },
  "guardian": {
    "id": "guardian_xyz",
    "name": "Maria Rodriguez",
    "phone": "+1234567890"
  },
  "family": {
    "id": "family_123",
    "name": "Rodriguez"
  },
  "children": [
    { "id": "child_1", "name": "Sofia", "classroom": "Mariposas" },
    { "id": "child_2", "name": "Miguel", "classroom": "Ositos" }
  ],
  "session": {
    "id": "session_abc",
    "current_child_id": "child_1"  // Del contexto anterior
  }
}

// Response para PROSPECTO:
{
  "type": "prospect",
  "organization": {
    "id": "org_abc123",
    "name": "Sunny Kids Daycare",
    "instance_name": "sunny-kids"
  },
  "session": {
    "id": "session_xyz",
    "is_prospect": true,
    "prospect_data": null
  }
}
```

**Tareas:**
- [ ] Crear middleware de autenticación API Key
- [ ] Crear endpoint `/api/whatsapp/identify`
- [ ] Crear endpoint `/api/whatsapp/child-summary/[childId]`
- [ ] Crear endpoint `/api/whatsapp/attendance/[childId]`
- [ ] Crear endpoint `/api/whatsapp/invoices/[familyId]`
- [ ] Crear endpoint `/api/whatsapp/incidents/[childId]`
- [ ] Crear endpoint `/api/whatsapp/photos/[childId]`
- [ ] Crear endpoint `/api/whatsapp/public-info`
- [ ] Crear endpoint `/api/whatsapp/create-lead`
- [ ] Crear endpoint `/api/whatsapp/create-appointment`
- [ ] Crear endpoint `/api/whatsapp/log-message`
- [ ] Crear endpoints de admin panel (instance, config, etc.)
- [ ] Agregar rate limiting a todos los endpoints
- [ ] Agregar validación con Zod
- [ ] Agregar audit logging

**Estimación:** 16-20 horas

---

### 1.3 Servicio WhatsApp (Feature)
**Prioridad:** P0
**Ubicación:** `features/whatsapp/`

```
features/whatsapp/
├── services/
│   ├── evolution-api.service.ts        # Cliente para Evolution API
│   ├── whatsapp-identity.service.ts    # Identificar org/padre
│   ├── whatsapp-data.service.ts        # Agregar datos para respuestas
│   ├── whatsapp-session.service.ts     # Manejar estado de conversación
│   ├── whatsapp-messages.service.ts    # Historial de mensajes
│   ├── whatsapp-templates.service.ts   # Templates de respuesta
│   └── whatsapp-analytics.service.ts   # Estadísticas de uso
├── types/
│   └── whatsapp.types.ts               # Tipos específicos
└── utils/
    ├── format-for-whatsapp.ts          # Formatear respuestas (sin HTML)
    └── parse-whatsapp-number.ts        # Normalizar números telefónicos
```

#### evolution-api.service.ts (Cliente)
```typescript
// features/whatsapp/services/evolution-api.service.ts

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!

export const evolutionApiService = {
  // ========== INSTANCIAS ==========

  async createInstance(instanceName: string, webhookUrl: string) {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        webhook: {
          url: webhookUrl,
          byEvents: false,
          base64: true,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
        }
      })
    })
    return response.json()
  },

  async getQRCode(instanceName: string): Promise<{ base64: string }> {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      { headers: { 'apikey': EVOLUTION_API_KEY } }
    )
    return response.json()
  },

  async getConnectionState(instanceName: string): Promise<{ state: string }> {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
      { headers: { 'apikey': EVOLUTION_API_KEY } }
    )
    return response.json()
  },

  async logout(instanceName: string) {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/logout/${instanceName}`,
      {
        method: 'DELETE',
        headers: { 'apikey': EVOLUTION_API_KEY }
      }
    )
    return response.json()
  },

  async deleteInstance(instanceName: string) {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/delete/${instanceName}`,
      {
        method: 'DELETE',
        headers: { 'apikey': EVOLUTION_API_KEY }
      }
    )
    return response.json()
  },

  // ========== MENSAJES ==========

  async sendText(instanceName: string, to: string, text: string) {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: to.replace('@s.whatsapp.net', ''),
          text,
          delay: 1000  // 1 segundo de delay para parecer natural
        })
      }
    )
    return response.json()
  },

  async sendImage(instanceName: string, to: string, imageUrl: string, caption?: string) {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: to.replace('@s.whatsapp.net', ''),
          mediatype: 'image',
          media: imageUrl,
          caption
        })
      }
    )
    return response.json()
  },

  async sendDocument(instanceName: string, to: string, documentUrl: string, filename: string) {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: to.replace('@s.whatsapp.net', ''),
          mediatype: 'document',
          media: documentUrl,
          fileName: filename
        })
      }
    )
    return response.json()
  },

  async sendButtons(instanceName: string, to: string, text: string, buttons: Array<{id: string, text: string}>) {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendButtons/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: to.replace('@s.whatsapp.net', ''),
          title: '',
          description: text,
          buttons: buttons.map(b => ({
            type: 'reply',
            reply: { id: b.id, title: b.text }
          }))
        })
      }
    )
    return response.json()
  }
}
```

**Tareas:**
- [ ] Crear estructura de carpetas
- [ ] Implementar evolution-api.service.ts
- [ ] Implementar whatsapp-identity.service.ts
- [ ] Implementar whatsapp-data.service.ts
- [ ] Implementar whatsapp-session.service.ts
- [ ] Implementar whatsapp-messages.service.ts
- [ ] Implementar whatsapp-templates.service.ts
- [ ] Implementar whatsapp-analytics.service.ts
- [ ] Crear tipos TypeScript
- [ ] Crear utilidades de formateo

**Estimación:** 12-16 horas

---

# FASE 2: WORKFLOW n8n - WHATSAPP AGENT
## Prioridad: ALTA | Duración: 2 semanas

### 2.1 Workflow Principal Multi-Tenant (Evolution API)
**Prioridad:** P1
**Ubicación:** n8n (https://n8n.henocmarketing.com)
**Nodo Community:** `n8n-nodes-evolution-api` (instalar en n8n)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│             WORKFLOW: WhatsApp Agent Multi-Tenant (Evolution API)            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Webhook  │───►│ Extract  │───►│ Identify │───►│  Filter  │              │
│  │ Evolution│    │  Data    │    │ Org+User │    │ Own Msg  │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │                                               │                     │
│       │ Payload:                                      │ (Ignora mensajes    │
│       │ {                                             │  enviados por bot)  │
│       │   "event": "messages.upsert",                 │                     │
│       │   "instance": "sunny-kids",                   │                     │
│       │   "data": {                                   ▼                     │
│       │     "key": {                           ┌──────────┐                 │
│       │       "remoteJid": "123@s.whatsapp.net"│  Router  │                 │
│       │       "fromMe": false                  │  Type    │                 │
│       │     },                                 └────┬─────┘                 │
│       │     "message": {                            │                       │
│       │       "conversation": "Hola"                │                       │
│       │     }                                       │                       │
│       │   }                                         │                       │
│       │ }                                     ┌─────┴─────┐                 │
│                                               │           │                 │
│                                               ▼           ▼                 │
│                                         [PADRE]     [PROSPECTO]             │
│                                               │           │                 │
│                                               ▼           ▼                 │
│                                         ┌──────────┐ ┌──────────┐           │
│                                         │   AI     │ │  AI      │           │
│                                         │ Intent   │ │ Prospect │           │
│                                         │ Parser   │ │ Flow     │           │
│                                         └────┬─────┘ └────┬─────┘           │
│                                              │            │                 │
│            ┌─────────────┬─────────────┬─────┴────┐       │                 │
│            ▼             ▼             ▼          ▼       │                 │
│       ┌────────┐   ┌────────┐   ┌────────┐  ┌────────┐   │                 │
│       │ Daily  │   │Invoice │   │ Photos │  │  More  │   │                 │
│       │Summary │   │  Info  │   │        │  │Intents │   │                 │
│       └────┬───┘   └────┬───┘   └────┬───┘  └────┬───┘   │                 │
│            │            │            │           │        │                 │
│            └────────────┴────────────┴───────────┘        │                 │
│                               │                           │                 │
│                               ▼                           │                 │
│                        ┌──────────┐                       │                 │
│                        │   AI     │◄──────────────────────┘                 │
│                        │ Response │                                         │
│                        │Generator │                                         │
│                        └────┬─────┘                                         │
│                             │                                               │
│                             ▼                                               │
│                   ┌─────────────────┐                                       │
│                   │  Log Message    │  (Guardar en BD)                      │
│                   └────────┬────────┘                                       │
│                            │                                                │
│                            ▼                                                │
│                   ┌─────────────────┐                                       │
│                   │ Evolution API   │  (Nodo Community)                     │
│                   │  Send Text      │                                       │
│                   └─────────────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Nodos del Workflow:**

| # | Nodo | Tipo | Función |
|---|------|------|---------|
| 1 | Webhook Trigger | Webhook | Recibe mensajes de Evolution API |
| 2 | Extract Data | Set | Extrae instance, remoteJid, message, fromMe |
| 3 | Filter Own Messages | IF | Ignora si `fromMe = true` |
| 4 | Identify Request | HTTP Request | POST `/api/whatsapp/identify` |
| 5 | Route by Type | Switch | Separa `parent` vs `prospect` |
| 6 | AI Intent Parser | OpenAI/Anthropic | Detecta intención del mensaje |
| 7 | Intent Router | Switch | Ruta según intención detectada |
| 8 | Get Daily Summary | HTTP Request | GET `/api/whatsapp/child-summary/[childId]` |
| 9 | Get Attendance | HTTP Request | GET `/api/whatsapp/attendance/[childId]` |
| 10 | Get Invoices | HTTP Request | GET `/api/whatsapp/invoices/[familyId]` |
| 11 | Get Photos | HTTP Request | GET `/api/whatsapp/photos/[childId]` |
| 12 | Get Incidents | HTTP Request | GET `/api/whatsapp/incidents/[childId]` |
| 13 | Get Public Info | HTTP Request | GET `/api/whatsapp/public-info` |
| 14 | Create Lead | HTTP Request | POST `/api/whatsapp/create-lead` |
| 15 | AI Response Generator | OpenAI/Anthropic | Genera respuesta natural |
| 16 | Log Message | HTTP Request | POST `/api/whatsapp/log-message` |
| 17 | Send WhatsApp | Evolution API Node | Envía respuesta |
| 18 | Send Photos | Evolution API Node | Envía fotos si aplica |
| 19 | Error Handler | NoOp | Maneja errores |

**Credenciales necesarias en n8n:**
```
1. Evolution API:
   - Name: "Evolution API"
   - Base URL: https://evo.henocmarketing.com
   - API Key: [tu API key]

2. ChildCare Pro API:
   - Name: "ChildCare Pro"
   - Base URL: https://tu-app.vercel.app/api
   - Header Auth: X-API-Key = [crear en settings]

3. OpenAI (o Anthropic):
   - Name: "OpenAI"
   - API Key: [tu API key]
```

**Tareas:**
- [ ] Instalar nodo community `n8n-nodes-evolution-api` en n8n
- [ ] Crear credenciales en n8n
- [ ] Crear workflow base
- [ ] Implementar webhook trigger
- [ ] Implementar extracción de datos
- [ ] Implementar filtro de mensajes propios
- [ ] Implementar identificación con API
- [ ] Implementar router padre/prospecto
- [ ] Implementar AI intent detection
- [ ] Implementar router de intenciones
- [ ] Conectar con todas las APIs del sistema
- [ ] Implementar AI response generation
- [ ] Implementar logging de mensajes
- [ ] Implementar envío con Evolution API
- [ ] Implementar envío de fotos
- [ ] Implementar error handling
- [ ] Testing completo con escenarios

**Estimación:** 24-32 horas

---

### 2.2 Instalación del Nodo Community en n8n
**Prioridad:** P1

Para instalar el nodo de Evolution API en tu n8n:

1. **Accede a n8n** → https://n8n.henocmarketing.com
2. **Settings** → **Community Nodes**
3. **Install** → `n8n-nodes-evolution-api`
4. **Reiniciar n8n** (desde Easypanel)

Alternativamente, en Easypanel:
```bash
# En el contenedor de n8n
npm install n8n-nodes-evolution-api

# O agregar en docker-compose/environment:
N8N_COMMUNITY_PACKAGES="n8n-nodes-evolution-api"
```

**Tareas:**
- [ ] Instalar nodo community en n8n
- [ ] Verificar que aparece en el editor
- [ ] Configurar credenciales de Evolution API
- [ ] Probar conexión

**Estimación:** 1-2 horas

---

### 2.3 Detección de Intención (AI)
**Prioridad:** P1

**Intenciones a detectar:**

| Intent | Ejemplos de mensaje | Respuesta |
|--------|---------------------|-----------|
| `daily_summary` | "Cómo estuvo mi hijo", "Qué hizo hoy", "Resumen del día" | Resumen completo |
| `attendance` | "Ya llegó", "A qué hora lo recogieron", "Fue hoy" | Estado de asistencia |
| `meals` | "Qué comió", "Comió bien" | Info de comidas |
| `nap` | "Durmió bien", "Cuánto durmió" | Info de siesta |
| `invoices` | "Cuánto debo", "Mi factura", "Quiero pagar" | Estado de cuenta + link pago |
| `photos` | "Fotos", "Envíame fotos" | Fotos del día |
| `incidents` | "Qué pasó", "Se lastimó" | Info de incidentes |
| `hours` | "Horas VPK", "School Readiness" | Horas de programa |
| `info` | "Horarios", "Precios", "Dirección" | Info pública |
| `tour` | "Quiero visitar", "Agendar tour" | Crear cita |
| `greeting` | "Hola", "Buenos días" | Saludo + menú |
| `unknown` | Cualquier otro | Mensaje de ayuda |

**Prompt para AI:**
```
Analiza el siguiente mensaje de WhatsApp y determina la intención del usuario.
Contexto: Sistema de guardería infantil (daycare).

Mensaje: "{mensaje}"

Responde SOLO con el nombre del intent:
- daily_summary
- attendance
- meals
- nap
- invoices
- photos
- incidents
- hours
- info
- tour
- greeting
- unknown

Si el mensaje menciona un nombre de niño, extrae también: child_name
```

**Estimación:** 6-8 horas

---

### 2.4 Generación de Respuestas (AI)
**Prioridad:** P1

**Prompt para generar respuestas:**
```
Eres el asistente virtual de {daycare_name}, una guardería infantil.
Tu nombre es {bot_name}.

DATOS DISPONIBLES:
{json_data}

REGLAS:
1. Responde en español, de forma amigable y profesional
2. Usa emojis apropiados pero no excesivos
3. Máximo 500 caracteres por mensaje
4. Si hay fotos, menciona que las enviarás a continuación
5. Si hay facturas pendientes, incluye el monto exacto
6. Siempre ofrece ayuda adicional al final

Genera una respuesta natural basada en los datos.
```

**Estimación:** 4-6 horas

---

### 2.5 Manejo de Contexto Multi-Hijo
**Prioridad:** P2

Si una familia tiene múltiples hijos:

```
Padre: "Cómo estuvo mi hijo"
Bot: "Veo que tienes 2 niños registrados:
      1️⃣ Sofia (4 años) - Salón Mariposas
      2️⃣ Miguel (2 años) - Salón Ositos

      ¿De cuál quieres información?"

Padre: "Sofia"
Bot: [Guarda contexto: current_child = Sofia]
     [Muestra resumen de Sofia]

Padre: "Y Miguel?"
Bot: [Cambia contexto: current_child = Miguel]
     [Muestra resumen de Miguel]
```

**Tareas:**
- [ ] Implementar lógica de selección de hijo
- [ ] Guardar contexto en whatsapp_sessions
- [ ] Manejar cambio de contexto
- [ ] Timeout de sesión (30 min)

**Estimación:** 6-8 horas

---

### 2.6 Flujo de Prospectos (Leads)
**Prioridad:** P2

```
Prospecto: "Hola, quisiera información"
Bot: "¡Hola! Bienvenido a {daycare_name} 👋

     Somos una guardería licenciada por DCF en {ciudad}.

     ¿En qué puedo ayudarte?
     1️⃣ Precios y programas
     2️⃣ Horarios de atención
     3️⃣ Agendar una visita
     4️⃣ Hablar con alguien"

Prospecto: "1"
Bot: "📋 NUESTROS PROGRAMAS:

     • VPK (4 años): GRATIS 🎉
     • Infantes (0-1): $XXX/semana
     • Toddlers (1-2): $XXX/semana
     • Pre-K (3-4): $XXX/semana

     ¿Te gustaría agendar un tour para conocernos?"

Prospecto: "Sí"
Bot: "¡Perfecto! Para agendar tu visita necesito:

     📝 Tu nombre completo:"

Prospecto: "Juan Pérez"
Bot: "📧 Tu email:"
...
[Crea lead + appointment en el sistema]
```

**Tareas:**
- [ ] Diseñar flujo conversacional de prospectos
- [ ] Implementar recolección de datos
- [ ] Crear lead automáticamente
- [ ] Crear appointment automáticamente
- [ ] Notificar al daycare de nuevo lead

**Estimación:** 8-10 horas

---

# FASE 3: ADMIN PANEL - CONFIGURACIÓN WHATSAPP
## Prioridad: MEDIA | Duración: 1 semana

### 3.1 Página de Configuración WhatsApp (QR Scanning)
**Prioridad:** P2
**Ubicación:** `app/dashboard/settings/whatsapp/page.tsx`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN DE WHATSAPP                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ESTADO DE CONEXIÓN                                                  │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                              │   │   │
│  │  │  SI DESCONECTADO:                                            │   │   │
│  │  │  ┌─────────────────┐                                         │   │   │
│  │  │  │    █▀▀▀▀▀▀▀█    │  Escanea este código QR                │   │   │
│  │  │  │    █ QR    █    │  con tu WhatsApp Business              │   │   │
│  │  │  │    █ CODE  █    │                                         │   │   │
│  │  │  │    █▄▄▄▄▄▄▄█    │  1. Abre WhatsApp en tu teléfono       │   │   │
│  │  │  └─────────────────┘  2. Ve a Configuración > Dispositivos  │   │   │
│  │  │                       3. Toca "Vincular un dispositivo"      │   │   │
│  │  │  [Refrescar QR]       4. Escanea este código                 │   │   │
│  │  │                                                              │   │   │
│  │  │  SI CONECTADO:                                               │   │   │
│  │  │  ✅ WhatsApp Conectado                                       │   │   │
│  │  │  Número: +1 (305) 555-0001                                   │   │   │
│  │  │  Conectado desde: 26 Enero 2026, 10:30 AM                    │   │   │
│  │  │  Última actividad: Hace 2 minutos                            │   │   │
│  │  │                                                              │   │   │
│  │  │  [Desconectar WhatsApp]                                      │   │   │
│  │  │                                                              │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CONFIGURACIÓN DEL BOT                                               │   │
│  │                                                                      │   │
│  │  Nombre del asistente: [Asistente Virtual    ]                      │   │
│  │                                                                      │   │
│  │  Mensaje de bienvenida:                                             │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ ¡Hola! Soy el asistente virtual de {daycare_name}.          │   │   │
│  │  │ ¿En qué puedo ayudarte hoy?                                  │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  Horario de atención:                                               │   │
│  │  Inicio: [07:00] Fin: [18:00]                                       │   │
│  │                                                                      │   │
│  │  Mensaje fuera de horario:                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ Gracias por tu mensaje. Nuestro horario de atención es de   │   │   │
│  │  │ 7am a 6pm. Te responderemos lo antes posible.               │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  Opciones:                                                          │   │
│  │  [✓] Habilitar respuestas con IA                                    │   │
│  │  [✓] Permitir envío de fotos                                        │   │
│  │  [✓] Permitir pagos de facturas                                     │   │
│  │                                                                      │   │
│  │  [Guardar Configuración]                                            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ESTADÍSTICAS (Últimos 7 días)                                       │   │
│  │                                                                      │   │
│  │  Mensajes recibidos: 234                                            │   │
│  │  Mensajes enviados: 256                                             │   │
│  │  Usuarios únicos: 45                                                │   │
│  │  Tiempo promedio de respuesta: 3.2 segundos                         │   │
│  │                                                                      │   │
│  │  Intenciones más comunes:                                           │   │
│  │  1. Resumen diario (45%)                                            │   │
│  │  2. Fotos (23%)                                                     │   │
│  │  3. Facturas (15%)                                                  │   │
│  │  4. Asistencia (10%)                                                │   │
│  │  5. Otros (7%)                                                      │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- [ ] Mostrar estado de conexión (connected/disconnected)
- [ ] Mostrar QR code si desconectado (refrescar cada 30s)
- [ ] Botón para desconectar WhatsApp
- [ ] Configurar nombre del bot
- [ ] Configurar mensaje de bienvenida
- [ ] Configurar horario de atención
- [ ] Configurar mensaje fuera de horario
- [ ] Toggles para opciones (IA, fotos, pagos)
- [ ] Mostrar estadísticas básicas

**Estimación:** 12-16 horas

---

### 3.2 Historial de Conversaciones
**Prioridad:** P3
**Ubicación:** `app/dashboard/communication/whatsapp/page.tsx`

**Funcionalidades:**
- [ ] Ver todas las conversaciones
- [ ] Filtrar por familia/prospecto
- [ ] Buscar en mensajes
- [ ] Exportar conversación

**Estimación:** 6-8 horas

---

# FASE 4: AUTOMATIZACIÓN FINANCIERA
## Prioridad: MEDIA | Duración: 5-6 semanas

### 4.1 Sincronización Billing ↔ Contabilidad
**Prioridad:** P1 (dentro de finanzas)
**Archivos a modificar:**
- `features/billing/services/billing.service.ts`
- `features/accounting/services/accounting.service.ts`

**Tareas:**
- [ ] Crear income_transaction al crear factura
- [ ] Actualizar transaction al registrar pago
- [ ] Sincronizar con webhook de Stripe
- [ ] Manejar pagos parciales
- [ ] Manejar cancelaciones/reembolsos

**Estimación:** 16-20 horas

---

### 4.2 Reportes Financieros Reales
**Prioridad:** P1
**Archivos a modificar:**
- `app/dashboard/accounting/reports/page.tsx`
- `features/accounting/services/accounting.service.ts`

**Reportes:**
- [ ] Estado de Resultados (P&L) mensual/anual
- [ ] Balance General
- [ ] Flujo de Caja
- [ ] Comparativo mes vs mes anterior

**Estimación:** 12-16 horas

---

### 4.3 Cuentas por Cobrar (A/R Aging)
**Prioridad:** P1
**Ubicación:** `app/dashboard/accounting/receivables/page.tsx`

**Funcionalidades:**
- [ ] Reporte de facturas vencidas
- [ ] Aging buckets: Current, 30, 60, 90+ días
- [ ] Acciones de cobranza
- [ ] Envío automático de recordatorios

**Estimación:** 10-14 horas

---

### 4.4 Reconciliación Bancaria
**Prioridad:** P2
**Ubicación:** `app/dashboard/accounting/reconciliation/page.tsx`

**Funcionalidades:**
- [ ] Cargar estado de cuenta (CSV/OFX)
- [ ] Matching automático de transacciones
- [ ] Resolver discrepancias manualmente
- [ ] Reporte de reconciliación

**Estimación:** 24-32 horas

---

### 4.5 Nómina Básica
**Prioridad:** P2
**Ubicación:** `app/dashboard/accounting/payroll/page.tsx`

**Funcionalidades:**
- [ ] Crear período de pago
- [ ] Calcular: Gross, Federal, State, SS, Medicare, Net
- [ ] Generar pay stubs (PDF)
- [ ] Reporte de obligaciones tributarias
- [ ] Integrar con staff attendance

**Estimación:** 20-28 horas

---

### 4.6 Presupuestos
**Prioridad:** P3
**Ubicación:** `app/dashboard/accounting/budgets/page.tsx`

**Funcionalidades:**
- [ ] Crear presupuesto anual por categoría
- [ ] Comparar Budget vs Actual
- [ ] Alertas cuando excede presupuesto
- [ ] Proyecciones

**Estimación:** 16-20 horas

---

### 4.7 Exportación para CPA
**Prioridad:** P3
**Ubicación:** `app/dashboard/accounting/export/page.tsx`

**Formatos:**
- [ ] CSV estándar
- [ ] QuickBooks IIF
- [ ] Excel con múltiples hojas

**Estimación:** 8-12 horas

---

# CRONOGRAMA VISUAL

```
SEMANA 1  ████████████████████████████████████████
          │ FASE 1: Infraestructura Base
          │ • Migración BD
          │ • APIs WhatsApp
          │ • Servicio WhatsApp

SEMANA 2  ████████████████████████████████████████
          │ FASE 2: Workflow n8n (Parte 1)
          │ • Diseño workflow
          │ • Configurar Twilio
          │ • Nodos básicos

SEMANA 3  ████████████████████████████████████████
          │ FASE 2: Workflow n8n (Parte 2)
          │ • AI Intent Detection
          │ • AI Response Generation
          │ • Conexión con APIs

SEMANA 4  ████████████████████████████████████████
          │ FASE 2: Workflow n8n (Parte 3)
          │ • Multi-hijo
          │ • Flujo prospectos
          │ • Testing completo

SEMANA 5  ████████████████████████████████████████
          │ FASE 3: Admin Panel WhatsApp
          │ • Configuración
          │ • Historial conversaciones

SEMANA 6  ████████████████████████████████████████
          │ FASE 4: Finanzas (Parte 1)
          │ • Sync Billing ↔ Accounting
          │ • Reportes reales

SEMANA 7  ████████████████████████████████████████
          │ FASE 4: Finanzas (Parte 2)
          │ • A/R Aging
          │ • Reconciliación bancaria (inicio)

SEMANA 8  ████████████████████████████████████████
          │ FASE 4: Finanzas (Parte 3)
          │ • Reconciliación bancaria (fin)
          │ • Nómina básica (inicio)

SEMANA 9  ████████████████████████████████████████
          │ FASE 4: Finanzas (Parte 4)
          │ • Nómina básica (fin)
          │ • Presupuestos

SEMANA 10 ████████████████████████████████████████
          │ FASE 4: Finanzas (Parte 5)
          │ • Exportación CPA
          │ • Testing final
          │ • Documentación
```

---

# RESUMEN DE ARCHIVOS A CREAR

## Base de Datos
```
supabase/migrations/
└── 022_whatsapp_infrastructure.sql
```

## APIs (Backend)
```
app/api/whatsapp/
├── identify/route.ts
├── child-summary/[childId]/route.ts
├── attendance/[childId]/route.ts
├── invoices/[familyId]/route.ts
├── incidents/[childId]/route.ts
├── photos/[childId]/route.ts
├── public-info/[orgId]/route.ts
├── create-lead/route.ts
└── create-appointment/route.ts
```

## Feature WhatsApp
```
features/whatsapp/
├── services/
│   ├── whatsapp-identity.service.ts
│   ├── whatsapp-data.service.ts
│   ├── whatsapp-session.service.ts
│   └── whatsapp-templates.service.ts
├── types/
│   └── whatsapp.types.ts
└── utils/
    └── format-for-whatsapp.ts
```

## Páginas Admin
```
app/dashboard/
├── settings/whatsapp/page.tsx
├── communication/whatsapp/page.tsx
└── accounting/
    ├── receivables/page.tsx
    ├── reconciliation/page.tsx
    ├── payroll/page.tsx
    ├── budgets/page.tsx
    └── export/page.tsx
```

## n8n
```
Workflows:
└── WhatsApp Agent Multi-Tenant (1 workflow)
```

---

# DEPENDENCIAS Y BLOQUEOS

```
┌─────────────────┐
│ Migración BD    │ ◄─── BLOQUEA TODO
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ APIs WhatsApp   │ ◄─── Bloquea Workflow n8n
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Workflow n8n    │     │ Admin Panel     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │ WhatsApp COMPLETO   │
         └─────────────────────┘


┌─────────────────┐
│ Sync Billing    │ ◄─── BLOQUEA Reportes Reales
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Reportes Reales │
└────────┬────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ A/R Aging    │ │ Reconcil.    │ │ Nómina       │
└──────────────┘ └──────────────┘ └──────────────┘
         │              │              │
         └──────────────┴──────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ FINANZAS COMPLETO   │
              └─────────────────────┘
```

---

# CHECKLIST EJECUTIVO

## Semana 1 - Infraestructura
- [ ] Crear migración `022_whatsapp_infrastructure.sql`
- [ ] Ejecutar migración en Supabase
- [ ] Crear tipos TypeScript para WhatsApp
- [ ] Crear `/api/whatsapp/identify`
- [ ] Crear `/api/whatsapp/child-summary/[childId]`
- [ ] Crear `/api/whatsapp/attendance/[childId]`
- [ ] Crear `/api/whatsapp/invoices/[familyId]`
- [ ] Crear `/api/whatsapp/incidents/[childId]`
- [ ] Crear `/api/whatsapp/photos/[childId]`
- [ ] Crear `/api/whatsapp/public-info/[orgId]`
- [ ] Crear feature `whatsapp-identity.service.ts`
- [ ] Crear feature `whatsapp-data.service.ts`

## Semana 2-4 - Workflow n8n
- [ ] Configurar cuenta Twilio
- [ ] Obtener número WhatsApp Business
- [ ] Crear workflow en n8n
- [ ] Implementar webhook trigger
- [ ] Implementar identificación de tenant
- [ ] Implementar AI intent detection
- [ ] Conectar con todas las APIs
- [ ] Implementar AI response generation
- [ ] Testing completo

## Semana 5 - Admin Panel
- [ ] Crear página configuración WhatsApp
- [ ] Crear página historial conversaciones

## Semana 6-10 - Finanzas
- [ ] Sincronizar billing con contabilidad
- [ ] Reportes P&L reales
- [ ] A/R Aging report
- [ ] Reconciliación bancaria
- [ ] Nómina básica
- [ ] Presupuestos
- [ ] Exportación CPA

---

# MÉTRICAS DE ÉXITO

## WhatsApp Agent
| Métrica | Objetivo |
|---------|----------|
| Tiempo de respuesta | < 5 segundos |
| Tasa de comprensión de intención | > 90% |
| Satisfacción de padres | > 4.5/5 |
| Reducción de llamadas al daycare | > 40% |

## Automatización Financiera
| Métrica | Objetivo |
|---------|----------|
| Tiempo para cerrar mes | < 2 horas (antes: 8h) |
| Precisión de reconciliación | > 95% automático |
| Reducción de errores de facturación | > 80% |
| Tiempo de generación de reportes | < 10 segundos |

---

*Documento creado: 2026-01-26*
*Última actualización: 2026-01-26*
*Versión: 1.0*
