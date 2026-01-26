-- =====================================================
-- WHATSAPP EVOLUTION API - MULTI-TENANT INFRASTRUCTURE
-- Migration: 022_whatsapp_evolution.sql
-- Date: 2026-01-26
-- Description: Tables for WhatsApp integration with Evolution API
-- =====================================================

-- 1. Instancias de WhatsApp (1 por organizacion)
-- Cada daycare tiene su propia instancia de Evolution API
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  instance_name TEXT UNIQUE NOT NULL,           -- "sunny-kids" (slug de la org)
  phone_number TEXT,                             -- +13055550001 (se llena cuando conecta)
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'qr_pending')),
  qr_code_base64 TEXT,                           -- QR actual si esta desconectado
  webhook_url TEXT,                              -- URL del webhook configurado en Evolution
  profile_name TEXT,                             -- Nombre del perfil de WhatsApp
  profile_picture_url TEXT,                      -- URL de la foto de perfil
  connected_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para busqueda por instance_name (usado por n8n)
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_name ON whatsapp_instances(instance_name);

-- 2. Sesiones de conversacion (contexto de chat)
-- Mantiene el estado de la conversacion con cada usuario
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  remote_jid TEXT NOT NULL,                      -- 1234567890@s.whatsapp.net
  guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  current_child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  is_prospect BOOLEAN DEFAULT false,
  prospect_data JSONB DEFAULT '{}',              -- {name, email, phone, interest, etc.}
  session_context JSONB DEFAULT '{}',            -- {last_intent, conversation_step, etc.}
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, remote_jid)
);

-- Indices para busqueda rapida
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_jid ON whatsapp_sessions(remote_jid, organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_guardian ON whatsapp_sessions(guardian_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_expires ON whatsapp_sessions(expires_at);

-- 3. Historial de mensajes
-- Guarda todos los mensajes entrantes y salientes
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  remote_jid TEXT NOT NULL,
  message_id TEXT NOT NULL,                      -- ID de WhatsApp (para tracking)
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL DEFAULT 'text',     -- text, image, audio, document, video, sticker, location
  content TEXT,                                  -- Contenido del mensaje (texto)
  media_url TEXT,                                -- URL de media (si aplica)
  media_mimetype TEXT,
  media_filename TEXT,
  intent_detected TEXT,                          -- Intencion detectada por AI
  confidence_score DECIMAL(3,2),                 -- Confianza de la deteccion (0.00-1.00)
  response_time_ms INTEGER,                      -- Tiempo de respuesta en ms
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processing', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para busqueda de mensajes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session ON whatsapp_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_org_date ON whatsapp_messages(organization_id, created_at DESC);

-- 4. Templates de respuesta personalizables por organizacion
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,                    -- greeting, menu, invoice_reminder, daily_summary, etc.
  template_name TEXT NOT NULL,                   -- Nombre legible para UI
  content TEXT NOT NULL,                         -- Contenido con variables: {child_name}, {amount}, etc.
  variables TEXT[] DEFAULT '{}',                 -- Lista de variables disponibles
  language TEXT DEFAULT 'es',                    -- es, en
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, template_key, language)
);

-- 5. Configuracion del bot por organizacion
CREATE TABLE IF NOT EXISTS whatsapp_bot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  bot_name TEXT DEFAULT 'Asistente',
  welcome_message TEXT DEFAULT '¡Hola! Soy el asistente virtual de {daycare_name}. ¿En qué puedo ayudarte?',
  menu_message TEXT DEFAULT 'Puedo ayudarte con:\n1️⃣ Resumen del día\n2️⃣ Fotos\n3️⃣ Facturas\n4️⃣ Asistencia\n\n¿Qué necesitas?',
  business_hours_start TIME DEFAULT '07:00',
  business_hours_end TIME DEFAULT '18:00',
  timezone TEXT DEFAULT 'America/New_York',
  after_hours_message TEXT DEFAULT 'Gracias por tu mensaje. Nuestro horario de atención es de 7am a 6pm. Te responderemos lo antes posible.',
  unknown_intent_message TEXT DEFAULT 'No entendí tu mensaje. ¿Podrías reformularlo o elegir una opción del menú?',
  enable_ai_responses BOOLEAN DEFAULT true,
  enable_photo_sharing BOOLEAN DEFAULT true,
  enable_invoice_payments BOOLEAN DEFAULT true,
  enable_attendance_notifications BOOLEAN DEFAULT true,
  enable_incident_notifications BOOLEAN DEFAULT true,
  max_messages_per_hour INTEGER DEFAULT 100,
  response_delay_ms INTEGER DEFAULT 1000,        -- Delay para parecer mas natural
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Estadisticas de uso (para analytics)
CREATE TABLE IF NOT EXISTS whatsapp_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_received INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  new_prospects INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  intents_breakdown JSONB DEFAULT '{}',          -- {"daily_summary": 45, "invoices": 23, "photos": 15}
  errors_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, date)
);

-- Indice para reportes
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_org_date ON whatsapp_analytics(organization_id, date DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_whatsapp_instances_updated_at
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_bot_config_updated_at
  BEFORE UPDATE ON whatsapp_bot_config
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

-- Trigger para incrementar message_count en sesion
CREATE OR REPLACE FUNCTION increment_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_sessions
  SET
    message_count = message_count + 1,
    last_message_at = NOW(),
    expires_at = NOW() + INTERVAL '30 minutes'
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_message_count
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_message_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics ENABLE ROW LEVEL SECURITY;

-- Politicas: Solo ver datos de tu organizacion
CREATE POLICY "Users can view own org whatsapp_instances"
  ON whatsapp_instances FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own org whatsapp_instances"
  ON whatsapp_instances FOR UPDATE
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

CREATE POLICY "Users can view own org whatsapp_templates"
  ON whatsapp_templates FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage own org whatsapp_bot_config"
  ON whatsapp_bot_config FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view own org whatsapp_analytics"
  ON whatsapp_analytics FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Politica para service role (APIs de n8n)
-- Las APIs usan service_role key que bypasea RLS

-- =====================================================
-- SEED: Templates por defecto (se insertan via codigo)
-- =====================================================

-- Funcion para insertar templates por defecto cuando se crea una organizacion
CREATE OR REPLACE FUNCTION create_default_whatsapp_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar templates por defecto
  INSERT INTO whatsapp_templates (organization_id, template_key, template_name, content, variables, language) VALUES
    (NEW.id, 'greeting', 'Saludo', '¡Hola! Soy el asistente virtual de {daycare_name}. ¿En qué puedo ayudarte hoy?', ARRAY['daycare_name'], 'es'),
    (NEW.id, 'menu', 'Menu Principal', 'Puedo ayudarte con:\n\n1️⃣ Resumen del día de tu hijo\n2️⃣ Ver fotos de hoy\n3️⃣ Estado de facturas\n4️⃣ Asistencia\n5️⃣ Hablar con alguien\n\n¿Qué necesitas?', ARRAY[]::TEXT[], 'es'),
    (NEW.id, 'select_child', 'Seleccionar Hijo', 'Veo que tienes {child_count} niños registrados:\n\n{children_list}\n\n¿De cuál quieres información?', ARRAY['child_count', 'children_list'], 'es'),
    (NEW.id, 'daily_summary', 'Resumen Diario', '📋 *Resumen de {child_name}* - {date}\n\n🍽️ *Comidas:*\n{meals}\n\n😴 *Siesta:*\n{nap}\n\n😊 *Humor:* {mood}\n\n🎨 *Actividades:*\n{activities}\n\n¿Necesitas algo más?', ARRAY['child_name', 'date', 'meals', 'nap', 'mood', 'activities'], 'es'),
    (NEW.id, 'invoice_status', 'Estado de Factura', '💰 *Estado de cuenta - Familia {family_name}*\n\nFactura: {invoice_number}\nPeríodo: {period}\nTotal: ${amount}\nEstado: {status}\nVence: {due_date}\n\n{payment_link}', ARRAY['family_name', 'invoice_number', 'period', 'amount', 'status', 'due_date', 'payment_link'], 'es'),
    (NEW.id, 'attendance', 'Asistencia', '📍 *Asistencia de {child_name}* - {date}\n\n⏰ Entrada: {check_in_time}\n🚗 Trajo: {drop_off_person}\n\n{check_out_info}', ARRAY['child_name', 'date', 'check_in_time', 'drop_off_person', 'check_out_info'], 'es'),
    (NEW.id, 'photos', 'Fotos', '📸 Aquí están las fotos de {child_name} de hoy:\n\n{photo_count} foto(s) disponible(s)', ARRAY['child_name', 'photo_count'], 'es'),
    (NEW.id, 'incident', 'Incidente', '⚠️ *Reporte de Incidente*\n\nNiño: {child_name}\nFecha: {date}\nTipo: {incident_type}\n\n{description}\n\nAcción tomada: {action_taken}', ARRAY['child_name', 'date', 'incident_type', 'description', 'action_taken'], 'es'),
    (NEW.id, 'prospect_welcome', 'Bienvenida Prospecto', '¡Hola! Bienvenido a {daycare_name} 👋\n\nSomos una guardería licenciada por DCF.\n\n¿En qué puedo ayudarte?\n1️⃣ Precios y programas\n2️⃣ Horarios\n3️⃣ Agendar una visita\n4️⃣ Hablar con alguien', ARRAY['daycare_name'], 'es'),
    (NEW.id, 'prospect_prices', 'Precios Prospecto', '📋 *Nuestros Programas:*\n\n{programs_list}\n\n¿Te gustaría agendar un tour para conocernos?', ARRAY['programs_list'], 'es'),
    (NEW.id, 'tour_scheduled', 'Tour Agendado', '✅ *¡Tour agendado!*\n\nFecha: {tour_date}\nHora: {tour_time}\nDirección: {address}\n\nTe esperamos. Si necesitas cancelar o cambiar la cita, avísanos.', ARRAY['tour_date', 'tour_time', 'address'], 'es'),
    (NEW.id, 'after_hours', 'Fuera de Horario', 'Gracias por tu mensaje. Nuestro horario de atención es de {start_time} a {end_time}.\n\nTe responderemos lo antes posible. Si es urgente, llama al {phone}.', ARRAY['start_time', 'end_time', 'phone'], 'es'),
    (NEW.id, 'unknown', 'No Entendido', 'Disculpa, no entendí tu mensaje. ¿Podrías reformularlo?\n\nO escribe "menu" para ver las opciones disponibles.', ARRAY[]::TEXT[], 'es'),
    (NEW.id, 'error', 'Error', 'Lo siento, hubo un problema procesando tu solicitud. Por favor intenta de nuevo o escribe "menu".', ARRAY[]::TEXT[], 'es')
  ON CONFLICT (organization_id, template_key, language) DO NOTHING;

  -- Insertar configuracion de bot por defecto
  INSERT INTO whatsapp_bot_config (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear templates cuando se crea organizacion
-- Nota: Descomentar si quieres que se creen automaticamente
-- CREATE TRIGGER trigger_create_whatsapp_templates
--   AFTER INSERT ON organizations
--   FOR EACH ROW
--   EXECUTE FUNCTION create_default_whatsapp_templates();

-- =====================================================
-- FUNCIONES UTILES
-- =====================================================

-- Funcion para limpiar sesiones expiradas (ejecutar con cron)
CREATE OR REPLACE FUNCTION cleanup_expired_whatsapp_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM whatsapp_sessions
  WHERE expires_at < NOW() AND is_prospect = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Funcion para obtener o crear sesion
CREATE OR REPLACE FUNCTION get_or_create_whatsapp_session(
  p_organization_id UUID,
  p_instance_name TEXT,
  p_remote_jid TEXT,
  p_guardian_id UUID DEFAULT NULL,
  p_family_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Buscar sesion existente no expirada
  SELECT id INTO v_session_id
  FROM whatsapp_sessions
  WHERE organization_id = p_organization_id
    AND remote_jid = p_remote_jid
    AND expires_at > NOW();

  -- Si existe, renovar expiracion y retornar
  IF v_session_id IS NOT NULL THEN
    UPDATE whatsapp_sessions
    SET expires_at = NOW() + INTERVAL '30 minutes'
    WHERE id = v_session_id;
    RETURN v_session_id;
  END IF;

  -- Si no existe, crear nueva
  INSERT INTO whatsapp_sessions (
    organization_id,
    instance_name,
    remote_jid,
    guardian_id,
    family_id,
    is_prospect
  ) VALUES (
    p_organization_id,
    p_instance_name,
    p_remote_jid,
    p_guardian_id,
    p_family_id,
    p_guardian_id IS NULL
  )
  ON CONFLICT (organization_id, remote_jid)
  DO UPDATE SET
    expires_at = NOW() + INTERVAL '30 minutes',
    guardian_id = COALESCE(EXCLUDED.guardian_id, whatsapp_sessions.guardian_id),
    family_id = COALESCE(EXCLUDED.family_id, whatsapp_sessions.family_id)
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Funcion para actualizar analytics diarios
CREATE OR REPLACE FUNCTION update_whatsapp_analytics(
  p_organization_id UUID,
  p_direction TEXT,
  p_is_new_user BOOLEAN DEFAULT false,
  p_is_prospect BOOLEAN DEFAULT false,
  p_intent TEXT DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO whatsapp_analytics (
    organization_id,
    date,
    messages_received,
    messages_sent,
    unique_users,
    new_prospects,
    avg_response_time_ms,
    intents_breakdown
  ) VALUES (
    p_organization_id,
    CURRENT_DATE,
    CASE WHEN p_direction = 'inbound' THEN 1 ELSE 0 END,
    CASE WHEN p_direction = 'outbound' THEN 1 ELSE 0 END,
    CASE WHEN p_is_new_user THEN 1 ELSE 0 END,
    CASE WHEN p_is_prospect AND p_is_new_user THEN 1 ELSE 0 END,
    p_response_time_ms,
    CASE WHEN p_intent IS NOT NULL THEN jsonb_build_object(p_intent, 1) ELSE '{}'::jsonb END
  )
  ON CONFLICT (organization_id, date) DO UPDATE SET
    messages_received = whatsapp_analytics.messages_received +
      CASE WHEN p_direction = 'inbound' THEN 1 ELSE 0 END,
    messages_sent = whatsapp_analytics.messages_sent +
      CASE WHEN p_direction = 'outbound' THEN 1 ELSE 0 END,
    unique_users = whatsapp_analytics.unique_users +
      CASE WHEN p_is_new_user THEN 1 ELSE 0 END,
    new_prospects = whatsapp_analytics.new_prospects +
      CASE WHEN p_is_prospect AND p_is_new_user THEN 1 ELSE 0 END,
    avg_response_time_ms = CASE
      WHEN p_response_time_ms IS NOT NULL THEN
        (COALESCE(whatsapp_analytics.avg_response_time_ms, 0) + p_response_time_ms) / 2
      ELSE whatsapp_analytics.avg_response_time_ms
    END,
    intents_breakdown = CASE
      WHEN p_intent IS NOT NULL THEN
        whatsapp_analytics.intents_breakdown ||
        jsonb_build_object(p_intent, COALESCE((whatsapp_analytics.intents_breakdown->>p_intent)::int, 0) + 1)
      ELSE whatsapp_analytics.intents_breakdown
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE whatsapp_instances IS 'Instancias de WhatsApp Evolution API por organizacion';
COMMENT ON TABLE whatsapp_sessions IS 'Sesiones de conversacion con padres/prospectos';
COMMENT ON TABLE whatsapp_messages IS 'Historial de mensajes entrantes y salientes';
COMMENT ON TABLE whatsapp_templates IS 'Templates de respuesta personalizables';
COMMENT ON TABLE whatsapp_bot_config IS 'Configuracion del bot por organizacion';
COMMENT ON TABLE whatsapp_analytics IS 'Estadisticas de uso diarias';

COMMENT ON COLUMN whatsapp_instances.instance_name IS 'Slug de la organizacion, usado como ID en Evolution API';
COMMENT ON COLUMN whatsapp_sessions.remote_jid IS 'ID de WhatsApp del usuario (numero@s.whatsapp.net)';
COMMENT ON COLUMN whatsapp_messages.intent_detected IS 'Intencion detectada por AI: daily_summary, invoices, photos, etc.';
