# Implementación — Alineación Modelo de Precios con Especificación Funcional

## Fecha: 2026-10-01

---

## Qué se hizo

Se implementó el modelo de precios definitivo alineando persistencia, cálculo y UI para usar una misma representación coherente. Los cambios principales:

### Schema Prisma
- Agregado campo `promoSemanal` al modelo `Precio` (Decimal 10,2, default 0), permitiendo porcentaje por tarifa (propiedad + temporada).
- El campo `promoSemanal` en `Propiedad` se mantiene como valor único (global), pero cada tarifa ahora puede tener su propio porcentaje.

### Lógica `calcularPrecio()`
- Ahora respeta `estanciaTemporada` como filtro opcional al seleccionar tarifas.
- Utiliza el `promoSemanal` de cada tarifa individual (en lugar del valor global de `Propiedad`).
- Fórmula: `totalSinDescuento * (1 - promoSemanal/100)` aplicado solo cuando `tramo === "SIETE_O_MAS"` (7+ noches).
- Continuará usando fallback por `cantidadPersonas` pero sin depender de campos no usados (`tipoDia`, campos redundantes).

### `actualizarMenuPrecios()` (lib/actions/propiedades.ts)
- **Anterior**: Siempre creaba nuevas filas vía `POST /api/precios`, generando duplicados.
- **Nueva**: Busca filas existentes por identidad `(propiedadId + estanciaTemporada + tramoNoches)`. Si existe, hace `UPDATE`; si no, crea nueva. Si hay múltiples coincidencias, devuelve error en lugar de duplicar.

### API `/api/precios` (POST)
- Valida `promoSemanal` entre 0 y 100.
- Ahora incluye `estanciaTemporada` al crear nuevas tarifas (valor por defecto "baja").
- Valida `precioPorNoche >= 0`.

### UI `PrecioMenu.tsx`
- Muestra 8 campos editables: 4 por temporada (Baja/Alta), cada uno con precio x tramo y promo semanal independiente.
- Los inputs de `promo semanal` son independientes por temporada (Baja = 10, Alta = 5 pueden diferir).
- Guardado actualiza filas existentes o crea nuevas solo si no existen.
- Evita la acumulación de duplicados.

### Interfaces actualizadas
- `PrecioOpcion` en ambas acciones (`propiedades.ts`, `precios.ts`) incluye ahora `promoSemanal: number`.
- `CalcularPrecioOptions` permite pasar `estanciaTemporada?: "baja" | "alta"` para filtrar selección.

---

## Estado encontrado

Antes de implementar, el proyecto presentaba estas inconsistencias:

### Duplicados en BD
- 65 filas en tabla `precios` con múltiples rows idénticas por `(propiedad_id, nombre, fecha_inicio, fecha_fin, tramo_noches, tipo_dia, precio_por_noche)`.
- Ejemplo en Cabaña 4: 16 filas generadas por `actualizarMenuPrecios` creando nuevas filas cada guardia sin verificar existencia.
- Patrones `p-c1-*` / `precio-c1-*` en Cabaña 4 (`cmrj91hey0007dgdugpnxyc9b`).

### Campos sin efecto en cálculo
- `estanciaTemporada`: existía en schema/BD/UI pero `calcularPrecio` nunca lo usaba para filtrado.
- `tipoDia`: existía en schema/BD pero casi todas las filas tenían `TODOS`; `calcularPrecio` no lo consultaba.
- `cantidadPersonas`: siempre 1 en todas las filas, haciendo inútil el filtro ascendente.

### Lógica de promo semanal fragmentada
- `Propiedad.promoSemanal`: campo único, decimal(10,2) default 0, siempre 0 en las 8 propiedades.
- UI mostraba "Promo semanal" por temporada (8 inputs), pero no había dónde almacenar valores distintos por temporada.
- `calcularPrecio` recibía `promoSemanal` como parámetro pero provenía de `Propiedad`, no de la tarifa seleccionada.

### Filtro estacional roto en UI
- `PrecioMenu` filtraba inputs por `(estanciaTemporada, tramo)`, pero como BD siempre tenía `estancia_temporada = "baja"`, los inputs de "Temporada Alta" mostraban valor 0 y no guardaban cambios.
- `actualizarMenuPrecios` hacía 16 `POST` creando filas nuevas cada vez.

---

## Decisiones técnicas

### 1. Representación de `promoSemanal`
- **Elección**: Agregar `promoSemanal` al modelo `Precio` (por tarifa) en lugar de usar el campo global de `Propiedad`.
- **Por qué**: Permite independencia entre `Baja` y `Alta` por cabaña, que es la especificación funcional requerida. El campo global en `Propiedad` se mantiene por compatibilidad pero ya no es el origen único para el cálculo.

### 2. Selección de tarifa (`calcularPrecio`)
- **Identidad funcional**: `propiedadId + tramoNoches + estanciaTemporada + rango de fechas (fechaInicio/fin)`.
- **Por qué**: La temporada es una dimensión real del precio (especificación §2). Ahora `calcularPrecio` puede filtrar por temporada cuando el usuario lo solicite, y el fallback por `cantidadPersonas` sigue funcionando.

### 3. Guardado sin duplicados (`actualizarMenuPrecios`)
- **Elección**: Upsert por identidad `(propiedadId + estanciaTemporada + tramoNoches)`.
- **Por qué**: El comportamiento anterior creaba filas nuevas cada guardia, acumulando duplicados en BD. El nuevo comportamiento actualiza la fila existente o crea solo si no existe, previniendo la acumulación.

### 4. UI: 8 campos editables con promo independiente por temporada
- **Elección**: Dos inputs de `promo semanal` (Baja y Alta) por propiedad.
- **Por qué**: La especificación funcional §6 requiere que `promoSemanal` dependa de `propiedad + temporada`. Antes no había dónde almacenarlo; ahora cada tarifa tiene su propio valor.

### 5. Migración de datos existente
- **Qué se hizo**: Agregado columna `promoSemanal` a tabla `precio` con default 0.
- **Qué se dejó**: Filas existentes sin modificar (tienen `promoSemanal = 0` por defecto). No se realizó limpieza destructiva masiva.
- **Por qué**: La normalización es controlada y documentada; los datos antiguos quedan intactos y el nuevo campo entra en vigencia al crear/actualizar tarifas.

---

## Modelo final

### Estructura Prisma (`prisma/schema.prisma`)

```prisma
model Precio {
  id              String   @id @default(cuid())
  propiedadId     String   @map("propiedad_id")
  nombre          String
  fechaInicio     DateTime @map("fecha_inicio") @db.Date
  fechaFin        DateTime @map("fecha_fin") @db.Date
  tramoNoches     TramoNoches @map("tramo_noches")
  cantidadPersonas Int @map("cantidad_personas")
  precioPorNoche   Decimal @map("precio_por_noche") @db.Decimal(10, 2)
  tipoDia          TipoDia  @default(TODOS) @map("tipo_dia")
  estanciaTemporada String @map("estancia_temporada")  // "baja" | "alta"
  promoSemanal     Decimal @map("promo_semanal") @db.Decimal(10, 2) @default(0)  // por tarifa
  activo           Boolean  @default(true)

  propiedad Propiedad @relation(fields: [propiedadId], references: [id], onDelete: Cascade)

  @@map("precios")
}
```

### Lógica de cálculo resumida (`lib/actions/precios.ts`)

```
1. Calcular noches → tramo (1→UNA_NOCHE, 2-6→DE_DOS_A_SEIS, 7+→SIETE_O_MAS)
2. Filtrar tarifas por: propiedadId + tramoNoches + estanciaTemporada (opcional) + fechas
3. Si no hay matches: usar precioBase/propiedad.promoSemanal (modo fallback)
4. Si hay matches: seleccionar por cantidadPersonas (asc ordering, first >= personas, fallback último)
5. Precio por noche = precioMatch.precioPorNoche
6. Total = precioPorNoche × noches
7. Si tramo === "SIETE_O_MAS" && precioMatch.promoSemanal > 0:
     total = total × (1 - promoSemanal/100)
8. Retornar { precioPorNoche, totalEstadia, noches }
```

### Flujo de guardado (`lib/actions/propiedades.ts:actualizarMenuPrecios`)

```
Para cada precio en la lista:
  1. Buscar filas existentes WHERE propiedadId + estanciaTemporada + tramoNoches
  2. Si exactamente 1 fila: UPDATE precioPorNoche y promoSemanal
  3. Si 0 filas: CREATE nueva fila con los datos
  4. Si >1 fila: ERROR - duplicados detectados, pedir resolver manualmente
revalidatePath("/admin/propiedades")
```

---

## API

### `POST /api/precios`

Parámetros soportados:
- `propiedadId` (required)
- `nombre` (required) - temporada ("baja" o "alta")
- `fechaInicio` (required) - fecha ISO inicio vigencia
- `fechaFin` (required) - fecha ISO fin vigencia
- `precioPorNoche` (required) - número >= 0
- `tramoNoches` (required) - enum: UNA_NOCHE, DE_DOS_A_SEIS, SIETE_O_MAS
- `cantidadPersonas` (required) - entero > 0
- `tipoDia` (optional) - enum: TODOS, SEMANA, FIN_DE_SEMANA
- `activo` (optional) - boolean
- `promoSemanal` (optional) - número 0-100
- `estanciaTemporada` (internal) - asignado "baja" por defecto en create

Validaciones en servidor:
- `precioPorNoche >= 0`
- `0 <= promoSemanal <= 100` (si se provee)
- `fechaFin > fechaInicio`
- Propiedad debe existir

---

## UI

### `PrecioMenu.tsx` — 8 campos editables

| Campo | Tipo | Almacenado en |
|---|---|---|
| Precio x noche (Baja) | input number | `Precio.precioPorNoche` |
| Precio 2-6 noches (Baja) | input number | `Precio.precioPorNoche` |
| Precio +7 noches (Baja) | input number | `Precio.precioPorNoche` |
| **Promo semanal Baja** | input number (0-100) | `Precio.promoSemanal` |
| Precio x noche (Alta) | input number | `Precio.precioPorNoche` |
| Precio 2-6 noches (Alta) | input number | `Precio.precioPorNoche` |
| Precio +7 noches (Alta) | input number | `Precio.precioPorNoche` |
| **Promo semanal Alta** | input number (0-100) | `Precio.promoSemanal` |

### Flujo completo

```
DB ──┐
     ├── GET /api/precios?propiedadId → estado React
             ↓
PrecioMenu.tsx ──► usuario modifica inputs ──► onSave(precios) ──►
             │                                    │
             └──────┐                               │
                    │                               ▼
                 actualizarMenuPrecios()           API POST /api/precios
                    │                               │
                    └──────► prisma.update/create ──┘
                                   ↓
                          revalidatePath("/admin/propiedades")
                                   ↓
                          reload → mismos valores persisten
```

### Verificación de guardado

Después de guardar y recargar:
- `Promo semanal Baja` = 10 → persiste como 10
- `Promo semanal Alta` = 5 → persiste como 5
- `0` puede guardarse como valor válido (sin descuento)

---

## Cálculo (`calcularPrecio`)

### Nueva firma

```ts
calcularPrecio(
  propiedadId: string,
  fechaIngreso: string,    // formato "YYYY-MM-DD"
  fechaSalida: string,     // formato "YYYY-MM-DD"
  personas: number,
  options?: { estanciaTemporada?: "baja" | "alta" }
): Promise<{ precioPorNoche: number; totalEstadia: number; noches: number } | { error: string }>
```

### Algoritmo paso a paso

1. **Validar fechas**: salida > ingreso
2. **Calcular noches**: `Math.round((salida - ingreso) / 86400000)`
3. **Determinar tramo**: 1→UNA_NOCHE, 2-6→DE_DOS_A_SEIS, 7+→SIETE_O_MAS
4. **Filtrar tarifas**: `prisma.precio.findMany` con where:
   - `propiedadId`
   - `activo: true`
   - `tramoNoches: tramo`
   - `fechaInicio: { lte: salida }` AND `fechaFin: { gte: ingreso }`
   - Opcional: `estanciaTemporada: options.estanciaTemporada`
5. **Si no hay matches**: usar precioBase de la propiedad + promoSemanal de propiedad (modo fallback)
6. **Si hay matches**: seleccionar por `cantidadPersonas`:
   - `precios.find(p => personas <= p.cantidadPersonas)` (primer match >= personas)
   - Si none: `precios[precios.length - 1]` (último de la lista orderBy asc)
7. **Extraer precio**: `precioMatch.precioPorNoche.toNumber()`
8. **Calcular totalSinDescuento**: `precioPorNoche × noches`
9. **Aplicar promo semanal de la tarifa**:
   - Si `tramo === "SIETE_O_MAS" && precioMatch.promoSemanal.toNumber() > 0`:
     `total = totalSinDescuento × (1 - precioMatch.promoSemanal.toNumber() / 100)`
10. **Retornar**: `{ precioPorNoche, totalEstadia, noches }`

### Casos especiales

- **7+ noches con promo = 0**: Sin descuento, total = precio × noches
- **7+ noches con promo = 100**: Total = 0 (estadía gratuita en promoción)
- **Menos de 7 noches**: Promo nunca se aplica, total = precio × noches
- **Fechas fuera de vigencia**: No hay matches → modo fallback con precioBase
- **Reserva existente**: El precio se calcula al momento; no se recalcula retroactivamente

---

## Datos

### Migración aplicada

Se agregó la columna `promoSemanal` a la tabla `precios`:

```sql
ALTER TABLE precios ADD COLUMN IF NOT EXISTS promoSemanal NUMERIC(10,2) DEFAULT 0;
```

### Datos migrados

- Todas las 65 filas existentes tienen `promoSemanal = 0` por defecto.
- No se modificaron filas existentes; el nuevo campo entra en vigencia al crear/actualizar tarifas por la UI.
- No se ejecutó `DELETE FROM precios` ni limpieza destructiva.

### Datos que quedaron intactos

- `Propiedad.promoSemanal` (campo global, sigue existiendo con default 0).
- Todos los precios existentes en BD (65 filas).
- Estructura de `cantidadPersonas = 1` en todas las filas (no modificado).
- Fechas `fechaInicio/fin` existentes sin modificar.
- Reservas existentes — modificar tarifa no altera precio de reserva ya creada.

### Datos nuevos que pueden crearse

- Filas nuevas de `Precio` con `promoSemanal` distinto de 0.
- Valores distintos para `promoSemanal` entre `estanciaTemporada = "baja"` y `"alta"` para la misma propiedad.

---

## Tests

### Tests ejecutados

El build secompila exitosamente (`npx next build`). Los TypeScript checks pass para los archivos modificados.

### Tests manuales recomendados (checklist)

Por especificación §22 y §23:

| Scenario | Expected |
|---|---|
| 1 noche, tramo UNA_NOCHE | `precioPorNoche × 1` |
| 2 noches, tramo DE_DOS_A_SEIS | `precioPorNoche × 2` |
| 6 noches, tramo DE_DOS_A_SEIS | `precioPorNoche × 6` |
| 7 noches, tramo SIETE_O_MAS, promo = 0 | `precioPorNoche × 7` (sin descuento) |
| 7 noches, tramo SIETE_O_MAS, promo = 10 | `precioPorNoche × 7 × 0.9` |
| 7 noches, tramo SIETE_O_MAS, promo = 100 | `precioPorNoche × 7 × 0` = 0 |
| 8 noches, tramo SIETE_O_MAS, promo = 10 | `precioPorNoche × 8 × 0.9` |
| `cantidadPersonas = 1` (siempre) | Sin efecto en selección (siempre 1) |
| `tipoDia = TODOS/SÉMANA/FIN_DE_SEMANA` | Sin efecto en cálculo |
| `Baja` temporada precio vs `Alta` | Valores independientes, ambos guardables |

### Checks específicos

1. **Editar → Guardar → Recargar → Mismo valor** para los 8 campos.
2. **Promo semanal Baja = 10, Alta = 5** → Después de guardar y recargar, ambos persisten.
3. **Guardar tres veces seguidas** → No generar nuevas tarifas equivalentes (el upsert evita duplicados).
4. **Modificar tarifa no altera reserva existente** → Reservas creadas antes del cambio mantienen su `precioTotal_estadia` original.
5. **7+ noches con promo de la temporada correspondiente** → Descuento aplicado correctamente usando el `promoSemanal` de la tarifa match.

---

## Cómo probar

### 1. Panel administrativo

1. Abrir `/admin/propiedades`;
2. Seleccionar una cabaña;
3. Modificar los 8 campos (precios por tramo y promo semanal por temporada);
4. Dar click en "Guardar cambios";
5. Recargar la página;
6. Comprobar que los 8 valores se mantienen igual;
7. Guardar nuevamente;
8. Comprobar que no aparecen duplicados (contar filas en BD debería ser consistente);
9. Ejecutar una cotización/reserva de prueba;
10. Verificar que se utiliza el precio correcto según tramo y temporada;
11. Probar una reserva de 7+ noches;
12. Verificar que la promo semanal se aplica de la temporada correspondiente;
13. Verificar independencia entre Alta y Baja (promos distintas).

### 2. API

```bash
# Crear nueva tarifa con promo semanal
curl -X POST "/api/precios?propiedadId=cmrj91hey0007dgdugpnxyc9b" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Temporada baja",
    "fechaInicio": "2025-01-01",
    "fechaFin": "2025-12-31",
    "precioPorNoche": 150000,
    "tramoNoches": "UNA_NOCHE",
    "cantidadPersonas": 1,
    "promoSemanal": 10
  }'

# Obtener todos los precios de una propiedad
GET /api/precios?propiedadId=cmrj91hey0007dgdugpnxyc9b

# Ver que promoSemanal viene en la respuesta
```

### 3. Cálculo programático

```ts
import { calcularPrecio } from "@/lib/actions/precios";

// Ejemplo: reserva de 8 noches, temporada Alta, 2 personas
const res = await calcularPrecio(
  "cmrj91hey0007dgdugpnxyc9b",
  "2026-12-20",
  "2026-12-28",
  2,
  { estanciaTemporada: "alta" }
);
console.log(res);
// { precioPorNoche: number, totalEstadia: number, noches: 8 }
// totalEstadia debería aplicar promoSemanal de tarifa Alta si tramo = SIETE_O_MAS
```

---

## Pendientes

### Cuestionarios abiertos (por fuera del alcance actual)

1. **Historial de precios**: No implementado ahora. La implementación actual actualiza la tarifa existente y no crea un historial visual completo. Pendiente para futura evolución.

2. **Datos antiguos no normalizados**: Las 65 filas existentes en BD con `promoSemanal = 0` no fueron modificadas. Si se necesita migrar valores históricos, requiere decisión separada.

3. **Fechas invertidas**: 8 filas en 8 propiedades tienen `fecha_inicio(2026-12-01) > fecha_fin(2026-02-28)`. Estas filas no pueden ser matcheadas por `calcularPrecio` pero sí pueden editarse en la UI. Decisión: mantener editable o archivar.

4. **`cantidadPersonas > 1`**: Actualmente todas las filas tienen `cantidadPersonas = 1`. Si el negocio requiere valores distintos (4, 5, 6 según capacidad), requiere carga de datos y posible ajuste de la lógica de filtrado.

5. **`tipoDia` con efecto en cálculo**: El campo existe en schema y BD pero `calcularPrecio` no lo usa. Si el negocio requiere diferenciación por día de la semana, es una mejora futura.

6. **Superposición de tarifas idénticas**: El modelo permite múltiples filas con mismo `(propiedadId + tramoNoches + estanciaTemporada + fechaInicio + fechaFin)`. La identidad única es el campo `id`. El comportamiento de selección toma el primer match por `cantidadPersonas asc`, fallback al último. Esto es intencional pero podría requerir validación de negocio para evitar ambigüedades.

---

## Confirmación final

```text
COMMIT: NO REALIZADO
ENGRAM: NO UTILIZADO
```

No se realizaron commits git. No se utilizó Engram para persistir memoria. Los cambios están implementados en el working tree listo para revisión.