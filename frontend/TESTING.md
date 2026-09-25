# Pruebas del frontend

Revisión: 2026-09-25. Fuentes: `jest.config.cjs`, `playwright.config.ts`,
`package.json` y los tests existentes.

## Herramientas y estructura

Jest + React Testing Library ejecutan los tests de `__tests__/` junto a cada
página, componente, hook, servicio, store o utilidad. La configuración carga
`jest.setup.ts`, resuelve `@/` desde `frontend/` y adapta Swiper para Jest.

Los stores activos son `authStore`, `cartStore` y `blogStore`. El catálogo tiene
pruebas de página y de `peluchService`. Los componentes compartidos incluyen
BlogCard, layout, componentes administrativos y animaciones.

Los fixtures compartidos están en `lib/__tests__/fixtures.ts`: `mockPeluches`,
`mockBlogs` y `mockCartItems`. Sus tipos proceden de `lib/types.ts`.

## Ejemplo de comportamiento

Basado en `components/blog/__tests__/BlogCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import BlogCard from '../BlogCard';
import { mockBlogs } from '../../../lib/__tests__/fixtures';

it('links to the blog detail', () => {
  const blog = mockBlogs[0];
  render(<BlogCard blog={blog} />);
  expect(screen.getByRole('link')).toHaveAttribute('href', `/blogs/${blog.id}`);
});
```

Cada test verifica un comportamiento observable. Usar Arrange–Act–Assert,
parametrización para variantes y mocks en fronteras externas. Limpiar estado
compartido entre tests y esperar efectos asíncronos con `waitFor` cuando corresponda.

## Comandos locales

Desde `frontend/` del worktree propio:

```bash
npm test -- app/__tests__/page.test.tsx --runInBand
npm run test:watch -- components/blog/__tests__/BlogCard.test.tsx
npx playwright test e2e/public/navigation.spec.ts --project="Desktop Chrome"
```

- Máximo 20 tests por ejecución y tres comandos por ciclo.
- E2E: máximo dos specs por llamada; usar `--grep` para acotar el lote si hace falta.
- Siempre seleccionar archivos. La suite completa y la cobertura global se validan
  en CI, no mediante `test:all` para una corrección puntual.
- Los runners generales siguen disponibles para el conductor autorizado de CI.

## Cobertura

Jest usa V8 y recolecta `app/`, `components/` y `lib/`, excluyendo declaraciones,
tests, E2E, `app/layout.tsx`, CSS y `lib/types.ts`.

| Ámbito | Branches | Functions | Lines | Statements |
|---|---:|---:|---:|---:|
| Global | 65 % | 45 % | 65 % | 65 % |
| `lib/stores/` | 75 % | 75 % | 75 % | 75 % |
| `lib/utils/` | 90 % | 90 % | 90 % | 90 % |

Estos umbrales proceden de `jest.config.cjs`. No se rebajan por retirar código
sin consumidores. Los reportes viven en `coverage/`, incluyendo
`coverage-summary.json` y `lcov-report/index.html`. El CI genera también
`jest-results.json`; ambos destinos se ignoran en Git.

## E2E y CI

Playwright tiene habilitado Desktop Chrome. Mobile Chrome y Tablet están
comentados en la configuración aunque existan aliases npm. El frontend local de
Playwright usa el puerto 3001 y el backend el 8000; fuera de CI se reutilizan
servidores existentes. Usar bases aisladas para las pruebas.

El workflow de tests ejecuta backend, Jest y dos shards E2E, combina sus reportes
y publica el resumen de cobertura. El workflow separado de Test Quality Gate
analiza la calidad del corpus. Un porcentaje de cobertura no sustituye comprobar
el resultado que cada test observa.

El contrato E2E está en `e2e/flow-definitions.json`; las interacciones se documentan
en `../docs/USER_FLOW_MAP.md`. Véase [la guía E2E](e2e/README.md).

## Mantenimiento

Al cambiar comportamiento, actualizar los fixtures y los tests afectados.
Al retirar un módulo sin consumidores, retirar su test y los mocks que sólo lo
sostenían, conservando las pruebas de las páginas activas.

Antes de entregar: ejecutar la regresión acotada, revisar el build si afecta al
frontend y confirmar todos los checks del PR sobre su último commit.
