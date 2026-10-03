# Auditar lógica precios Next.js admin

**Session ID:** ses_efcf37bfeffe6Umw3s2AXk7Zel
**Created:** 10/3/2026, 3:35:14 PM
**Updated:** 10/3/2026, 4:40:15 PM

---

## User

# Tarea: Auditar completamente la lógica actual de precios antes de eliminarla

## Contexto

Estoy trabajando en una aplicación Next.js y actualmente existe un módulo de gestión de precios dentro de:

`/admin/propiedades`

El módulo permite administrar precios de las propiedades/cabañas, pero actualmente presenta problemas graves de funcionamiento y considero que la implementación puede estar mal planteada desde su origen.

**NO quiero que intentes arreglar la implementación existente.**

El objetivo de esta tarea es realizar una auditoría exhaustiva para determinar exactamente qué archivos, componentes, endpoints, acciones, modelos, consultas, relaciones y datos están relacionados con la lógica actual de precios, para posteriormente eliminarla y reconstruirla desde cero.

## Reglas importantes

- Revisa primero el estado actual completo del proyecto.
- Revisa el historial/contexto disponible en Engram antes de tomar decisiones.
- No realices ningún commit.
- No hagas cambios de código en esta tarea.
- No elimines archivos todavía.
- No modifiques el esquema de Prisma.
- No ejecutes migraciones destructivas.
- No cambies la base de datos.
- No intentes solucionar los problemas actuales.
- No agregues dependencias.
- No actualices versiones.
- No refactorices código ajeno al módulo de precios.

## Qué necesito investigar

Determina todas las piezas que participan directa o indirectamente en la gestión actual de precios.

### 1. Frontend

Investiga:

- `/admin/propiedades`
- Componentes utilizados por esa página.
- Componentes específicos de precios.
- Formularios.
- Inputs.
- Estados React relacionados con precios.
- Hooks.
- Funciones de actualización.
- Funciones de carga.
- Fetches.
- Server Actions.
- Validaciones.
- Tipos TypeScript.
- Interfaces.
- Helpers.
- Utilidades.
- Cualquier componente compartido utilizado exclusivamente por precios.

Presta especial atención a:

- `PrecioMenu.tsx`
- cualquier componente similar
- `actualizarMenuPrecios`
- cualquier código relacionado con:
  - `precio`
  - `precios`
  - `promoSemanal`
  - `estanciaTemporada`
  - `tramoNoches`
  - `tipoDia`
  - `temporada`

Pero no asumas que esos son los únicos elementos. Busca referencias globalmente.

### 2. API

Localiza todos los endpoints relacionados con precios.

Investiga:

- `/api/precios`
- endpoints específicos de propiedades que manejen precios
- GET
- POST
- PUT
- PATCH
- DELETE
- Server Actions que funcionen como API indirecta
- validaciones
- serialización
- consultas Prisma

Determina qué endpoints son utilizados realmente por el frontend y cuáles parecen estar sin uso.

### 3. Base de datos / Prisma

Investiga completamente:

- modelo `Precio`
- modelo `Propiedad`
- relaciones entre ellos
- campos relacionados con precios
- índices
- constraints
- claves únicas
- foreign keys
- referencias desde otros modelos
- consultas Prisma que utilicen `precio`
- funciones que calculen precios

Busca especialmente:

- `prisma.precio`
- `Precio`
- `promoSemanal`
- cualquier relación `precio`
- `calcularPrecio`
- funciones equivalentes

IMPORTANTE:

No elimines ni modifiques todavía ningún modelo.

Quiero saber exactamente qué partes del esquema están involucradas y qué otras funcionalidades podrían depender de ellas.

### 4. Cálculo de precios

Busca toda función que calcule:

- precio por noche
- precio para determinada cantidad de noches
- temporada
- promociones
- descuentos
- precio total de una reserva

Determina:

- dónde se calcula actualmente
- qué datos utiliza
- qué tablas consulta
- qué partes del sistema dependen de ese cálculo
- si el cálculo se utiliza fuera de `/admin/propiedades`

Esto es especialmente importante porque NO quiero eliminar accidentalmente lógica necesaria para las reservas.

### 5. Reservas y otras funcionalidades

Investiga si el sistema de reservas utiliza actualmente:

- `Precio`
- `promoSemanal`
- `estanciaTemporada`
- `tramoNoches`
- `calcularPrecio`
- cualquier otro elemento del módulo.

Determina qué código debe conservarse aunque eliminemos el administrador de precios.

### 6. Base de datos real

Si el proyecto tiene acceso a una base de datos de desarrollo y es posible inspeccionarla de forma segura, analiza:

- cantidad de registros de `Precio`
- relaciones existentes
- datos inconsistentes
- duplicados
- campos utilizados
- referencias desde otras tablas

NO borres datos.

NO ejecutes operaciones destructivas.

## Resultado esperado

No quiero código todavía.

Quiero un informe detallado que contenga:

### A. Árbol de dependencias

Por ejemplo:

```text
/admin/propiedades
 └── Componente X
      └── PrecioMenu
           ├── acción Y
           ├── GET /api/precios
           ├── POST /api/precios
           └── Prisma Precio
```

El árbol debe representar las dependencias reales encontradas, no ejemplos.

### B. Archivos candidatos a eliminación

Lista los archivos que pertenecen exclusivamente a la implementación actual de precios.

Para cada archivo indica:

- ruta
- función
- dependencias
- si puede eliminarse
- qué lo utiliza

### C. Código que debe modificarse pero NO eliminarse

Identifica archivos que contienen lógica de precios pero también contienen funcionalidades importantes que deben permanecer.

Para cada uno explica exactamente qué parte corresponde a precios y qué parte debe conservarse.

### D. Base de datos

Indica:

- modelos involucrados
- campos involucrados
- relaciones
- índices/constraints
- dependencias externas

No modifiques nada todavía.

### E. Riesgos

Indica qué podría romperse si eliminamos cada parte.

Especialmente:

- reservas
- cálculo del precio final
- disponibilidad
- frontend público
- APIs
- autenticación
- administración de propiedades

### F. Plan de eliminación

Finalmente propone un orden seguro para eliminar la implementación actual.

El plan debe terminar dejando:

> El sistema sin la lógica administrativa actual de precios y preparado para construir posteriormente un módulo de precios nuevo desde cero.

NO implementes este plan todavía.

## Criterio de finalización

La tarea termina cuando tengas identificado con suficiente precisión:

1. Todo el frontend relacionado con precios.
2. Toda la lógica backend relacionada con precios.
3. Todas las acciones/endpoints relacionados.
4. Todas las dependencias Prisma.
5. Todas las dependencias con reservas.
6. Qué archivos pueden eliminarse.
7. Qué archivos deben modificarse.
8. Qué elementos de base de datos pueden eliminarse posteriormente.
9. Qué elementos NO deben tocarse.

No realices ningún cambio.

No realices ningún commit. 

---

## Assistant

Vamos a comenzar la auditoría. Primero, exploraré la estructura del proyecto y luego investigaré cada área relacionada con los precios.




**Tool: read**

**Tool: read**

---

## Assistant

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

Now let me check the lib/actions files and other related code:




**Tool: glob**

**Tool: read**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: read**

**Tool: read**

---

## Assistant

Now let me check other relevant files:





**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

**Tool: read**

**Tool: grep**

---

## Assistant

Let me read a few more key files:




**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

**Tool: read**

**Tool: read**

---

## Assistant

**Tool: read**

**Tool: read**

**Tool: glob**

---

## Assistant

Let me also check for any additional relevant files:




**Tool: glob**

**Tool: grep**

---

## Assistant

**Tool: glob**

**Tool: grep**

---

## Assistant

**Tool: read**

**Tool: read**

---

## Assistant

Now let me check Engram for any previous context:



**Tool: engram_mem_search**

---

## Assistant

Now I have enough information to create the comprehensive audit report. Let me organize all the findings.

## Audiencia: Lógica Actual de Precios - Informe Exhaustivo

### A. Árbol de Dependencias

```
admin/propiedades
├── page.tsx - Lista propiedades con PropiedadCard
└── _components/
    ├── PropiedadCard.tsx - Card principal, incluye:
    │   ├── PrecioMenu.tsx - Menú de precios por temporada/estancia
    │   │   ├── fetch: GET /api/precios?propiedadId=...
    │   │   └── save: onSave → actualizarMenuPrecios
    │   └── AtributoEditable.tsx - Edición de atributos
    └── PrecioMenu.tsx - Editor UI con:
        - 2 temporadas (baja/alta)
        - 4 tramos (1 noche, 2-6 noches, 7+ noches, promo semanal)
        - Inputs número para cada combinación
        - Botón Guardar → onSave → actualizarMenuPrecios
└── Sidebar.tsx - Menú lateral con "Gestión de precios"
   └── /admin/precios, /admin/precios/new (routes que no tienen página propia visible)

API Routes:
├── GET /api/precios?propiedadId=... - Listar precios de una propiedad
├── POST /api/precios - Crear nuevo rango de precio
├── GET /api/precios/[id] - Obtener un precio por ID
├── PATCH /api/precios/[id] - Actualizar rango de precio
└── DELETE /api/precios/[id] - Eliminar rango de precio

lib/actions:
├── actualizarMenuPrecios(propiedadId, precios) - Para cada precio, POST a /api/precios con datos auto-generados
├── calcularPrecio(propiedadId, fechaIngreso, fechaSalida, personas, promoSemanal?) - Calcula precio usando BD Precio o fallback a precioBase/promoSemanal
└── updatePropiedadAtributo, crearPropiedad, eliminarPropiedad

Base de datos Prisma:
├── modelo Precio:
│   - id, propiedadId, nombre, fechaInicio, fechaFin, tramoNoches, cantidadPersonas, precioPorNoche, tipoDia, estanciaTemporada, activo
│   - relación: Pertenece a Propiedad (onDelete: Cascade)
│   - indices implícitos por campos buscados
├── modelo Propiedad:
│   - id, nombre, descripcion, capacidad, precioBase, promoSemanal, fotos, servicios, activa, orden, creadaEn, actualizadaEn
│   - relación: Tiene muchos Precio
├── modelo Reserva:
│   - relación: Pertenece a Propiedad
│   - precioTotalEstadia, diasEstadia, sena, etc.
```

### B. Archivos Candidatos a Eliminación (exclusivamente administración de precios)

| Archivo | Función | Dependencias | Puede Eliminarse |
|---|---|---|---|
| `app/api/precios/route.ts` | GET/POST de precios | Usado por PrecioMenu.tsx | Sí - es exclusivo del admin |
| `app/api/precios/[id]/route.ts` | GET/PATCH/DELETE de precio individual | Usado por PrecioMenu y admin | Sí - exclusivo del admin |
| `lib/actions/propiedades.ts` - `actualizarMenuPrecios()` | POST a /api/precios por cada opción | Llama a fetch a API de precios | Sí - lógica admin |
| `app/admin/propiedades/_components/PrecioMenu.tsx` | UI de edición de menú de precios | Usa fetch a /api/precios | Sí - componente admin |
| `lib/actions/precios.ts` - `calcularPrecio()` | Calcula precio usando tabla Precio | Usado por PriceCalculator pública | **NO** - también usado en público |
| `components/public/PriceCalculator.tsx` | Calculadora de precios en frontend público | Usa calcularPrecio | **NO** - componente público necesario |

### C. Código que debe modificarse pero NO eliminarse

| Archivo | Parte de Precios | Parte que debe Conservarse |
|---|---|---|
| `lib/actions/precios.ts` - `calcularPrecio()` | Lógica completa de cálculo: busca en tabla Precio, fallback a precioBase/promoSemanal, aplica descuento promo para 7+ noches | La función completa es usada por PriceCalculator público. **No tocar.** |
| `app/(public)/cabanas/[id]/page.tsx` | Incluye `<PriceCalculator />` | El componente PriceCalculator y su uso en detail page pública - **conservar** |
| `components/public/PriceCalculator.tsx` | Componente UI de cálculo público | **Conservar** - es la única interfaz pública de consulta de precios |
| `Prisma schema` - `modelo Precio` | Estructura de tabla de precios | **NO eliminar aún** - depende calcularPrecio y podría afectar reservasy otros módulos. Se eliminará en fase posterior. |
| `Prisma schema` - `modelo Propiedad`.`precioBase` | Precio base mostrado públicamente | **Conservar** - usado en CabinCard, public page, etc. |
| `Prisma schema` - `modelo Propiedad`.`promoSemanal` | Promo semanal usada en cálculo | **Conservar** - usada por calcularPrecio y UI |
| `lib/actions/propiedades.ts` - `updatePropiedadAtributo()` | Maneja `precioBase` y `promoSemanal` | **Conservar** - funcionalidad general de propiedades, no solo precios |
| `app/api/pre-reserva/route.ts` | Creación de pre-reservas | **Conservar** - flujo de reservas, no toca lógica de precios admin |

### D. Base de Datos

**Modelos involucrados:**
- `Precio`: id, propiedadId, nombre, fechaInicio, fechaFin, tramoNoches, cantidadPersonas, precioPorNoche, tipoDia, estanciaTemporada, activo
- `Propiedad`: id, nombre, descripcion, capacidad, precioBase, promoSemanal, fotos, servicios, activa, orden, criadaEn, actualizadaEn
- `Reserva`: id, propiedadId, huespedNombre, huespedTelefono, personas, fechaIngreso, fechaSalida, estado, precioTotalEstadia, diasEstadia, sena, formaPago, notas

**Campos relacionados con precios:**
- `Propiedad.precioBase` - Decimal, mostrado públicamente como "Desde $X/noche"
- `Propiedad.promoSemanal` - Decimal @default(0), usado en calcularPrecio para descuento 7+ noches
- `Precio.precioPorNoche` - Decimal, el valor real por rango de temporada/estancia
- `Precio.tramoNoches` - TramoNoches enum (UNA_NOCHE, DE_DOS_A_SEIS, SIETE_O_MAS)
- `Precio.estanciaTemporada` - "baja" | "alta"
- `Precio.tipoDia` - TipoDia enum (TODOS, SEMANA, FIN_DE_SEMANA)

**Relaciones:**
- Propiedad.hasMany Precio (1:N)
- Precio.belongsTo Propiedad (muchos a 1), onDelete: Cascade
- Propiedad.hasMany Reserva (1:N)
- Reserva.belongsTo Propiedad

**Indices/Constraints:**
- No indices explícitos definidos en schema, pero foreign keys implicitas
- `Precio.id` es primary key
- `Reserva.resena` es unique constraint

**Datos en BD (necesaria inspección):**
- Cantidad de registros Precio: desconocida, pero el sistema permite múltiples rangos por propiedad
- Datos inconsistentes/duplicados: posible dado que `actualizarMenuPrecios` crea filas nuevas cada vez sin borrar antiguas
- `precioBase` en Propiedad puede no estar sincronizado con el mínimo de la tabla Precio

### E. Riesgos de Eliminación

**Al eliminar lógica administrativa de precios:**

1. **❌ Reservas**: El sistema de reservas actual NO usa la tabla `Precio` directamente. La creación de reservas (`api/pre-reserva`) solo verifica disponibilidad mediante `hayConflictoFecha`. **No debería romperse** al eliminar la lógica admin de precios.

2. **❌ Cálculo de precio final**: `calcularPrecio` en `lib/actions/precios.ts` usa la tabla `Precio` como fuente principal, con fallback a `propiedad.precioBase` + `propiedad.promoSemanal`. Si se elimina la tabla Precio o se vacía, el cálculo continuará funcionando usando los campos `precioBase` y `promoSemanal` de la tabla Propiedad. **El público no se rompería.**

3. **❌ Frontend público**: `PriceCalculator.tsx` y la página `cabanas/[id]/page.tsx` dependen de `calcularPrecio`. Si la tabla Precio se elimina pero se mantiene la función `calcularPrecio` con su fallback, el público seguirá funcionando. Si se cambia la función, sí rompería.

4. **❌ Admin propiedades**: `PrecioMenu.tsx`, `actualizarMenuPrecios`, y los endpoints `/api/precios*` serían eliminados. El admin perdería la capacidad de editar menús de precios mediante la UI actual, pero `precioBase` y `promoSemanal` siguen siendo editables mediante `AtributoEditable`.

5. **✅ Dependencias seguras**: 
   - `precioBase` en Propiedad - usado públicamente, se mantiene
   - `promoSemanal` en Propiedad - usado en cálculo y UI, se mantiene  
   - `Reserva` y disponibilidad - sin cambios
   - `CabinCard`, `CabinsSection` - muestran `precioBase`, sin cambios

### F. Plan de Eliminación (orden seguro)

El plan debe ejecutarse en este orden para minimizar riesgos:

1. **Paso 1: Mantener compatibilidad hacia atrás**
   - Mantener los campos `precioBase` y `promoSemanal` en modelo `Propiedad`
   - Mantener la función `calcularPrecio` con su fallback actual (usar precioBase/promoSemanal si no hay filas en tabla Precio)
   - Mantener el componente `PriceCalculator.tsx` público

2. **Paso 2: Eliminar endpoints API de precios**
   - Eliminar `app/api/precios/route.ts`
   - Eliminar `app/api/precios/[id]/route.ts`

3. **Paso 3: Eliminar acciones y componentes admin de precios**
   - Eliminar `lib/actions/propiedades.ts` - `actualizarMenuPrecios()` 
   - Eliminar `app/admin/propiedades/_components/PrecioMenu.tsx`
   - Eliminar referencias en `PropiedadCard.tsx` al `PrecioMenu` y `actualizarMenuPrecios`
   - Eliminar del sidebar `Sidebar.tsx` las entradas "Gestión de precios", "Listado de precios", "Nuevo precio"
   - Eliminar del `app/admin/page.tsx` el enlace a "Precios"

4. **Paso 4: Limpiar UI de precio en PropiedadCard**
   - Remover la fila `precioBase` del `ATRIBUTOS_EDITABLES` o mantenerla pero sin el menú desplegable de precios
   - O simplificar para que solo muestre el valor readonly

5. **Paso 5: (Opcional futuro) Eliminar modelo Precio y migraciones**
   - Después de verificar que ningún código depende de la tabla `Precio` en producción
   - Ejecutar `npx prisma migrate dev --name remover-modelo-precio`
   - Esto sería después de confirmar que `calcularPrecio` ya no consulta la tabla

**Resultado final esperado:**
- Sistema sin lógica administrativa de precios (eliminados endpoints, acciones, componentes UI admin)
- Campos `precioBase` y `promoSemanal` conservados en `Propiedad` para uso público
- Cálculo de precios públicos usando solo `precioBase` + `promoSemanal` (sin consulta a tabla `Precio`)
- Panel de admin sin el módulo de "Gestión de precios" en el sidebar
- Frontend público inalterable - PriceCalculator y cálculo de precios continúan funcionando
- Flujo de reservas sin cambios

---
**NOTA CRÍTICA**: No se han realizado cambios de código en esta tarea. El informe identifica únicamente qué partes existen y sus dependencias. La eliminación real y reconstrucción del módulo de precios será una tarea posterior.

---

## User

# Tarea: Eliminar completamente el sistema antiguo de gestión de precios

## Contexto

Se realizó previamente una auditoría completa de la lógica actual de precios.

El resultado de esa auditoría determinó que el sistema actual de precios está compuesto, entre otros elementos, por:

- `PrecioMenu.tsx`
- `actualizarMenuPrecios()`
- `/api/precios`
- `/api/precios/[id]`
- modelo Prisma `Precio`
- relación `Propiedad -> Precio`
- lógica de `calcularPrecio()` que consulta `Precio`
- enlaces/rutas administrativas de precios
- datos almacenados en la tabla `Precio`

El módulo actual de precios está considerado obsoleto y NO quiero repararlo, refactorizarlo ni reutilizarlo.

## Objetivo

Eliminar completamente la implementación actual de precios.

Después de esta tarea, el proyecto debe quedar **sin la arquitectura antigua de precios**, preparado para que posteriormente construyamos un sistema de precios nuevo desde cero.

## MUY IMPORTANTE

Esta tarea NO consiste en reconstruir el sistema de precios.

NO diseñes el nuevo sistema.

NO agregues nuevas funcionalidades de precios.

NO crees nuevos modelos de precios.

NO intentes mejorar el sistema existente.

Primero quiero dejar el proyecto limpio.

La reconstrucción será una tarea independiente y posterior.

---

# Reglas obligatorias

Antes de modificar cualquier cosa:

1. Revisa el estado actual del proyecto.
2. Revisa Engram y el contexto existente del proyecto.
3. Revisa el diagnóstico anterior de la lógica de precios.
4. Verifica nuevamente las referencias de los elementos que vas a eliminar.
5. No asumas que un archivo puede eliminarse simplemente por su nombre.
6. Comprueba sus referencias reales.

Durante esta tarea:

- NO hagas commits.
- NO hagas push.
- NO cambies versiones.
- NO agregues dependencias.
- NO actualices dependencias.
- NO hagas cambios fuera del alcance de esta tarea.
- NO modifiques funcionalidades de reservas salvo que sea estrictamente necesario para eliminar una dependencia directa del sistema antiguo de precios.
- NO modifiques autenticación.
- NO modifiques disponibilidad.
- NO modifiques la administración general de propiedades.
- NO reconstruyas el módulo de precios.

---

# FASE 1 — Verificación antes de eliminar

Antes de borrar nada, verifica nuevamente:

### Frontend

Busca referencias a:

```text
PrecioMenu
actualizarMenuPrecios
/api/precios
precio
precios
promoSemanal
estanciaTemporada
tramoNoches
tipoDia
calcularPrecio
```

No elimines todavía.

Determina qué referencias pertenecen exclusivamente al sistema antiguo.

### Backend

Busca:

```text
prisma.precio
Precio
calcularPrecio
/api/precios
actualizarMenuPrecios
```

Determina qué código depende directamente del modelo `Precio`.

### Base de datos

Revisa:

- modelo `Precio`
- relación con `Propiedad`
- migraciones relacionadas
- referencias a `Precio` desde otros modelos
- consultas Prisma
- seeders
- scripts
- fixtures
- tests

### Reservas

Verifica específicamente que la eliminación del modelo `Precio` no rompa:

- creación de reservas
- pre-reservas
- disponibilidad
- conflictos de fechas
- persistencia de reservas
- precio almacenado en una reserva existente

No elimines ni modifiques lógica de reservas salvo que exista una dependencia directa y demostrable con `Precio`.

---

# FASE 2 — Eliminar la interfaz administrativa antigua

Eliminar completamente la interfaz administrativa correspondiente al sistema antiguo.

Debe desaparecer:

- `PrecioMenu.tsx`
- cualquier componente utilizado exclusivamente por `PrecioMenu`
- formularios exclusivos de precios
- estados exclusivos de precios
- hooks exclusivos de precios
- tipos exclusivos de precios
- helpers exclusivos de precios

En `PropiedadCard.tsx`:

- eliminar la integración de `PrecioMenu`
- eliminar callbacks relacionados con `PrecioMenu`
- eliminar imports relacionados
- conservar el resto de la edición de propiedades

NO elimines `precioBase` ni `promoSemanal` si son utilizados por la funcionalidad general de propiedades.

---

# FASE 3 — Eliminar las acciones administrativas antiguas

En:

```text
lib/actions/propiedades.ts
```

elimina únicamente:

```text
actualizarMenuPrecios()
```

No elimines:

- `crearPropiedad`
- `eliminarPropiedad`
- `updatePropiedadAtributo`
- otras acciones no relacionadas

Después comprueba que no queden imports ni llamadas a `actualizarMenuPrecios`.

---

# FASE 4 — Eliminar API antigua de precios

Eliminar completamente:

```text
app/api/precios/route.ts
app/api/precios/[id]/route.ts
```

Antes de eliminarlos comprueba globalmente que ninguna otra funcionalidad los utilice.

Después de eliminarlos:

```text
grep/search global
```

no debe encontrar consumidores activos de:

```text
/api/precios
```

exceptuando documentación histórica si existiera.

---

# FASE 5 — Eliminar navegación administrativa de precios

Eliminar únicamente las entradas relacionadas con el sistema antiguo de precios de:

- Sidebar
- dashboard admin
- navegación administrativa
- enlaces de "Gestión de precios"
- "Listado de precios"
- "Nuevo precio"
- cualquier ruta administrativa que pertenezca exclusivamente al sistema antiguo

IMPORTANTE:

No elimines `/admin/propiedades`.

La página `/admin/propiedades` debe continuar existiendo y funcionando para administrar las propiedades.

Simplemente debe desaparecer de ella la implementación antigua de precios.

---

# FASE 6 — Eliminar la dependencia de `Precio` del cálculo público

Este paso es MUY IMPORTANTE.

Actualmente `calcularPrecio()` utiliza la tabla `Precio`.

Quiero eliminar esa dependencia.

Modificar:

```text
lib/actions/precios.ts
```

para que el cálculo público NO consulte:

```text
prisma.precio
```

ni dependa del modelo:

```text
Precio
```

El cálculo temporal debe utilizar únicamente los datos de `Propiedad` que ya existen:

```text
precioBase
promoSemanal
```

NO diseñes aquí el nuevo sistema de precios.

No agregues temporadas.

No agregues nuevos tramos.

No agregues nuevos modelos.

No agregues nuevas reglas.

El objetivo es únicamente eliminar la dependencia del sistema antiguo.

IMPORTANTE:

El comportamiento exacto del cálculo debe conservarse lo máximo posible utilizando únicamente los datos disponibles en `Propiedad`.

Si para conseguir esto existe alguna decisión funcional ambigua que no pueda resolverse de forma segura, NO inventes una regla.

Detén ese punto y documenta la ambigüedad.

---

# FASE 7 — Eliminar modelo Prisma `Precio`

Una vez que hayas comprobado que:

```text
prisma.precio
```

ya no es utilizado por ningún código activo:

elimina el modelo:

```text
Precio
```

del schema de Prisma.

Elimina también:

- relación `Propiedad -> Precio`
- relaciones inversas
- enums utilizados exclusivamente por `Precio`
- tipos exclusivos del modelo
- índices exclusivos
- constraints exclusivos

NO elimines campos de `Propiedad` que sean utilizados por el sistema público:

```text
precioBase
promoSemanal
```

NO elimines:

```text
Reserva
```

ni ningún elemento relacionado con disponibilidad.

---

# FASE 8 — Migración de base de datos

Después de eliminar el modelo Prisma `Precio`, crea la migración correspondiente.

La migración debe eliminar únicamente la estructura correspondiente al sistema antiguo de precios.

Antes de ejecutarla verifica:

- qué tabla será eliminada
- qué columnas serán eliminadas
- qué foreign keys serán eliminadas
- que no se eliminen tablas de reservas
- que no se eliminen propiedades
- que no se eliminen datos de reservas

Si la migración implica una operación destructiva sobre `Precio`, eso es esperado.

NO ejecutes una migración destructiva sobre ninguna otra tabla.

No modifiques datos de:

```text
Propiedad
Reserva
```

---

# FASE 9 — Eliminar código muerto

Después de todos los cambios realiza una búsqueda global.

No deberían quedar referencias activas a:

```text
PrecioMenu
actualizarMenuPrecios
/api/precios
prisma.precio
Precio
estanciaTemporada
tramoNoches
tipoDia
```

IMPORTANTE:

Si alguno de estos nombres aparece en código que NO pertenece al sistema antiguo y eliminarlo pudiera romper otra funcionalidad, NO lo elimines automáticamente.

Analiza la referencia y documenta el motivo.

También busca:

- imports muertos
- funciones sin uso
- tipos sin uso
- componentes sin uso
- archivos sin referencias
- código relacionado exclusivamente con el antiguo sistema

Elimina únicamente código que haya quedado huérfano como consecuencia de esta limpieza.

---

# FASE 10 — Verificación

Ejecuta las verificaciones disponibles del proyecto.

Como mínimo, si existen:

```text
npm run lint
npm run build
```

y las pruebas correspondientes.

También verifica manualmente o mediante las herramientas disponibles:

### Admin

```text
/admin/propiedades
```

Debe:

- cargar propiedades
- permitir las operaciones normales de propiedades
- NO mostrar el antiguo editor de precios
- NO intentar llamar `/api/precios`

### Público

Verificar:

- página pública de cabañas
- `PriceCalculator`
- cálculo utilizando `precioBase` / `promoSemanal`

### Reservas

Verificar que:

- el flujo de reserva siga existiendo
- disponibilidad siga funcionando
- no haya imports rotos
- no haya consultas a `Precio`

---

# CRITERIO FINAL DE ÉXITO

La tarea se considera terminada únicamente cuando:

1. El antiguo editor administrativo de precios fue eliminado.
2. Los endpoints antiguos fueron eliminados.
3. `actualizarMenuPrecios()` fue eliminado.
4. Las referencias administrativas antiguas fueron eliminadas.
5. `calcularPrecio()` ya no depende de `Precio`.
6. No existe código activo que consulte `prisma.precio`.
7. El modelo Prisma `Precio` fue eliminado.
8. La relación `Propiedad -> Precio` fue eliminada.
9. La tabla antigua `Precio` fue eliminada mediante una migración controlada.
10. `precioBase` y `promoSemanal` de `Propiedad` permanecen.
11. Las reservas permanecen.
12. La disponibilidad permanece.
13. La administración general de propiedades permanece.
14. El frontend público continúa funcionando con el mecanismo temporal basado en `precioBase` y `promoSemanal`.
15. No queda código muerto relacionado exclusivamente con el sistema antiguo.
16. No se creó ningún sistema nuevo de precios.

---

# DOCUMENTACIÓN OBLIGATORIA

Crear/actualizar el documento de tarea correspondiente en:

```text
docs/<fecha>_<slug>.md
```

Debe incluir:

## Qué se hizo

Lista concreta de todo lo eliminado.

## Decisiones

Explicar especialmente:

- por qué se eliminó `Precio`
- cómo se eliminó su dependencia de `calcularPrecio`
- qué se decidió conservar
- qué NO se modificó

## Archivos

Lista de:

- archivos eliminados
- archivos modificados
- migraciones creadas

## Cómo probar

Indicar los comandos utilizados y las verificaciones realizadas.

## Pendientes

Indicar explícitamente:

> Reconstruir desde cero el nuevo sistema de precios.

NO diseñar ni implementar ese sistema en esta tarea.

---

# IMPORTANTE SOBRE GIT

NO realizar ningún commit.

NO realizar ningún push.

Al finalizar, mostrar:

```text
git status
```

y el resumen de archivos modificados/eliminados.

La tarea termina con los cambios sin commit para poder revisarlos antes de confirmar nada. 

---

## Assistant

# FASE 1 — Verificación antes de eliminar

Vamos a verificar todas las referencias antes de comenzar la eliminación.





**Tool: grep**

**Tool: grep**

**Tool: grep**

---

## Assistant

**Tool: read**

**Tool: read**

---

## Assistant

# FASE 2 — Eliminar la interfaz administrativa antigua

Voy a eliminar `PrecioMenu.tsx` y limpiar `PropiedadCard.tsx` de referencias al sistema antiguo de precios.



**Tool: bash**

---

## Assistant

**Tool: edit**

---

## Assistant

Now let me remove the PrecioMenu integration from PropiedadCard. I need to replace the special `precioBase` handling:



**Tool: edit**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: edit**

---

## Assistant

Let me read the full file and rewrite it properly:



**Tool: read**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: bash**

---

## Assistant

**Tool: bash**

---

## Assistant

**Tool: bash**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: bash**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: write**

---

## Assistant

**Tool: write**

---

## Assistant

---

## User

continua

---

## Assistant

**Tool: write**

---

## Assistant

Now let me verify and continue to FASE 3. First let me verify the PropiedadCard works correctly:


The preçoBase and promoSemanal fields are essential public-facing functionality, so they must remain intact. The old pricing admin system is fully removed: PrecioMenu.tsx deleted, actualizarMenuPrecios removed from actions, /api/precios endpoints deleted, navigation entries removed from Sidebar and admin page, and PropiedadCard no longer includes the PrecioMenu component. The calcularPrecio function in lib/actions/precios.ts still queries prisma.precio, so that's

**Tool: read**

---

## Assistant

Now I need to eliminate the `prisma.precio` dependency from `calcularPrecio`. Let me update FASE 6:



**Tool: edit**

---

## Assistant

**Tool: bash**

---

## Assistant

**Tool: write**

---

## Assistant

**Tool: read**

---

## Assistant

Now let me verify there are no more references to `prisma.precio` in the codebase:

