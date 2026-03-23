---
description: "Pulido profesional del producto. Usa Playwright MCP para validacion visual automatica, edge cases, performance y detalles que hacen sentir el producto 'terminado'."
argument-hint: "[url-base o ruta-especifica a pulir]"
---

# Pulido Profesional: De "funciona" a "impresiona"

Fase de pulido que transforma un producto funcional en algo profesional que el usuario se sienta orgulloso de mostrar.

## Principio Fundamental

> **"La diferencia entre un proyecto de hackathon y un producto real esta en los detalles. Este command cierra esa brecha."**

## Input: $ARGUMENTS

Si se proporciona una URL, usarla como base. Si no, detectar automaticamente del proyecto.

---

## Fase 1: Auditoria Visual Automatizada (Playwright MCP)

### 1.1 Inventario de Paginas

Escanear el proyecto para identificar TODAS las paginas/rutas:

```bash
# Buscar en app/ todas las page.tsx
# Generar lista de rutas accesibles
```

Crear inventario:
```yaml
paginas:
  - ruta: "/"
    tipo: "publica"
    prioridad: "alta"
  - ruta: "/dashboard"
    tipo: "autenticada"
    prioridad: "alta"
  - ruta: "/dashboard/[feature]"
    tipo: "autenticada"
    prioridad: "media"
```

### 1.2 Bucle Visual por Pagina

**Para CADA pagina del inventario, ejecutar este bucle:**

```
PARA cada pagina:
  1. Navegar con Playwright → browser_navigate(url)
  2. Esperar carga completa → browser_wait_for(tiempo o texto)
  3. Screenshot Desktop → browser_take_screenshot()
  4. Analizar screenshot contra criterios de calidad
  5. Si hay problemas → registrar y priorizar
  6. Repetir con viewport mobile (375x812)
  7. Repetir con viewport tablet (768x1024)
```

### 1.3 Criterios de Calidad Visual

Evaluar cada screenshot contra:

```yaml
diseno:
  - consistencia_colores: "Todos los colores siguen el design system?"
  - tipografia: "Jerarquia visual clara? Tamanos apropiados?"
  - espaciado: "Padding/margin consistentes? Nada apretado?"
  - alineacion: "Elementos alineados correctamente?"
  - iconos: "Todos los iconos cargan? Tamano consistente?"

contenido:
  - textos_placeholder: "Quedan 'Lorem ipsum' o textos de prueba?"
  - textos_cortados: "Algun texto se corta o desborda?"
  - estados_vacios: "Las paginas sin datos muestran mensaje apropiado?"
  - mensajes_error: "Los errores son amigables (no tecnicos)?"

responsive:
  - mobile: "Se ve bien en 375px? Nada se rompe?"
  - tablet: "Se adapta correctamente a 768px?"
  - desktop: "Usa bien el espacio en pantallas grandes?"

carga:
  - loading_states: "Hay indicadores de carga donde se necesitan?"
  - skeleton_screens: "Se usan skeletons en vez de spinners genericos?"
  - transiciones: "Las animaciones son suaves, no bruscas?"
```

---

## Fase 2: Edge Cases y Manejo de Errores

### 2.1 Escenarios de Error

Probar sistematicamente:

```yaml
formularios:
  - enviar_vacio: "Que pasa si envio un formulario vacio?"
  - datos_invalidos: "Email malo, numeros negativos, textos largos?"
  - doble_click: "Que pasa si hago doble click en 'Guardar'?"
  - caracteres_especiales: "Emojis, caracteres unicode, inyeccion SQL?"

navegacion:
  - url_inexistente: "Hay pagina 404 personalizada?"
  - back_button: "El boton atras del browser funciona correctamente?"
  - deep_links: "Las URLs directas funcionan? (compartir link)"
  - sesion_expirada: "Que pasa cuando expira la sesion?"

datos:
  - lista_vacia: "Se muestra empty state cuando no hay datos?"
  - muchos_datos: "Se ve bien con 100+ registros? Hay paginacion?"
  - datos_largos: "Nombres de 50+ caracteres rompen el layout?"
  - carga_lenta: "Si la API tarda 3s, hay feedback visual?"

permisos:
  - sin_autenticacion: "Rutas protegidas redirigen al login?"
  - sin_autorizacion: "Acciones no permitidas muestran error claro?"
```

### 2.2 Corregir Problemas Encontrados

Para cada problema encontrado:

```
1. Registrar en TodoWrite con prioridad
2. Corregir empezando por prioridad ALTA
3. Re-validar con Playwright despues de cada fix
4. Iterar hasta que pase todos los criterios
```

Prioridades:
- **CRITICA**: Rompe funcionalidad o se ve roto
- **ALTA**: Afecta experiencia de usuario significativamente
- **MEDIA**: Detalle visual o UX menor
- **BAJA**: Nice-to-have, pulido extra

---

## Fase 3: Performance y Velocidad

### 3.1 Chequeo Rapido

```yaml
verificar:
  - imagenes_optimizadas: "Se usa next/image con sizes y priority?"
  - componentes_lazy: "Se usa dynamic() para componentes pesados?"
  - bundle_size: "Algun import innecesario infla el bundle?"
  - api_calls: "Hay llamadas redundantes? Se puede cachear?"
  - re-renders: "Componentes se re-renderizan sin necesidad?"
```

### 3.2 Optimizaciones Rapidas

Solo implementar optimizaciones que:
- Tomen menos de 15 minutos cada una
- Tengan impacto visible para el usuario
- No requieran refactoring mayor

```
Ejemplos de optimizaciones rapidas:
- Agregar loading="lazy" a imagenes below the fold
- Memoizar componentes pesados con React.memo
- Agregar debounce a inputs de busqueda
- Comprimir imagenes que pesan >100KB
- Prefetch de rutas frecuentes con next/link
```

---

## Fase 4: Detalles que Hacen la Diferencia

### 4.1 Micro-interacciones

```yaml
agregar_si_faltan:
  - hover_effects: "Botones y links tienen hover visual?"
  - focus_states: "Inputs y botones tienen focus ring accesible?"
  - click_feedback: "Al hacer click hay feedback inmediato?"
  - transitions: "Cambios de estado tienen transicion suave (150-300ms)?"
  - loading_button: "Botones de submit muestran estado de carga?"
```

### 4.2 Metadatos y SEO Basico

```yaml
verificar:
  - title_tag: "Cada pagina tiene <title> descriptivo?"
  - meta_description: "Paginas publicas tienen meta description?"
  - favicon: "Hay favicon personalizado (no default Next.js)?"
  - og_tags: "Paginas publicas tienen Open Graph para compartir?"
  - manifest: "El PWA manifest tiene nombre e icono correcto?"
```

### 4.3 Accesibilidad Basica

```yaml
verificar:
  - alt_text: "Todas las imagenes tienen alt text?"
  - keyboard_nav: "Se puede navegar con Tab?"
  - contraste: "Texto tiene suficiente contraste vs fondo?"
  - labels: "Todos los inputs tienen label asociado?"
  - aria: "Botones con solo icono tienen aria-label?"
```

---

## Fase 5: Reporte de Pulido

### 5.1 Generar Reporte

```markdown
# Reporte de Pulido - [Nombre del Proyecto]
**Fecha:** [YYYY-MM-DD]
**Paginas auditadas:** [N]
**Viewports probados:** Desktop, Tablet, Mobile

## Resumen
- Problemas CRITICOS encontrados: [N] → [N] resueltos
- Problemas ALTOS encontrados: [N] → [N] resueltos
- Problemas MEDIOS encontrados: [N] → [N] resueltos
- Optimizaciones aplicadas: [N]

## Detalle por Pagina
### [Pagina 1]
- Estado: OK / Necesita atencion
- Screenshots: [antes/despues si hubo cambios]
- Problemas resueltos: [lista]

### [Pagina N]
...

## Performance
- Imagenes optimizadas: SI/NO
- Loading states: SI/NO
- Lazy loading: SI/NO

## Deuda de Pulido (pendiente para v2)
- [Detalle 1]: [Por que se postergo]
- [Detalle 2]: [Por que se postergo]

## Veredicto
[LISTO PARA MOSTRAR / NECESITA MAS TRABAJO]
```

---

## Reglas de Comportamiento

### HACER
- Usar Playwright para CADA validacion visual (no asumir que se ve bien)
- Probar en 3 viewports minimo (desktop, tablet, mobile)
- Priorizar fixes por impacto al usuario
- Re-validar despues de cada cambio
- Ser critico — el objetivo es "orgulloso de mostrar"

### NO HACER
- No asumir que algo se ve bien sin screenshot
- No hacer refactoring mayor (eso es otra tarea)
- No optimizar prematuramente lo que no se nota
- No agregar features nuevas (solo pulir lo existente)
- No ignorar mobile — muchos usuarios estan en telefono

### CRITERIO FINAL
```
Preguntate: "Si le muestro esto a un inversionista/cliente en 5 minutos,
se ve profesional o se ve como proyecto de estudiante?"

Si la respuesta es "proyecto de estudiante", sigue puliendo.
```

---

## Uso

```bash
# Pulir todo el proyecto
/pulir

# Pulir URL especifica
/pulir https://miapp.vercel.app/dashboard

# Pulir solo mobile
/pulir --mobile

# Solo auditar sin corregir (reporte)
/pulir --audit-only
```

**Prerequisito:** El proyecto debe estar funcional (ya paso por /ejecutar-prp y /bucle-agentico)

**Siguiente paso despues de /pulir:**
```bash
/entregar → Entrega y documentacion final
```

---

*SaaS Factory v3: Los detalles son los que convierten "funciona" en "impresiona".*
