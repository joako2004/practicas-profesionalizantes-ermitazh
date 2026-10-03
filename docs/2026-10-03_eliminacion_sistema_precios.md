## Qué se hizo

Lista detallada de todo lo eliminado:

- **PrecioMenu.tsx**: Componente de administración de menú de precios eliminado de `app/admin/propiedades/_components/PrecioMenu.tsx`
- **actualizarMenuPrecios()**: Función server action eliminada de `lib/actions/propiedades.ts`
- **APIs `/api/precios`**: Eliminadas (`route.ts` y `[id]/route.ts`)
- **API `/api/admin/cargar-datos`**: Eliminada (usaba `prisma.precio`)
- **Navegación "Gestión de precios"**: Eliminada del `Sidebar.tsx` administrativo
- **Enlace "Precios"** del `app/admin/page.tsx`: Eliminado
- **Modelo Prisma `Precio`**: Eliminado del `schema.prisma`
- **Relación `Propiedad -> Precio`**: Eliminada del schema (campo `precios: Precio[]`)
- **Enum `TipoDia`**: Eliminado del schema (solo usado por el modelo `Precio`)
- **`PrecioSerializer` y `serializarPrecio`**: Eliminados de `lib/serializers.ts`
- **Interface `PrecioOpcion`**: Eliminada de `lib/actions/propiedades.ts`
- **Rutas asociadas**: `/api/precios` y `/api/precios/[id]` ya no existen

### Decisiones

- Se eliminó `Precio` porque el sistema antiguo de gestión de precios se consideraba obsoleto y no debía repararse, refactorizarse ni reutilizarse.
- Se eliminó `PrecioMenu` porque era el componente UI exclusivo del sistema antiguo de precios.
- Se eliminaron las APIs `/api/precios` porque eran endpoints exclusivos del sistema antiguo.
- Se conservó `calcularPrecio()` reestructurándolo para que use `propiedad.precioBase` y `propiedad.promoSemanal` en lugar de consultar la tabla `Precio`.
- Se conservaron `precioBase` y `promoSemanal` en el modelo `Propiedad` para cálculo público temporal.
- Se eliminó la navegación antigua de precios del sidebar y el admin page.
- Se conservó la administración general de propiedades (`/admin/propiedades`).

### Archivos eliminados

- `app/admin/propiedades/_components/PrecioMenu.tsx`
- `lib/actions/propiedades.ts` (eliminó `actualizarMenuPrecios` y `PrecioOpcion`)
- `app/api/precios/route.ts`
- `app/api/precios/[id]/route.ts`
- `app/api/admin/cargar-datos/route.ts`
- `lib/serializers.ts` (eliminó `PrecioSerializer` y `serializarPrecio`)

### Archivos modificados

- `prisma/schema.prisma` (eliminó modelo `Precio`, relación `precios: Precio[]` de `Propiedad`, y enum `TipoDia`)
- `lib/actions/precios.ts` (reestructuró `calcularPrecio()` para usar `prisma.propiedad` en lugar de `prisma.precio`)
- `lib/actions/propiedades.ts` (eliminó `actualizarMenuPrecios` y `PrecioOpcion`)
- `components/admin/Sidebar.tsx` (eliminó sección "Gestión de precios")
- `app/admin/page.tsx` (eliminó enlace "Precios")
- `lib/serializers.ts` (eliminó `PrecioSerializer` y `serializarPrecio`)
- `app/admin/propiedades/_components/PropiedadCard.tsx` (limpieza de referencias)
- `app/(public)/cabanas/[id]/page.tsx` (verificación de compatibilidad)

### Migración

- **Nombre**: `20261003170530_eliminar_modelo_precio`
- **Qué elimina**: Tabla `Precio` y sus restriccionesForeign key
- **Qué conserva**: Todas las tablas (`Propiedad`, `Reserva`, `Complejo`, `Consulta`, `Resena`, `Imagen`), columnas (`precioBase`, `promoSemanal` en `Propiedad`)

### Verificación

- `npm run lint`: 6 errores pre-existing (no relacionados con esta tarea)
- `npm run build`: Compilación exitosa
- Migración Prisma aplicada: `20261003170530_eliminar_modelo_precio` - elimina tabla `Precio`, conserva `Propiedad` y `Reserva`
- No existen referencias activas a `prisma.precio` en código TypeScript/TSX activo
- No existen referencias activas a `/api/precios` en código activo
- No existen referencias activas a `PrecioMenu` en código activo
- No existen referencias activas a `actualizarMenuPrecios` en código activo

### Pendientes

> Reconstruir desde cero el nuevo sistema de precios.

> Esta tarea elimina completamente el sistema antiguo de precios y deja el proyecto listo para una implementación completamente nueva en una tarea posterior. No se implementó ningún nuevo sistema de precios en esta tarea.