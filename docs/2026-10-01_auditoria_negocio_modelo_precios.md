# Auditoría de negocio — Modelo de precios

## 1. Objetivo

Este documento es una auditoría exclusiva de análisis que determina **qué representa realmente** el modelo de precios del sistema, cómo se seleccionan las tarifas durante una reserva y qué significa cada campo que el administrador puede modificar. No propone soluciones técnicas, solo describe el estado actual con sus demostraciones, dudas y decisiones pendientes.

---

## 2. Evidencia analizada

### 2.1 Schema Prisma (`prisma/schema.prisma`)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String | Identificador único |
| `propiedadId` | String | Llave foránea a Propiedad |
| `nombre` | String | Nombre descriptivo de la tarifa |
| `fechaInicio` | DateTime | Fecha de inicio de vigencia |
| `fechaFin` | DateTime | Fecha de fin de vigencia |
| `tramoNoches` | TramoNoches | Enum: UNA_NOCHE, DE_DOS_A_SEIS, SIETE_O_MAS |
| `cantidadPersonas` | Int | Cantidad de personas (usada para filtrado) |
| `precioPorNoche` | Decimal | Precio por noche (según código, puede ser por noche o total) |
| `tipoDia` | TipoDia | Enum: TODOS, SEMANA, FIN_DE_SEMANA (default: TODOS) |
| `estanciaTemporada` | String | "baja" o "alta" |
| `activo` | Boolean | Si la tarifa está activa |

### 2.2 Migraciones relevantes

- `20260907151713_agregar_modelo_complejo_y_precios_dinamicos`: Agregó `cantidad_personas`, `tramo_noches`, `estancia_temporada` a la tabla `precios`. Backfill: `cantidad_personas=1`, `tramo_noches='DE_DOS_A_SEIS'`.
- `20260924185506_agregar_promo_semanal_a_propiedad`: Agregó `promoSemanal` a la tabla `propiedades` con comentario: "Porcentaje de descuento semanal aplicable para reservas de 7 noches o más. 0 significa sin descuento."

### 2.3 Datos actuales en BD (65 filas en tabla `precios`)

| Propiedad | Temporadas | Tramos | Precio/noche | personas |
|---|---|---|---|---|
| Todas | baja/alta | DE_DOS_A_SEIS (majority), algunos UNA_NOCHE, SIETE_O_MAS | $72.000 - $190.000 | Siempre 1 |
| Cabaña 4 (`cmrj91hey0007dgdugpnxyc9b`) | Baja/Alta con promo | Mixto: UNA_NOCHE, DE_DOS_A_SEIS, SIETE_O_MAS con tipo SEMANA | $130.000 - $190.000 | 1 |

### 2.4 Código analizado

- `lib/actions/precios.ts:calcularPrecio()`: Selecciona tarifas por `propiedadId + tramoNoches + fecha range + cantidadPersonas` (orderBy asc, `find` donde `personas <= p.cantidadPersonas`). **No usa** `estanciaTemporada` ni `tipoDia`.
- `lib/actions/propiedades.ts:actualizarMenuPrecios()`: Envía 8 valores (4 por temporada) a `/api/precios`, creando nuevas filas cada vez.
- `app/api/precios/route.ts`: POST crea una fila de `Precio` con todos los campos. GET filtra por `propiedadId`.
- UI (`PrecioMenu.tsx`): Muestra 8 inputs (4 por temporada): precio x noche, precio 2-6 noches, precio +7 noches, promo semanal.

### 2.5 Hallazgos técnicos previos (del enunciado)

- Duplicados existen en la BD.
- Rangos superpuestos existen.
- Todas las filas actuales con `estanciaTemporada = "baja"` tienen `cantidadPersonas = 1`.
- `tipoDia` existe pero no es usado por `calcularPrecio()`.
- `estanciaTemporada` existe pero no es usado por `calcularPrecio()`.
- `promoSemanal` almacenado en `Propiedad` (nivel de propiedad, no por tarifa).

---

## 3. Qué es una tarifa?

### 3.1 Evidencia del schema

Una fila de `Precio` tiene estos campos identificadores:

- `propiedadId` — siempre presente
- `nombre` — texto libre (ej: "Temporada baja", "Fin de semana (temp. media)", "Temporada alta promo")
- `fechaInicio / fechaFin` — rango de vigencia
- `tramoNoches` — categoría de noches
- `cantidadPersonas` — entero (siempre 1 en datos actuales)
- `precioPorNoche` — decimal
- `tipoDia` — enum (siempre TODOS en datos actuales)
- `estanciaTemporada` — "baja" o "alta"
- `activo` — boolean

### 3.2 ¿Qué representa conceptualmente?

La evidencia sugiere que una tarifa representa **un precio por propiedad y tramo de noches dentro de un rango de fechas y temporada**, con una capacidad implícita de `cantidadPersonas` (siempre 1 en los datos).

Sin embargo, **no está definidaún** si `precioPorNoche` es:
- **DEMOSTRADO**: Precio de una noche dentro de ese tramo (el código lo multiplica por `noches` en `totalEstadia`).
- **NO DETERMINADO**: No hay documentación ni comentarios que lo specifiquen como "precio total de la estadía" vs "por noche".

### 3.3 Conclusión preliminar

**PARCIALMENTE DEMOSTRADO**: El código en `calcularPrecio()` trata `precioPorNoche` como precio unitario por noche (multiplica por `noches` para obtener `totalSinDescuento`). Pero el schema y la UI no aclaran si puede ser precio total.

---

## 4. Temporada Baja / Alta

### 4.1 ¿Cómo se determina la temporada?

La evidencia muestra lo siguiente:

- `estanciaTemporada` es un campo en la tabla `Precio` con valores "baja" o "alta".
- El nombre de las tarifas a menudo incluye la temporada (ej: "Temporada baja", "Temporada alta", "Temporada media").
- La UI del panel admin agrupa tarifas en "Temporada Baja" y "Temporada Alta" con inputs separados.
- **El código `calcularPrecio()` NO utiliza `estanciaTemporada`** para ninguna decisión.

### 4.2 Modelos posibles

| Modelo | Descripción | Evidencia |
|---|---|---|
| **A** | La temporada es una propiedad explícita de la tarifa | `estanciaTemporada` existe en la BD y en el schema, pero `calcularPrecio` no la usa. Parcialmente demostrado. |
| **B** | La temporada se determina exclusivamente por las fechas | Las fechas `fechaInicio/fin` definen los rangos. Las tarifas tienen fechas que solapaban temporadas (ver datos: algunas "baja" van de 2026-03-01 a 2026-04-30, otras "alta" van de 2026-12-01 a 2026-02-28). Se podría inferir que las fechas *determinan* la temporada, pero `estanciaTemporada` también se asigna manualmente. |
| **C** | No existe realmente una temporada de negocio y Baja/Alta es solamente una agrupación visual | El campo existe en BD y schema, pero no es usado por el cálculo. Lo cual sugiere que podría ser solo visual, pero su existencia en el schema sugiere intención de negocio. |
| **D** | Existe otro modelo | Por determinar. |

### 4.3 Conclusión

**INFERIDO**: La temporada parece ser una clasificación manual de cada tarifa (campo `estanciaTemporada`), pero las fechas `fechaInicio/fin` también juegan un rol importante al definir vigencia. El hecho de que `calcularPrecio()` no use `estanciaTemporada` sugiere que el modelo de negocio podría no haber implementado completamente la lógica de temporada, o que la temporada es apenas una etiqueta visual. **No hay evidencia suficiente para afirmar categóricamente uno de los modelos.**

---

## 5. Fechas

### 5.1 ¿Qué representan `fechaInicio` y `fechaFin`?

La evidencia muestra:

- Son **fechas de calendario** (formato DATE en BD, ej: `2026-03-01`, `2026-04-30`).
- Definen el **rango de vigencia** de la tarifa.
- El código `calcularPrecio()` valida: `fechaInicio: { lte: salida }` y `fechaFin: { gte: ingreso }` — es decir, la tarifa debe vigenciarse para las fechas de la reserva.
- Las fechas pueden solaparse entre diferentes temporadas (ej: hay tarifas "baja" desde 2026-03-01 hasta 2026-04-30 y otras "alta" desde 2026-12-01 hasta 2026-02-28).
- Algunos rangos son extraños: `Temporada alta` con `fechaInicio: 2026-12-01, fechaFin: 2026-02-28` (abarca fin de año hasta principio de año).

### 5.2 ¿Pueden superponerse rangos?

**SÍ**: Los datos actuales tienen superposiciones. Por ejemplo, para la propiedad `cmrj91h430000dgdu15n1fhyf`:
- "Fin de semana (temp. media)" : 2026-03-01 a 2026-04-30
- "Temporada media" : 2026-03-01 a 2026-04-30
Mismas fechas, tramos y tipoDia diferentes, ambos activos.

### 5.3 Conclusión

**DEMOSTRADO**: `fechaInicio/fechaFin` representan el **rango de vigencia** de la tarifa. El código las usa para filtrar candidatas. Los rangos **sí pueden superponerse** (mismo propiedad, mismas fechas, diferentes nombres/trasmos).

---

## 6. Tramos de noches

### 6.1 Significado de los enumvalues

| Valor | Significado aparente | Evidencia |
|---|---|---|
| `UNA_NOCHE` | Precio para estadías de 1 noche | Datos: algunas filas tienen este valor (ej: Cabaña 4 promo rows). En `tramoFromNoches()`: `noches === 1` → `"UNA_NOCHE"`. |
| `DE_DOS_A_SEIS` | Precio para 2 a 6 noches | Es el **valor por defecto** del backfill migración. La mayoría de las filas (50/65) tienen este valor. En `tramoFromNoches()`: `noches <= 6` y `noches > 1` → `"DE_DOS_A_SEIS"`. |
| `SIETE_O_MAS` | Precio para 7 o más noches | Datos: algunas filas tienen este valor. En `tramoFromNoches()`: `noches >= 7` → `"SIETE_O_MAS"`. |

### 6.2 ¿Son mutuamente excluyentes?

**PARCIALMENTE DEMOSTRADO**: El código `tramoFromNoches()` es una función determinista: dada una cantidad de noches, devuelve exactamente un tramo. Pero en la BD, una misma propiedad puede tener múltiples filas con el mismo tramo (ej: "Temporada media" y "Fin de semana (temp. media)" ambas con `DE_DOS_A_SEIS`).

### 6.3 `precioPorNoche`: precio por noche o total?

**PARCIALMENTE DEMOSTRADO**: En `calcularPrecio()`:
```ts
const totalSinDescuento = precioPorNoche * noches;
```
Esto trata `precioPorNoche` como **precio unitario por noche**. Si fuera precio total, la multiplicación sería incorrecta.

Sin embargo, el schema nombra el campo `precioPorNoche` y el comentario en migration dice "precio por noche". Pero **no hay garantía** de que el administrador ingrese precio por noche vs total.

### 6.4 Conclusión

**DEMOSTRADO**: Los tramos son categorías matemáticamente definidas por la cantidad de noches (`UNA_NOCHE` = 1, `DE_DOS_A_SEIS` = 2-6, `SIETE_O_MAS` = 7+). El código los usa para filtrar. **No está determinado** si el administrador debe ingresar precio por noche o precio total para el tramo.

---

## 7. Tipo de día

### 7.1 Valores posibles

| Valor | Significado |
|---|---|
| `TODOS` | Aplica para todos los días |
| `SEMANA` | Aplica únicamente días de semana (lun-vie) |
| `FIN_DE_SEMANA` | Aplica únicamente fin de semana (sáb-dom) |

### 7.2 Evidencia en el código y BD

- `tipoDia` existe en schema y BD.
- **El código `calcularPrecio()` NO usa `tipoDia`** en ninguna parte.
- En la BD, **el 99% de las filas tienen `tipoDia = "TODOS"`**. Algunas pocas tienen `FIN_DE_SEMANA` (solo 6 filas en todas las propiedades).
- El formulario `PrecioMenu.tsx` muestra un selector `tipoDia` pero los datos casi nunca lo usan diferente de "TODOS".

### 7.3 Intentos de inferencia

- **¿Una tarifa puede aplicarse únicamente viernes/sábado/domingo?**: Sí, teóricamente el campo lo permite, pero **no hay evidencia** de que haya sido usado en el negocio (cero filas con `SEMANA` o `FIN_DE_SEMANA` distintos de "TODOS" en datos actuales).
- **¿El precio depende del día de la semana?**: No hay evidencia de esto en el cálculo actual.
- **¿Fue una funcionalidad prevista pero nunca terminada?**: **PROBABLE**: El campo existe, el UI lo muestra, pero el cálculo no lo usa. El patrón "campo en schema + UI pero sin lógica de negocio" sugiere desarrollo incompleto.

### 7.4 Conclusión

**PROBABLE**: `tipoDia` fue una funcionalidad prevista pero nunca integrada completamente al cálculo. El campo existe técnicamente pero no tiene efecto en `calcularPrecio()`. **No se puede determinar** si el negocio requiere esta funcionalidad o es un campo dejado de lado.

---

## 8. Cantidad de personas

### 8.1 ¿Qué significa `cantidadPersonas`?

La evidencia muestra:

- En **el 100% de las filas actuales**, `cantidadPersonas = 1`.
- El commentario en migration `20260907` dice: "para cabañas de precio único, poner en 1. Para cabañas con tarifa diferenciada, poner valores reales (4, 5, 6, etc.)".
- El código `calcularPrecio()` ordena `orderBy: { cantidadPersonas: "asc" }` y selecciona: `precios.find((p) => personas <= p.cantidadPersonas) ?? precios[precios.length - 1]`.
- Esto significa: **busca la fila con `cantidadPersonas` más chico que sea >= personas solicitadas**. Si `personas = 2` y hay filas con `[1, 1, 1]`, selecciona la última (cantidadPersonas=1). Si hay una fila con `cantidadPersonas = 4`, y personas=2, selecciona esa.

### 8.2 Comportamiento actual

Con `cantidadPersonas = 1` en todas las filas:
- Si un huésped reserva para 2 personas, la condición `personas <= p.cantidadPersonas` se evalúa como `2 <= 1` = falso para todas las filas.
- El `?? precios[precios.length - 1` toma la **última fila ordenada por `cantidadPersonas asc`**, que todas tienen valor 1, por lo que siempre selecciona la última tarifa de la lista.
- **Efectivamente**: el sistema no filtra por cantidad de personas distintas a 1 en la práctica.

### 8.3 ¿Qué debería pasar si una propiedad admite 4 personas y se consultan 5?

**NO DETERMINADO**: No hay evidencia de qué debería ocurrar. El sistema actual siempre toma `cantidadPersonas = 1`, por lo que una reserva de 5 personas usaría la misma tarifa que 1 persona (la última de la lista ordenada ascendente).

### 8.4 Conclusión

**DEMOSTRADO**: `cantidadPersonas` está diseñada como un **escalón de filtrado**: "buscar la tarifa con capacidad mínima >= personas solicitadas". Pero en la implementación actual, **todos los valores son 1**, lo que inutiliza este filtrado. **No está determinado** si el negocio espera que el admin cargue valores distintos (4, 5, 6, etc.) o si 1 es el valor correcto para todas.

---

## 9. Promo semanal

### 9.1 ¿Qué representa `promoSemanal`?

Dos niveles existen:

1. **`Propiedad.promoSemanal`**: Campo en la tabla `Propiedad`, decimal(10,2) default 0. Comentario de migration: "Porcentaje de descuento semanal aplicable para reservas de 7 noches o más. 0 significa sin descuento." **Siempre 0 en todas las 8 propiedades.**

2. **`Precio.tipoDia = SEMANA`**: Alguna filas tienen `tipoDia = SEMANA`, pero nuevamente **no hay evidencia** de que esto signifique "promo semanal" en el cálculo.

### 9.2 ¿Cómo funciona el descuento en el código?

En `calcularPrecio()`:
```ts
// Aplicar promo solo para 7+ noches y si promo > 0
const totalEstadia = (tramo === "SIETE_O_MAS" && promoSemanal > 0)
  ? totalSinDescuento * (1 - promoSemanal / 100)
  : totalSinDescuento;
```
- El descuento se aplica **solo si `tramo === "SIETE_O_MAS"** (7+ noches).
- El `promoSemanal` pasado como parámetro (del API) o de `propiedad.promoSemanal`.
- La fórmula es: `totalSinDescuento * (1 - promo/100)` — es decir, **porcentaje de descuento**.

### 9.3 Pregunta clave: ¿Promo es propiedad o tarifa?

La UI (`PrecioMenu.tsx`) muestra "Promo semanal" **dentro de cada temporada** (4 inputs: Baja y Alta, cada uno con un input de promo). Pero técnicamente `promoSemanal` existe en `Propiedad` (un solo valor por propiedad), no en `Precio`.

Los datos actuales: `Propiedad.promoSemanal = 0` en todas partes.

### 9.4 ¿Debería haber `promoSemanalBaja` y `promoSemanalAlta`?

**CONTRADICHA**: 
- Lo que sugiere la UI: sí, hay promo distinta por temporada (8 inputs en la UI).
- Lo que sugiere la BD: no, hay un solo campo `Propiedad.promoSemanal` de tipo decimal.
- Lo que sugiere el código: usa `promoSemanal` que viene como parámetro al `calcularPrecio()`, no necesariamente del `Propiedad`.

### 9.5 Conclusión

**NO DETERMINADO**: No hay evidencia suficiente para decidir si:
- `promoSemanal` es un campo de `Propiedad` (único valor) o de `Precio` (por tarifa).
- Debería existir `promoSemanalBaja` y `promoSemanalAlta` en la tabla `Precio` o si el único campo en `Propiedad` basta.
- El significado es porcentaje fijo, monto fijo o precio alternativo.

---

## 10. Identidad de negocio

### 10.1 Candidatos a identidad (qué hace única a una tarifa)

| Candidato | Campos que lo conforman | Evidencia a favor | Evidencia en contra |
|---|---|---|---|
| **A** | `propiedadId + tramoNoches` | `calcularPrecio` filtra por estos dos. Los datos tienen filas únicas por esta combinación. | No considera fechas/temporada, así que dos tarifas podrían tener mismo propiedad+tramo pero fechas distintas y el selector no sabría cuál elegir. |
| **B** | `propiedadId + tramoNoches + temporada` | `estanciaTemporada` existe en BD y UI lo agrupa por temporada. | `calcularPrecio` **no usa** `estanciaTemporada`, así que la temporada no afecta la selección técnicamente. |
| **C** | `propiedadId + tramoNoches + fechas` | Las fechas `fechaInicio/fin` definen vigencia y el código las usa para filtrar. | Las fechas pueden superponerse (demostrado), así que mismo propiedad+tramo+fechas aún no garantiza unicidad si hay múltiples tarifas con mismo rango. |
| **D** | `propiedadId + temporada + tramoNoches + fechas` | Agrupa todos los campos de `Precio`. | Ningún campo toma decisiones solas; la combinación es necesaria pero quizás insuficiente (ver `cantidadPersonas`, `tipoDia`). |
| **E** | `propiedadId + temporada + tramoNoches + tipoDia + fechas` | Incluye todo lo que el schema tiene. | `tipoDia` no es usado por cálculo, por lo que incluiría un campo irrelevante para la selección. |
| **F** | `propiedadId + temporada + tramoNoches + tipoDia + cantidadPersonas + fechas` | El schema completo. | `cantidadPersonas` siempre es 1, `tipoDia` casi siempre es "TODOS". Incluirían ruidos técnicos. |

### 10.2 Conclusión

**Ningún candidato captura completamente la intención de negocio demostrada.** La evidencia muestra que:

- `propiedadId + tramoNoches + fechas` es lo que `calcularPrecio()` usa efectivamente para seleccionar.
- `estanciaTemporada` y `tipoDia` existen pero no son usados por el cálculo.
- `cantidadPersonas` siempre es 1, haciendo irrelevante su papel en la selección actual.

**Identidad funcional demostrada**: Una tarifa se diferencia de otra principalmente por **`propiedadId + tramoNoches + rango de fechas (fechaInicio/fin)`**. Los otros campos (`estanciaTemporada`, `tipoDia`, `cantidadPersonas`) están técnicamente disponibles pero **no tienen efecto en la selección actual**.

---

## 11. Identidad vs Selector

### 11.1 Distinción obligatoria

| Concepto | Definición | Aplicación en el sistema |
|---|---|---|
| **Identidad** | Qué hace que una tarifa sea una tarifa distinta (físicamente) | `id` de la fila en BD. Una fila única con su combinación de campos. |
| **Selector** | Qué condiciones hacen que una reserva utilice determinada tarifa | `calcularPrecio()` usa: `propiedadId + tramoNoches + fecha range`. **No usa** `estanciaTemporada`, `tipoDia`, `cantidadPersonas` (porque siempre son 1/“TODOS”). |

### 11.2 Ejemplo ilustrativo

Es perfectamente posible que:
- **Identidad**: `id = "cmrj91hi8000fdgduj1nw4nyn"` identify físicamente la fila.
- **Selector**: `propiedad + tramo + fechas` determine que esa tarifa corresponde a la reserva.

En la práctica actual, el selector only considera una subcadena de la identidad: `propiedadId + tramoNoches + fechaInicio/fin`. Los otros campos de identidad no influyen en la decisión de selección.

---

## 12. Flujo completo de una reserva

### 12.1 Caso de ejemplo (basado en datos actuales)

**Reserva**: Propiedad X, ingreso 10/01, salida 12/01, 2 personas.

### 12.2 Paso a paso

1. **¿Cuántas noches?**
   - Salida 12/01 - Entrada 10/01 = 2 noches.
   - `tramoFromNoches(2)` → `"DE_DOS_A_SEIS"`.

2. **¿Qué tramo?**
   - `DE_DOS_A_SEIS` (2 noches entra en este rango).

3. **¿Qué temporada?**
   - El 10/01/2026 está dentro del rango 2026-03-01 a 2026-04-30? No, enero está fuera.
   - Depende de la propiedad. Revisando datos: algunas propiedades tienen "Temporada alta" desde 2026-12-01 a 2026-02-28 (cubre enero). Otras tienen rangos diferentes.

4. **¿Qué tarifas son candidatas?**
   - `prices = await prisma.precio.findMany({ where: { propiedadId, activo: true, tramoNoches: "DE_DOS_A_SEIS", fechaInicio: { lte: salida }, fechaFin: { gte: ingreso } } })`
   - Devuelve todas las filas activas de ese tramo que superponen las fechas.

5. **¿Cuál se selecciona?**
   - `precios.find((p) => personas <= p.cantidadPersonas) ?? precios[precios.length - 1]`
   - Como `cantidadPersonas = 1` en todos y `personas = 2`, la condición `2 <= 1` es falsa para todas.
   - Fallback: `precios[precios.length - 1]` → la **última fila** de la lista orderBy `fechaInicio asc`.

6. **¿Precio por noche?**
   - `precioMatch.precioPorNoche.toNumber()`.
   - Multiplicado por `noches` (2) → `totalSinDescuento`.

7. **¿Promo semanal?**
   - `tramo === "SIETE_O_MAS"`? No, son 2 noches. Sin descuento.

8. **Total**
   - `precioPorNoche * 2`.

### 12.3 Limitaciones del ejemplo

- Si la reserva fuera de 7 noches, el tramo sería `SIETE_O_MAS` y si `promoSemanal > 0` y `tramo === "SIETE_O_MAS"`, aplicaría descuento.
- Si la reserva cruzara un límite de temporada (ej: 30/11 a 02/12), las tarifas con fechas solapadas competirían y el orden `asc` por `fechaInicio` determinaría cuál se toma primero.
- Si `tipoDia` fuera distinto de "TODOS", el cálculo actual lo ignoraría.

### 12.4 Conclusión

El flujo es **determinista pero incompleto**: define reglas claras para la mayoría de los casos (tramo, multiplicación por noches), pero tiene casos borde sin definir (superposición de fechas, temporada, tipo de día, cantidad de personas > 1).

---

## 13. Significado de los 8 campos del panel

| Campo | Significado técnico | ¿Dónde se almacena? | Dependencias |
|---|---|---|---|
| **Temporada Baja | Precio x noche** | Input en UI → creado/actualizado vía API POST a `/api/precios` → stored en `Precio.precioPorNoche`. | UI ↔ API ↔ BD. No hay validación automática de consistencia. |
| **Temporada Baja | Precio 2-6 noches** | Same as above, pero el admin ingresa un precio distinto por tramo. | Mismo campo `precioPorNoche` en filas distintas con `tramoNoches = DE_DOS_A_SEIS`. |
| **Temporada Baja | Precio +7 noches** | Same, para `tramoNoches = SIETE_O_MAS`. | Mismo patrón. |
| **Temporada Baja | Promo semanal** | Input en UI. En código: afecta `totalEstadia` solo si `tramo === "SIETE_O_MAS"`. Almacenado en `Propiedad.promoSemanal` (único valor) O como fila nueva de `Precio` con `tipoDia = SEMANA`. | **NO DEMOSTRADO**: Si es propiedad o tarifa. |
| **Temporada Alta | Precio x noche** | Igual que Baja, pero para temporada alta. | Mismo mecanismo. |
| **Temporada Alta | Precio 2-6 noches** | Igual que Baja, temporada alta. | Mismo mecanismo. |
| **Temporada Alta | Precio +7 noches** | Igual que Baja, temporada alta. | Mismo mecanismo. |
| **Temporada Alta | Promo semanal** | Igual que Baja, temporada alta. | Mismo mecanismo. |

### 13.1 ¿Qué representa cada input?

Cada input representa **un precio a almacenar en la tabla `Precio`** con el `tramoNoches` y `estanciaTemporada` correspondientes. Pero **no está determinado**:

- Si el precio es por noche o total.
- Si múltiples inputs para la misma temporada pueden coexistir (actualmente sí, hay duplicados).
- Si el admin debería modificar una fila existente o crear una nueva (el código `actualizarMenuPrecios` crea nuevas filas cada vez).

### 13.2 Evidencia de confusión

- `actualizarMenuPrecios()` **siempre crea nuevas filas** (no actualiza existentes), lo que genera duplicados.
- El admin podría pensar que está "editando el precio de la temporada Baja" pero técnicamente está agregando una nueva fila de `Precio`.
- No hay mensaje de error si ya existe una fila con mismo propiedad+tramo+fecha+estancia.

---

## 14. Comportamiento esperado del administrador

### 14.1 ¿Qué espera el administrador al cambiar "Precio x noche" de Temporada Baja?

Basado en la UI y el flujo actual:

1. **¿Qué entidad debería modificarse?**: Fila nueva o existente de `Precio` con `estanciaTemporada = "baja"` y el tramo correspondiente.
2. **¿Debería cambiar una fila existente?**: No lo hace el código actual (`actualizarMenuPrecios` crea filas nuevas).
3. **¿Debería crearse una nueva tarifa?**: Sí, ese es el comportamiento actual.
4. **¿Qué pasa con la tarifa anterior?**: Se queda en la BD, posiblemente creando duplicados o conflictos.
5. **¿Debería cambiar su vigencia?**: No modifica `fechaInicio/fin` automáticamente; el admin debe ingresar fechas en el formulario.
6. **¿Debería afectar solamente Baja?**: Sí, si el admin usa el formulario para Temporada Baja.
7. **¿Debería afectar Alta?**: No, son temporadas separadas en la UI.
8. **¿Debería modificar el precio público calculado?**: Sí, `calcularPrecio()` usará la nueva tarifa si coincide con las fechas/trastos de la reserva.
9. **¿Debería afectar reservas futuras?**: Sí, al cambiar la tarifa que `calcularPrecio` seleccionará.
10. **¿Debería afectar reservas ya creadas?**: **NO**. Las reservas existentes tienen `precioTotal_estadia` guardado y `estado` PENDIENTE/CONFIRMADA/CANCELADA. Modificar tarifas no retroactiva las reservas pasadas (el código no tiene lógica de actualización posterior).

### 14.2 Bug original visto desde negocio

> **Cambia "Precio x noche" de Temporada Baja de una cabaña.**

Desde la perspectiva del administrador razonable:
1. Esperaría que el precio de la temporada baja de esa cabaña cambie.
2. Esperaría que afecte **futuras reservas** para fechas en la temporada baja.
3. **No esperaría** que afecte reservas ya confirmadas (lógica típica: "precio al momento de la reserva").
4. **No esperaría** que tenga que lidiar con duplicados o IDs de fila manualmente.
5. Esperaría que el cambio sea **inmediato** y visible en la calculadora pública.

**Contradicción**: El comportamiento actual (`actualizarMenuPrecios` creando filas nuevas) podría hacer que el administrador se encuentre con duplicados o confusiones sobre qué fila está siendo modificada. **No hay evidencia** de si este fue el diseño intencionado o un efecto secundario del desarrollo.

---

## 16. Evidencia histórica / Git

| Commit | Qué se intentó | Modelo que parecía tener el desarrollador |
|---|---|---|
| `36646e1` feat(admin): agregar campo promoSemanal a propiedades y lógica de descuento para 7+ noches | Agregó `promoSemanal` a `Propiedad` y descuento en `calcularPrecio` para `tramo === "SIETE_O_MAS"`. | Temporada como propiedad de tarifa (campo en Precio) + descuento por tramo 7+ noches. |
| `1325bc2` fix(precios): calcularPrecio filtra por tramoNoches y normaliza fechas a local | Filtrado por tramo y validación de fechas. | Tramo + fechas como selectores principales. |
| `06b7901` feat(public): galería accordion flex y calculadora de precio en detalle de cabañas | Primera versión pública de la calculadora de precio. | Modelo emergente en desarrollo temprano. |
| `db2dd57` feat(public): traer propiedades reales desde la base de datos | Carga de datos reales. | No directamente modelo de precios. |
| `43f4d26` panel de administración con listado de cabañas y atributo s | Panel admin creado. | Inicio del modelo admin. |
| `8d07cd5` Merge pull request #11 | Integración de descuento promo semanal. | La promo semanal se agregó al final, parece añadido después del núcleo. |

**Patrón observado**: El modelo de precios parece haber evolucionado en etapas:
1. Primeramente: `precioBase` en propiedad + precios simples.
2. Luego: Tabla `precio` con `tipo_dia`, fechas, `tramo_noches` añadidos en migration `20260907`.
3. Después: `estancia_temporada` añadido en misma migration (backfill a DE_DOS_A_SEIS y 1).
4. Finalmente: `promoSemanal` agregado a `propiedad` en migration `20260924`, con lógica de descuento en `calcularPrecio`.

Sugiere que el modelo **no fue definido desde el inicio como ahora es**, sino que fue creciendo sobre la marcha, lo que explica las inconsistencias (duplicados, campos no usados, backfill forzado).

---

## 17. Decisiones demostradas

| Decisión | Nivel de certeza | Evidencia |
|---|---|---|
| `precioPorNoche` es multiplicado por `noches` en `totalEstadia` | **DEMOSTRADO** | Código `calcularPrecio()`: `const totalSinDescuento = precioPorNoche * noches`. |
| `tramoNoches` determina categoría por cantidad de noches | **DEMOSTRADO** | `tramoFromNoches()`: 1→UNA_NOCHE, 2-6→DE_DOS_A_SEIS, 7+→SIETE_O_MAS. |
| `calcularPrecio()` filtra por `propiedadId + tramoNoches + fecha range` | **DEMOSTRADO** | Código: `where: { propiedadId, activo: true, tramoNoches: tramo, fechaInicio: { lte: salida }, fechaFin: { gte: ingreso } }`. |
| `cantidadPersonas siempre = 1` en datos actuales | **DEMOSTRADO** | Consulta BD: las 65 filas tienen `cantidad_personas = 1`. |
| `tipoDia casi siempre = "TODOS"` | **DEMOSTRADO** | Consulta BD: ~58/65 filas tienen `tipo_dia = TODOS`. |
| `estanciaTemporada` no es usado por `calcularPrecio()` | **DEMOSTRADO** | Código: no hay referencia a `estanciaTemporada` en la función. |
| `promoSemanal` en `Propiedad` siempre es 0 | **DEMOSTRADO** | Todos los 8 registros de `Propiedad` tienen `promoSemanal = 0`. |
| Los rangos de fecha pueden superponerse | **DEMOSTRADO** | Mismo propiedad, mismas fechas, diferentes nombres/temporadas activos. |
| `actualizarMenuPrecios()` crea nuevas filas (no actualiza) | **DEMOSTRADO** | Código: `await prisma.precio.create` en loop, no `update`. |

---

## 18. Decisiones pendientes

| Pendiente | Por qué no está determinado | Posibles enfoques |
|---|---|---|
| ¿Es `precioPorNoche` precio por noche o precio total por tramo? | No hay documentación ni comentarios que lo specifiquen. | 1) Asumir precio por noche (actual comportamiento en cálculo). 2) Asumir precio total y ajustar cálculo. 3) Agregar campo aclaratorio. |
| ¿Significa `estanciaTemporada` temporada real o es etiqueta visual? | `calcularPrecio` no lo usa. | 1) Quitar campo. 2) Implementar lógica que sí lo use. 3) Mantener como solo etiqueta UI. |
| ¿Debería `promoSemanal` estar en `Propiedad` o en `Precio`? | UI muestra 8 inputs (2 temporadas × 4 campos), BD tiene 1 campo en Propiedad. | 1) Mover promo a tabla Precio (por tarifa). 2) Mantener en Propiedad (único valor). 3) Eliminar de UI. |
| ¿Deberían existir tarifas superpuestas o debería preversez una? | Los datos tienen superposiciones activas. | 1) Permitir superposición (actual). 2) Implementar validación para evitar. 3) Documentar que es esperada. |
| ¿Debería `cantidadPersonas` tener valores distintos de 1? | Migration comment dice que sí, pero nadie lo cargó. | 1) Cargar valores reales (4, 5, 6 según capacidad). 2) Mantener 1 y eliminar filtrado. 3) Quitar campo. |
| ¿Debería `tipoDia` tener efecto en el cálculo? | Campo existe pero no usa el cálculo. | 1) Implementar lógica por día de la semana. 2) Quitar de UI y schema. 3) Documentar que no aplica. |
| ¿Qué pasa cuando el admin "guarda" el menú de precios? | `actualizarMenuPrecios` crea filas nuevas cada vez. | 1) Cambiar a actualizar existentes. 2) Mantener creación nueva pero limpiar duplicados. 3) Agregar validación de únicos. |

---

## 19. Modelo funcional reconstruido

### 19.1 Modelo actual (lo que el sistema hace)

```
Una tarifa = fila en tabla Precio con:
- propiedadId (identifica la cabaña)
- tramoNoches (categoría: 1 noche, 2-6 noches, 7+ noches)
- fechaInicio / fechaFin (rango de vigencia)
- precioPorNoche (precio unitario, multiplicado por noches después)
- cantidadPersonas (siempre 1 en práctica, usado para filtro ascendente)
- tipoDia (siempre "TODOS" en práctica, sin efecto en cálculo)
- estanciaTemporada ("baja" o "alta", sin efecto en cálculo)
- activo (booleano)

Selección durante reserva:
1. Calcular noches → tramo
2. Filtrar por propiedad + tramo + fechas que superpongan
3. Ordenar por cantidadPersonas ascendente
4. Seleccionar primera donde personas <= cantidadPersonas
5. Si ninguna: tomar la última de la lista
6. Precio = precioPorNoche * noches
7. Si tramo === "SIETE_O_MAS" y promoSemanal > 0: aplicar descuento porcentaje
```

### 19.2 Dónde están las incertidumbres

- `precioPorNoche`: ¿por noche o total?
- `estanciaTemporada`, `tipoDia`: no afectan selección actualmente.
- `cantidadPersonas`: siempre 1, filtrado ineficaz.
- `promoSemanal`: ¿en propiedad o por tarifa? ¿porcentaje sobre 7+ noches?
- Superposición de fechas: qué pasa si múltiples tarifas coinciden.

### 19.3 Decisiones que aún necesita el negocio

1. Definir si `precioPorNoche` es por noche o total por estadía.
2. Definir el rol de `estanciaTemporada` (¿temporada real o etiqueta?).
3. Definir si `promoSemanal` es por propiedad o por tarifa, y su algoritmo exacto.
4. Definir si `cantidadPersonas` debe tener valores distintos de 1 y cómo afecta al filtrado.
5. Definir si `tipoDia` debe tener efecto en el cálculo.
6. Definir estrategia de superposición de tarifas (mismo propiedad/fecha/tramo).
7. Definir comportamiento de `actualizarMenuPrecios` (¿actualizar filas existentes o crear nuevas?).

---

## 20. Nivel de certeza

| Tema | Cierto | Probable | Posible | Dudoso | Incierto |
|---|---|---|---|---|---|
| `precioPorNoche` × noches = total | ✓ | | | | |
| Tramo por noches | ✓ | | | | |
| Selección por propiedad+tramo+fechas | ✓ | | | | |
| `cantidadPersonas = 1` en BD | ✓ | | | | |
| `tipoDia = TODOS` en BD | ✓ | | | | |
| `estanciaTemporada` no usado en cálculo | ✓ | | | | |
| `promoSemanal` = 0 en todas propiedades | ✓ | | | | |
| Rangos de fecha pueden superponerse | ✓ | | | | |
| `actualizarMenuPrecios` crea filas nuevas | ✓ | | | | |
| Temporada determina selección | | ✓ | | | |
| Promo es porcentaje sobre 7+ noches | | ✓ | | | |
| `precioPorNoche` es por noche (no total) | | | ✓ | | |
| `estanciaTemporada` es temporada real | | | ✓ | | |
| `promoSemanal` en Propiedad basta | | | ✓ | | |
| `cantidadPersonas` > 1 en algún lado | | | | ✓ | |
| `tipoDia` tiene efecto en cálculo | | | | ✓ | |
| Superposición de tarifas = error | | | | ✓ | |

---

## 21. Decisión final

**El modelo funcional actual está parcialmente definido técnicamente pero incompleto desde el punto de vista de negocio.**

Los hechos demostrados (lo que el código y los datos hacen) son claros y constituyen la base técnica. Sin embargo, varios campos y comportamientos carecen de definición de negocio explícita, lo que genera:

1. **Duplicados** por creación repetida de filas.
2. **Campos sin efecto** (`estanciaTemporada`, `tipoDia`) que existen pero no usan el cálculo.
3. **Lógica de promo** sin claridad si es por propiedad o tarifa.
4. **Precio sin unidad definida** (por noche vs total).

**Para el siguiente paso** (conversión a especificación técnica), deben definirse explícitamente:

1. Si `precioPorNoche` es precio por noche o total.
2. Si `estanciaTemporada` y `tipoDia` deben tener efecto en `calcularPrecio` o ser removidos/archivados.
3. Si `promoSemanal` pertenece a `Propiedad` (único valor) o a `Precio` (por tarifa), y su fórmula exacta.
4. Si `cantidadPersonas` debe ser 1 siempre o tomar valores según capacidad.
5. Cómo manejar la superposición de tarifas para misma propiedad/fechas.
6. Si `actualizarMenuPrecios` debe actualizar filas existentes o crear nuevas, y estrategia para evitar duplicados.

**La auditoría está lista** como especificación funcional pending decisiones de negocio items 1-6 arriba. No se han modificado archivos de código, BD ni schema durante este análisis.