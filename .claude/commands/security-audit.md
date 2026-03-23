---
description: "Ejecuta una auditoria de seguridad completa del proyecto siguiendo OWASP Top 10"
---

# Security Audit

Ejecuta una auditoria de seguridad completa del proyecto actual.

## Proceso

### Paso 1: Escanear el codebase

Busca en todo el proyecto los siguientes patrones de riesgo:

1. **Inputs sin validar** - Busca API routes y Server Actions que reciban datos del usuario sin Zod
2. **Secrets expuestos** - Busca strings que parezcan API keys, tokens, o passwords hardcodeados
3. **SQL injection** - Busca queries raw o `.rpc()` sin sanitización
4. **XSS** - Busca `dangerouslySetInnerHTML` o outputs sin escapar
5. **RLS faltante** - Usa Supabase MCP para verificar que TODAS las tablas tengan RLS habilitado

### Paso 2: Verificar configuración

1. Verifica que `.env.local` está en `.gitignore`
2. Verifica que CORS no usa wildcard `*` en producción
3. Verifica que no hay `console.log` con datos sensibles del usuario
4. Ejecuta `npm audit` para vulnerabilidades de dependencias

### Paso 3: Generar reporte

Genera un reporte con el formato:

```
## 🔒 Security Audit Report - [Fecha]

### 🔴 Critico (arreglar inmediatamente)
- [Issue]: [Archivo:Linea] - [Como arreglarlo]

### 🟠 Alto Riesgo
- [Issue]: [Archivo:Linea] - [Como arreglarlo]

### 🟡 Medio Riesgo
- [Issue]: [Archivo:Linea] - [Como arreglarlo]

### 🟢 Bajo Riesgo / Informativo
- [Issue]: [Archivo:Linea] - [Como arreglarlo]

### Resumen
- Total: X issues | Critico: X | Alto: X | Medio: X | Bajo: X
```

### Paso 4: Preguntar al usuario

Pregunta si quiere que arregles los issues criticos y de alto riesgo automaticamente.
