# ChildCare Pro — Production Readiness Checklist

Estado tras el hardening de preproducción (PR #1 `fix/preprod-security-hardening`).

## 1. Estado de la base de datos (Supabase)

Las migraciones `027`–`035` ya están **aplicadas en producción**. Verificación:

| Control | Antes | Ahora |
|---|---|---|
| Tablas públicas con RLS desactivado | 19 | **0** |
| Advisor `rls_disabled_in_public` (ERROR) | 19 | **0** |
| `security_definer_view` (ERROR) | 19 | **0** |
| `function_search_path_mutable` (WARN) | 52 | **0** |
| `sensitive_columns_exposed` (ERROR) | 1 | **0** |
| `rls_policy_always_true` en billing | sí | **no** |

Para reproducir el esquema desde cero (staging/DR): correr `supabase/migrations/000`–`035` en orden contra un Postgres vacío. (Recomendado: añadir un job de CI que lo valide.)

## 2. Variables de entorno requeridas (Vercel)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...           # usado por service-role (webhook, n8n, onboarding)

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...                # obligatorio: el webhook rechaza sin firma

# WhatsApp / n8n (OBLIGATORIO si se usa el bot)
N8N_WEBHOOK_SECRET=...                   # la auth n8n FALLA CERRADA sin esto
EVOLUTION_API_KEY=...
EVOLUTION_API_URL=...

# IA
OPENROUTER_API_KEY=...
ANTHROPIC_API_KEY=...

# Email
RESEND_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=admin@tudominio.com

# Observabilidad (opcional, activa Sentry)
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_ORG=...                           # para subir sourcemaps en build
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...
```

## 3. Acciones manuales antes del lanzamiento

- [ ] **Rotar** la `anon key` y la `service-role key` de Supabase (estuvieron expuestas mientras RLS estaba apagado).
- [ ] Configurar `N8N_WEBHOOK_SECRET` (string aleatorio dedicado, NO la service-role key).
- [ ] Stripe Dashboard → Webhooks → endpoint `https://tu-dominio.com/api/stripe/webhook`, eventos:
      `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`,
      `checkout.session.completed`, `customer.subscription.trial_will_end`.
- [ ] Supabase → Auth → Policies → activar **Leaked Password Protection** (HaveIBeenPwned).
- [ ] Supabase → Storage → revisar buckets públicos con listado habilitado.
- [ ] (Opcional) Crear proyecto Sentry y setear `NEXT_PUBLIC_SENTRY_DSN`.
- [ ] Desplegar la rama / mergear el PR (las migraciones ya están vivas; el código no).

## 4. Onboarding de un cliente nuevo (tenant)

Self-service en `/register`: el cliente ingresa nombre de la guardería + email/password →
se crea su organización con **trial de 14 días** y cuenta de owner. Robusto bajo RLS,
provisión server-side atómica (sobrevive confirmación de email; OAuth crea su propia org).
Verificado: la creación siembra 40 categorías contables por defecto.

## 5. Monitoreo

- Health check: `GET /api/health` (DB + Stripe + email). Apuntar un uptime monitor aquí.
- Errores: Sentry (una vez configurado el DSN) + Vercel logs.

## 6. Follow-ups recomendados (no bloqueantes para el primer cliente)

| Item | Por qué | Cuándo |
|---|---|---|
| Paginación en listas (children/families/attendance/invoices) | Las queries traen tablas completas; se degrada al crecer | Antes de tenants grandes |
| Rate limiter en Redis (Upstash/Vercel KV) | El actual es en memoria, no comparte entre instancias serverless | Antes de tráfico real |
| Tope de gasto diario en endpoints de IA | Evitar denial-of-wallet | Antes de exponer IA pública |
| Revisar grants `EXECUTE` a `anon` en funciones SECURITY DEFINER | Defense-in-depth (WARN del advisor) | Hardening continuo |
| CSP completa (script-src/connect-src) en report-only → enforce | Mitigación XSS | Hardening continuo |
| Validación de env vars con Zod al boot | Fallos claros si falta una var | Cuando convenga |

## 7. CI/CD

`.github/workflows/ci.yml` corre typecheck + lint + build en cada PR/push a `main`.
Configurar como required status check en GitHub. `package-lock.json` está commiteado (`npm ci`).
