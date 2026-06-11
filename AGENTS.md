# AGENTS.md — Reglas para agentes de IA
> Cabañas Ermitazh · Sistema de Gestión de Reservas  
> Stack: Next.js 14 · Supabase · Prisma · Tailwind CSS

---

## 1. Antes de cualquier cambio

**Siempre** realizar este relevamiento antes de escribir o modificar código:

1. Leer `README.md` para entender el estado actual del proyecto.
2. Revisar el `schema.prisma` para conocer los modelos de datos vigentes.
3. Verificar la estructura de carpetas con un listado del directorio `/app` y `/components`.
4. Leer los archivos relevantes a la tarea antes de modificarlos. No asumir su contenido.
5. Revisar si ya existe una implementación parcial de la funcionalidad antes de crear algo nuevo.

---

## 2. Stack y restricciones tecnológicas

- **Framework:** Next.js 14 con App Router. No usar Pages Router.
- **Estilos:** exclusivamente Tailwind CSS. No escribir CSS en archivos `.css` ni usar `style={}` inline salvo casos excepcionales justificados.
- **Base de datos:** acceder siempre a través de Prisma. No escribir queries SQL directas.
- **Autenticación:** usar Supabase Auth. No implementar sistemas de auth propios.
- **Storage:** usar Supabase Storage para archivos y fotos. No guardar archivos en el filesystem local.
- **TypeScript:** obligatorio en todos los archivos. No usar el tipo `any`. Definir interfaces o types para todas las estructuras de datos.
- **No instalar dependencias nuevas** sin consultar al Tech Lead. Verificar siempre si la funcionalidad ya existe en el stack actual.

---

## 3. Estructura del proyecto

```
/app
  /(public)         → páginas visibles al huésped
  /admin            → panel de administración (rutas protegidas)
  /api              → Route Handlers (API)
/components
  /ui               → componentes reutilizables (botones, inputs, cards)
  /admin            → componentes exclusivos del panel admin
  /public           → componentes exclusivos de la web pública
/lib
  /prisma.ts        → cliente Prisma (singleton)
  /supabase.ts      → cliente Supabase
  /utils.ts         → funciones utilitarias generales
/prisma
  schema.prisma     → modelos de datos
  /migrations       → NO editar manualmente
```

Respetar esta estructura. No crear carpetas fuera de ella sin justificación.

---

## 4. Convenciones de código

### Nomenclatura
| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase | `PropertyCard.tsx` |
| Funciones y variables | camelCase | `getAvailability()` |
| Rutas de API | kebab-case | `/api/pre-reserva` |
| Tablas en BD | snake_case plural | `reservas`, `propiedades` |
| Variables de entorno | UPPER_SNAKE_CASE | `SUPABASE_SERVICE_KEY` |

### Componentes
- Un componente por archivo.
- Si un componente supera las 150 líneas, evaluar si debe dividirse.
- Usar Server Components por defecto. Agregar `"use client"` solo cuando sea estrictamente necesario (eventos, hooks de estado).

### API Routes
- Siempre validar el body de entrada antes de operar.
- Siempre retornar respuestas tipadas con el status HTTP correcto.
- Las rutas del panel admin deben verificar sesión activa al inicio del handler.
- Estructura mínima de un handler:

```ts
// Validar sesión (solo rutas admin)
// Validar input
// Operar con Prisma
// Retornar respuesta tipada
```

---

## 5. Base de datos y Prisma

- **Nunca editar archivos dentro de `/prisma/migrations` manualmente.**
- Para modificar el schema: editar `schema.prisma` → ejecutar `npx prisma migrate dev --name descripcion-del-cambio`.
- Para inspeccionar datos en desarrollo: usar Prisma Studio (`npx prisma studio`).
- El cliente Prisma debe instanciarse una sola vez desde `/lib/prisma.ts`. No crear instancias nuevas en otros archivos.
- Ante un cambio de schema que afecte datos existentes, advertir explícitamente antes de ejecutar la migración.

---

## 6. Variables de entorno

- **Nunca hardcodear credenciales, URLs o claves en el código.**
- Las variables que empiezan con `NEXT_PUBLIC_` son visibles en el cliente. No exponer el `SUPABASE_SERVICE_ROLE_KEY` con ese prefijo.
- Si se necesita una variable nueva, agregarla primero a `.env.example` con un valor de ejemplo (sin el valor real) y luego usarla.
- No commitear el archivo `.env` bajo ninguna circunstancia.

```
# Variables requeridas (ver .env.example)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

---

## 7. Git y ramas

- Cada agente trabaja exclusivamente sobre la rama asignada a la tarea.
- **No hacer cambios en `main` ni en ramas de otros integrantes.**
- Commits atómicos: un commit por cambio lógico concreto. Evitar commits tipo "fix", "cambios", "wip".
- Formato de commit:
  ```
  tipo(alcance): descripción corta en presente

  feat(api): agregar endpoint de disponibilidad
  fix(admin): corregir validación de fechas en formulario
  docs(readme): actualizar instrucciones de instalación
  ```
- Tipos válidos: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.

---

## 8. Seguridad

- Las rutas bajo `/admin` deben estar protegidas por el middleware de autenticación. Verificar que el middleware esté activo antes de agregar rutas nuevas al panel.
- No loguear datos sensibles (contraseñas, tokens, datos personales de huéspedes) en consola.
- No exponer stack traces completos en respuestas de API en producción.
- Sanitizar y validar todo input que venga del cliente antes de pasarlo a Prisma.

---

## 9. Lo que un agente NO debe hacer

- ❌ Modificar `main` directamente.
- ❌ Ejecutar `prisma migrate reset` en ningún entorno sin confirmación explícita.
- ❌ Eliminar o renombrar modelos de Prisma sin revisar los impactos en el resto del código.
- ❌ Commitear `.env`, `node_modules` o archivos de build.
- ❌ Reescribir funcionalidad ya existente sin antes leerla y entender por qué está así.
- ❌ Instalar librerías alternativas a las ya definidas en el stack (ej: no agregar `axios` si ya usamos `fetch`, no agregar `styled-components` si usamos Tailwind).
- ❌ Tomar decisiones de arquitectura sin consultar (cambiar estructura de carpetas, agregar capas nuevas, cambiar el modelo de datos de forma significativa).

---

## 10. Ante errores o bloqueos

1. Describir claramente el error encontrado.
2. Indicar qué se intentó y por qué no funcionó.
3. No aplicar workarounds que rompan convenciones del proyecto.
4. Si el problema requiere una decisión de arquitectura, detener y consultar al Tech Lead.