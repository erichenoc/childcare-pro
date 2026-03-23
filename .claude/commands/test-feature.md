---
description: "Genera y ejecuta tests para una feature especifica. Cubre unit tests, integration y edge cases"
---

# Test Feature

Genera tests completos para una feature del proyecto.

## Proceso

### Paso 1: Identificar la feature

Si no se especifica, pregunta:
> Que feature quieres testear? (ej: auth, billing, dashboard)

### Paso 2: Analizar la feature

Lee todos los archivos de la feature:
```
src/features/[feature-name]/
├── components/    → Tests de rendering y interaccion
├── hooks/         → Tests de logica y estado
├── services/      → Tests de API calls (mocks)
├── types/         → Verificar types con TypeScript
└── store/         → Tests de store actions
```

### Paso 3: Generar tests (AAA Pattern)

Para cada archivo, genera tests siguiendo:

```typescript
// ✅ Arrange-Act-Assert
test('should [expected behavior]', () => {
  // Arrange - setup
  const props = { ... };

  // Act - execute
  const result = doSomething(props);

  // Assert - verify
  expect(result).toBe(expected);
});
```

#### Prioridad de tests:
1. **Happy path** - Flujo normal funciona
2. **Edge cases** - Inputs vacios, null, undefined
3. **Error handling** - Errores de API, network, validacion
4. **User interactions** - Clicks, form submissions

### Paso 4: Ejecutar tests

```bash
npm run test -- --coverage --testPathPattern="features/[feature-name]"
```

### Paso 5: Reporte

```
## 🧪 Test Report - [Feature Name]

### Tests Generados
- Components: X tests
- Hooks: X tests
- Services: X tests
- Store: X tests

### Resultados
- ✅ Passing: X
- ❌ Failing: X
- Coverage: X%

### Coverage por archivo
| Archivo | Statements | Branches | Functions | Lines |
|---------|-----------|----------|-----------|-------|
```

Si hay tests fallando, arregla el codigo (no el test) y re-ejecuta.
