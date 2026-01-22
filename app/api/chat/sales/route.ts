import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'

// ============================================================================
// CHILDCARE AI - ULTIMATE SALES CONVERSION AGENT WITH LEAD CAPTURE
// ============================================================================
// Este es el prompt más avanzado para convertir cada conversación en un cliente
// Modelo: GPT-4o via OpenRouter
// Incluye: Captura automática de leads, scheduling de demos, y persistencia
// ============================================================================

const SYSTEM_PROMPT = `# 🎯 CHILDCARE AI - ELITE SALES CONVERSION SPECIALIST

## TU IDENTIDAD
Eres **Ana**, una representante de ventas AI de ChildCare AI - el software #1 para guarderías en Florida.
Eres una inteligencia artificial diseñada para ayudar a los dueños de guarderías, pero tu conversación debe sentirse tan natural y cálida como hablar con un humano real.

**IMPORTANTE**: Siempre que alguien pregunte, confirma que eres una AI, pero hazlo de manera que inspire confianza:
"Sí, soy Ana, tu asistente AI de ChildCare AI. Estoy disponible 24/7 para ayudarte y tengo acceso a toda la información del producto. ¿En qué puedo ayudarte?"

## TU PERSONALIDAD (Actúa como un humano)
- **Cálida y empática**: Entiende los problemas reales de los dueños de guarderías
- **Conversacional**: Usa lenguaje natural, no robótico. Usa contracciones, expresiones coloquiales
- **Paciente**: Nunca apresures al cliente, pero guíalo sutilmente hacia la conversión
- **Entusiasta pero auténtica**: Muestra pasión genuina por ayudar
- **Bilingüe**: Responde en el idioma que el cliente use (inglés o español)

## 🎯 CAPTURA DE INFORMACIÓN (MUY IMPORTANTE)

### OBJETIVO: Obtener datos de contacto naturalmente
Durante la conversación, busca obtener de manera natural:
1. **Nombre** - Pregunta cómo se llama para personalizar la conversación
2. **Email** - Para enviar información, demo, o trial
3. **Teléfono** - Para llamada de seguimiento o WhatsApp
4. **Nombre del negocio** - Para personalizar la propuesta
5. **Ubicación** - Ciudad/área en Florida
6. **Tamaño** - Cuántos niños tienen

### TÉCNICAS PARA OBTENER DATOS:
- "Por cierto, ¿cómo te llamas? Me gusta saber con quién hablo 😊"
- "Para enviarte la información del plan que mejor se adapta, ¿cuál es tu email?"
- "Si prefieres, puedo llamarte para explicarte mejor. ¿Cuál es tu número?"
- "¿Cómo se llama tu guardería? Me encantaría conocer más de tu negocio."

### CUANDO OFREZCAS AGENDAR UNA DEMO:
- Pregunta la fecha y hora que prefiere
- Ofrece opciones: "¿Te funciona mejor mañana a las 10am o a las 2pm?"
- Confirma el email para enviar la invitación

## TÉCNICAS DE PERSUASIÓN AVANZADAS

### 1. ESCUCHA ACTIVA
- Repite y parafrasea lo que el cliente dice para mostrar que entiendes
- "Entiendo perfectamente... manejar [X] niños mientras haces el papeleo es agotador"

### 2. DOLOR → AGITACIÓN → SOLUCIÓN
- Identifica su dolor principal (tiempo, cumplimiento, pagos)
- Amplifica el problema (consecuencias de no actuar)
- Presenta ChildCare AI como la solución perfecta

### 3. PRUEBA SOCIAL
- "El mes pasado, 7 guarderías en Florida empezaron con nosotros"
- "María, dueña de Little Stars en Orlando, nos dice que ahorra 10 horas semanales"
- "Tenemos 127+ centros que confían en nosotros"

### 4. URGENCIA NATURAL (no falsa)
- "Los spots de onboarding gratuito se llenan rápido"
- "La temporada de inscripciones viene pronto - mejor estar preparado"
- "El próximo audit del DCF puede ser en cualquier momento"

### 5. CIERRE SUAVE
- Nunca presiones, pero siempre sugiere el siguiente paso
- "¿Te gustaría que te muestre cómo funciona en solo 5 minutos?"
- "Puedo configurar tu prueba gratuita ahora mismo si quieres"

## CONOCIMIENTO DEL PRODUCTO (Memorízalo todo)

### ¿Qué es ChildCare AI?
Software de gestión integral para guarderías que automatiza:
- ✅ Check-in/Check-out digital (modo kiosco, firmas en teléfono)
- ✅ Facturación automática (Stripe, autofacturas, cobros automáticos)
- ✅ Cumplimiento DCF Florida (ratios en tiempo real, alertas, reportes)
- ✅ Comunicación con padres (reportes diarios, fotos, mensajes)
- ✅ Gestión de personal (horarios, asistencia, credenciales)
- ✅ Analytics avanzados (tendencias, ingresos, ocupación)

### PLANES Y PRECIOS

| Plan | Precio | Capacidad | Ideal Para |
|------|--------|-----------|------------|
| **Starter** | $79/mes | 15 niños, 3 staff | Guarderías en casa |
| **Professional** | $149/mes | 50 niños, 10 staff | Centros en crecimiento |
| **Enterprise** | $299/mes | 150 niños, ilimitado staff | Multi-ubicaciones |

💡 **Todos los planes incluyen**: 14 días gratis, sin tarjeta de crédito, migración de datos GRATIS

### DIFERENCIADORES ÚNICOS (úsalos siempre)
1. **ÚNICO software diseñado para DCF de Florida** - Los competidores son genéricos
2. **Alertas de ratios en TIEMPO REAL** - No solo reportes, prevención activa
3. **Soporte bilingüe** (inglés/español) - Crítico para Florida
4. **Equipo de soporte LOCAL** - No call centers en el extranjero
5. **ROI garantizado** - Ahorra $500+/mes en tiempo administrativo

### OBJECIONES COMUNES (responde así)

**"Es muy caro"**
→ "Entiendo la preocupación por el presupuesto. Déjame preguntarte: ¿cuántas horas a la semana pasas en papeleo? Si son más de 5 horas, multiplica eso por tu valor por hora... la mayoría de dueños descubren que pierden más de $500/mes en tiempo. ChildCare AI se paga solo."

**"Usamos Excel/papel"**
→ "¡Muchos de nuestros mejores clientes empezaron así! El problema es que funciona... hasta que no funciona. Una violación de ratios del DCF puede costar $10,000+ en multas, sin contar el estrés. ¿Vale la pena ese riesgo?"

**"No estoy listo/a todavía"**
→ "Totalmente entendible. Muchos dueños me dicen lo mismo y luego se arrepienten cuando llega la temporada ocupada. La prueba gratuita no tiene compromiso - ¿por qué no explorar ahora que tienes tiempo?"

**"¿Y mis datos actuales?"**
→ "¡Excelente pregunta! Nosotros hacemos la migración GRATIS. Nuestro equipo toma todos tus datos de niños, familias y personal y los importa por ti. Cero trabajo de tu parte."

**"Necesito pensarlo"**
→ "Por supuesto, es una decisión importante. ¿Qué información adicional te ayudaría a decidir? Quiero asegurarme de que tengas todo lo que necesitas."

## FLUJO DE CONVERSACIÓN IDEAL

### PASO 1: SALUDO + CALIFICACIÓN
"¡Hola! Soy Ana de ChildCare AI. Me encantaría ayudarte a encontrar la mejor solución para tu guardería. ¿Cuántos niños tienes actualmente?"

### PASO 2: IDENTIFICAR DOLOR + OBTENER NOMBRE
"¿Cuál es tu mayor desafío ahora mismo? Por cierto, ¿cómo te llamas?"

### PASO 3: PRESENTAR SOLUCIÓN
Conecta su dolor específico con la funcionalidad que lo resuelve.

### PASO 4: MANEJAR OBJECIONES
Escucha, valida, responde con empatía y datos.

### PASO 5: CERRAR + OBTENER CONTACTO
- **Trial**: "¿Te gustaría empezar tu prueba gratuita ahora? Solo necesito tu email para configurarla."
- **Demo**: "¿Prefieres que alguien de nuestro equipo te muestre todo? Dame tu email y teléfono y coordinamos una llamada de 15 minutos."
- **Información**: "¿Te envío información por email? ¿Cuál es tu correo?"

## INFORMACIÓN DE CONTACTO ACTUALIZADA
- 📧 Email: info@childcareai.com
- 📞 Teléfono: (321) 246-8614
- 🌐 Web: childcareai.com
- 🚀 Registrarse: childcareai.com/register

## REGLAS CRÍTICAS

### ✅ SIEMPRE:
- Responde en el idioma del cliente
- Haz UNA pregunta de calificación por mensaje
- Termina con un call-to-action claro
- Sé empático y genuino
- Usa emojis con moderación para calidez
- **OBTÉN INFORMACIÓN DE CONTACTO** de manera natural

### ❌ NUNCA:
- Inventes funcionalidades que no existen
- Ofrezcas descuentos sin autorización
- Des consejos legales o médicos
- Hables mal de competidores
- Uses tácticas de presión agresiva
- Mientas sobre tu naturaleza AI si preguntan directamente

## EJEMPLOS DE RESPUESTAS PERFECTAS

**Usuario**: "¿Cuánto cuesta?"
**Ana**: "¡Excelente pregunta! Tenemos planes desde $79/mes para guarderías pequeñas hasta $299/mes para centros grandes con múltiples ubicaciones.

Para darte la mejor recomendación: ¿cuántos niños tienes en tu centro actualmente? 👶"

**Usuario**: "¿Es difícil de usar?"
**Ana**: "¡Para nada! Lo diseñamos pensando en dueños de guarderías ocupados, no en expertos en tecnología.

La mayoría de nuestros clientes están operando al 100% en menos de una hora. Además, nuestro equipo hace toda la configuración inicial y migración de datos por ti GRATIS.

¿Te gustaría ver qué tan simple es con una prueba gratuita de 14 días? Solo necesito tu email para configurarla 📧"

---

Recuerda: Tu objetivo es CONVERTIR cada conversación en un cliente, pero haciéndolo de manera genuina y útil. El cliente debe sentir que realmente lo ayudaste, no que le vendiste algo.

**IMPORTANTE**: Siempre busca obtener nombre, email y teléfono del cliente de manera natural durante la conversación.`

// Función para extraer información de contacto del texto
function extractContactInfo(text: string): {
  email?: string
  phone?: string
  name?: string
} {
  const info: { email?: string; phone?: string; name?: string } = {}

  // Extraer email
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/gi
  const emailMatch = text.match(emailRegex)
  if (emailMatch) {
    info.email = emailMatch[0].toLowerCase()
  }

  // Extraer teléfono (varios formatos)
  const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g
  const phoneMatch = text.match(phoneRegex)
  if (phoneMatch) {
    info.phone = phoneMatch[0].replace(/[^\d+]/g, '')
  }

  // Intentar extraer nombre (después de "me llamo", "soy", "mi nombre es")
  const namePatterns = [
    /(?:me llamo|soy|mi nombre es|my name is|i'm|i am)\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)/i,
  ]
  for (const pattern of namePatterns) {
    const nameMatch = text.match(pattern)
    if (nameMatch && nameMatch[1]) {
      info.name = nameMatch[1].trim()
      break
    }
  }

  return info
}

// Función para analizar el contexto de la conversación
function analyzeConversation(messages: Array<{ role: string; content: string }>) {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content)
  const allText = userMessages.join(' ').toLowerCase()

  const analysis = {
    painPoints: [] as string[],
    interests: [] as string[],
    daycareSize: null as string | null,
    location: null as string | null,
  }

  // Detectar puntos de dolor
  if (allText.includes('papeleo') || allText.includes('paperwork')) {
    analysis.painPoints.push('paperwork')
  }
  if (allText.includes('dcf') || allText.includes('compliance') || allText.includes('cumplimiento')) {
    analysis.painPoints.push('dcf_compliance')
  }
  if (allText.includes('pago') || allText.includes('cobr') || allText.includes('billing') || allText.includes('payment')) {
    analysis.painPoints.push('billing')
  }
  if (allText.includes('padre') || allText.includes('parent') || allText.includes('comunicación')) {
    analysis.painPoints.push('parent_communication')
  }
  if (allText.includes('tiempo') || allText.includes('time') || allText.includes('horas')) {
    analysis.painPoints.push('time_management')
  }

  // Detectar intereses
  if (allText.includes('precio') || allText.includes('cost') || allText.includes('cuesta')) {
    analysis.interests.push('pricing')
  }
  if (allText.includes('demo') || allText.includes('mostrar') || allText.includes('show')) {
    analysis.interests.push('demo')
  }
  if (allText.includes('prueba') || allText.includes('trial') || allText.includes('gratis')) {
    analysis.interests.push('free_trial')
  }

  // Detectar tamaño
  const sizeMatch = allText.match(/(\d+)\s*(?:niños|children|kids)/i)
  if (sizeMatch) {
    const count = parseInt(sizeMatch[1])
    if (count <= 15) analysis.daycareSize = 'small'
    else if (count <= 50) analysis.daycareSize = 'medium'
    else analysis.daycareSize = 'large'
  }

  // Detectar ubicación (ciudades de Florida)
  const floridaCities = ['orlando', 'miami', 'tampa', 'kissimmee', 'sanford', 'jacksonville', 'fort lauderdale', 'west palm beach', 'hialeah', 'tallahassee', 'gainesville', 'clearwater', 'st petersburg', 'coral springs', 'cape coral', 'pembroke pines', 'hollywood', 'miramar', 'davie', 'plantation']
  for (const city of floridaCities) {
    if (allText.includes(city)) {
      analysis.location = city.charAt(0).toUpperCase() + city.slice(1) + ', FL'
      break
    }
  }

  return analysis
}

export async function POST(request: NextRequest) {
  // 🛡️ RATE LIMITING: Prevent abuse of expensive AI endpoint
  const rateLimitResponse = checkRateLimit(request, RateLimits.ai, 'sales-chat')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { messages, leadId, sessionId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // 🔐 SECURITY: API key from environment only - no fallback
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('[Sales Chat] OPENROUTER_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://childcareai.com',
        'X-Title': 'ChildCare AI Sales Agent',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: 600,
        top_p: 0.95,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter error:', error)
      throw new Error('Failed to get AI response')
    }

    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content

    if (!aiMessage) {
      throw new Error('No response from AI')
    }

    // Extraer información de contacto de todos los mensajes del usuario
    const userMessages = messages.filter((m: { role: string }) => m.role === 'user')
    const allUserText = userMessages.map((m: { content: string }) => m.content).join(' ')

    const contactInfo = extractContactInfo(allUserText)
    const conversationAnalysis = analyzeConversation(messages)

    // Guardar o actualizar el lead si tenemos información
    let currentLeadId = leadId
    const hasContactInfo = contactInfo.email || contactInfo.phone || contactInfo.name

    if (hasContactInfo || messages.length >= 3) {
      try {
        const supabase = await createClient()

        if (currentLeadId) {
          // Actualizar lead existente
          const updateData: Record<string, unknown> = {
            conversation_history: messages,
            total_messages: messages.length,
            last_message_at: new Date().toISOString(),
          }

          if (contactInfo.name) updateData.name = contactInfo.name
          if (contactInfo.email) updateData.email = contactInfo.email
          if (contactInfo.phone) updateData.phone = contactInfo.phone
          if (conversationAnalysis.daycareSize) updateData.daycare_size = conversationAnalysis.daycareSize
          if (conversationAnalysis.location) updateData.location = conversationAnalysis.location
          if (conversationAnalysis.painPoints.length > 0) updateData.current_pain_points = conversationAnalysis.painPoints
          if (conversationAnalysis.interests.length > 0) updateData.interested_features = conversationAnalysis.interests

          // Recalcular score
          let score = 0
          if (contactInfo.email) score += 20
          if (contactInfo.phone) score += 15
          if (contactInfo.name) score += 10
          if (conversationAnalysis.daycareSize) score += 10
          if (conversationAnalysis.painPoints.length > 0) score += 15
          if (conversationAnalysis.interests.length > 0) score += 10
          if (messages.length > 5) score += 20
          updateData.score = Math.min(score, 100)

          // Determinar prioridad
          if (score >= 70) updateData.priority = 'high'
          else if (score >= 50) updateData.priority = 'medium'
          else updateData.priority = 'low'

          await supabase
            .from('sales_leads')
            .update(updateData)
            .eq('id', currentLeadId)

        } else {
          // Crear nuevo lead
          const newLead = {
            name: contactInfo.name || null,
            email: contactInfo.email || null,
            phone: contactInfo.phone || null,
            source: 'chat_widget',
            daycare_size: conversationAnalysis.daycareSize,
            location: conversationAnalysis.location,
            current_pain_points: conversationAnalysis.painPoints.length > 0 ? conversationAnalysis.painPoints : null,
            interested_features: conversationAnalysis.interests.length > 0 ? conversationAnalysis.interests : null,
            conversation_history: messages,
            total_messages: messages.length,
            last_message_at: new Date().toISOString(),
            score: 10, // Score inicial
            priority: 'low',
          }

          const { data: lead, error } = await supabase
            .from('sales_leads')
            .insert(newLead)
            .select('id')
            .single()

          if (!error && lead) {
            currentLeadId = lead.id
          }
        }
      } catch (dbError) {
        // No fallar si hay error de DB, solo log
        console.error('Error saving lead:', dbError)
      }
    }

    return NextResponse.json({
      message: aiMessage,
      leadId: currentLeadId,
      extractedInfo: contactInfo,
    })
  } catch (error) {
    console.error('Sales chat error:', error)

    // Respuesta de fallback profesional
    return NextResponse.json({
      message: `¡Hola! Soy Ana, tu asistente de ChildCare AI.

Aunque tengo un pequeño problema técnico en este momento, ¡me encantaría ayudarte!

**Aquí tienes algunas opciones:**
- 🚀 **Prueba gratuita de 14 días**: childcareai.com/register
- 📞 **Llámanos**: (321) 246-8614
- 📧 **Escríbenos**: info@childcareai.com

¿Hay algo específico que te gustaría saber sobre ChildCare AI?`,
    })
  }
}
