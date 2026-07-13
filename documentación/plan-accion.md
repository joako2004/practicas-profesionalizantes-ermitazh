**CABAÑAS ERMITAZH**

Sistema de Gestión de Reservas

**PLAN DE ACCIÓN — DESARROLLO**

Versión 1.0 · Junio 2025

**1. RESUMEN DEL PROYECTO**

|  |  |
| --- | --- |
| **Cliente** | Cabañas Ermitazh — Mendoza, Argentina |
| **Sistema** | Web pública + Panel de administración + API |
| **Stack** | Next.js 14 · Supabase · Prisma · Tailwind CSS · Supabase Auth |
| **Hosting** | Vercel (frontend) + Supabase (BD y storage) — 100% gratuito |
| **Equipo** | 4 integrantes · 1 Tech Lead (Joaquin) |
| **Metodología** | Iterativa · Feature branches · PRs con revisión del Tech Lead |
| **Agentes de IA** | OpenCode u otros — reglas en AGENTS.md en la raíz del repo |
| **Repositorio** | GitHub — rama main protegida (solo merge vía PR aprobado) |

**2. DEFINICIÓN DEL MVP**

El MVP (Producto Mínimo Viable) es la versión del sistema que debe funcionar correctamente antes de hacer el deploy a producción. Todo lo que está fuera del MVP puede desarrollarse en iteraciones posteriores.

**2.1 Incluido en el MVP**

* Web pública: home, listado de propiedades, detalle de cabaña, formulario de pre-reserva, calendario de disponibilidad, sección de contacto con WhatsApp.
* Panel admin: login seguro, dashboard, gestión de reservas (confirmar / rechazar), calendario de reservas, CRUD de propiedades, configuración de precios por temporada.
* API: disponibilidad, pre-reserva, administración de reservas y propiedades.
* Integración WhatsApp: redirect con datos de la pre-reserva pre-cargados.
* Deploy funcional en Vercel + Supabase.

**2.2 Fuera del MVP (iteraciones posteriores)**

* Sección de reseñas / opiniones de huéspedes.
* Notificaciones automáticas por email al huésped.
* Reporte de ingresos avanzado (gráficos, filtros por período).
* Gestión de consultas pendientes en el panel.
* Sincronización de calendario con Airbnb / Booking.

*Regla de priorización: si una tarea bloquea el flujo principal (buscar → pre-reservar → confirmar), es MVP. Si es una mejora o feature adicional, puede esperar.*

**3. FLUJO DE TRABAJO DEL EQUIPO**

**3.1 Ciclo de una tarea**

1. El integrante se autoasigna una tarea disponible en la planilla de tareas (Google Sheets).
2. Cambia el estado a 'En proceso' y registra su nombre en la columna Responsable.
3. Crea la rama desde main con el nombre exacto indicado en la planilla: git checkout -b feature/nombre-corto.
4. Desarrolla la funcionalidad en esa rama. Commits pequeños y descriptivos (ver convención en AGENTS.md).
5. Cuando la tarea está terminada, sube la rama y abre un Pull Request hacia main en GitHub.
6. Cambia el estado en la planilla a 'Para revisar'.
7. El Tech Lead revisa el PR: aprueba, solicita cambios o rechaza con comentarios.
8. Si se aprueba: se mergea a main y se elimina la rama de feature. Estado → 'Revisada'.
9. Si hay cambios pedidos: el integrante los aplica en la misma rama y notifica al Tech Lead.

**3.2 Reglas de convivencia en el repositorio**

* Nunca trabajar directamente sobre main.
* Antes de crear una rama, hacer git pull origin main para partir del código más reciente.
* Si dos personas tocan el mismo archivo, quien abre el PR primero tiene prioridad. El segundo resuelve los conflictos antes de pedir revisión.
* No cerrar el PR uno mismo. Solo el Tech Lead mergea.
* El archivo AGENTS.md es de solo lectura para el equipo. Solo el Tech Lead lo modifica.

**3.3 Criterios de aprobación de un PR**

* El código corre sin errores (npm run build no falla).
* Sigue las convenciones de nomenclatura y estructura definidas en AGENTS.md.
* No tiene console.log(), credenciales hardcodeadas ni archivos .env commiteados.
* Los componentes usan TypeScript con tipos definidos (no any).
* La funcionalidad fue probada manualmente en entorno local antes de abrir el PR.

**4. FASES DE DESARROLLO**

El proyecto se divide en 8 fases ordenadas por dependencia técnica. Las fases 1 a 4 son bloqueantes: no se puede avanzar a la siguiente hasta completar la anterior. Las fases 5 y 6 pueden desarrollarse en paralelo una vez que la API está completa.

| **Fase** | **Objetivo central** | **Criterio de salida** |
| --- | --- | --- |
| **1 · Setup** | Base técnica del proyecto: Next.js, Tailwind, estructura de carpetas, ESLint. | Proyecto corre localmente sin errores. |
| **2 · Base de datos** | Schema Prisma completo, migraciones ejecutadas, seed con datos de prueba. | prisma studio muestra datos correctos. |
| **3 · Auth** | Login del admin funcionando con Supabase Auth. Rutas /admin/\* protegidas. | Acceso bloqueado sin sesión activa. |
| **4 · API** | Todos los Route Handlers operativos y testeados con datos reales. | Respuestas correctas en todas las rutas. |
| **5 · Web pública** | Todas las páginas del huésped funcionando y conectadas a la API. | Flujo completo: buscar → pre-reservar → WhatsApp. |
| **6 · Panel admin** | Dashboard, reservas, propiedades y precios operativos. | Admin puede confirmar una reserva end-to-end. |
| **7 · Integraciones** | WhatsApp redirect, email de confirmación, storage de fotos. | Upload de fotos y redirect a WA funcionando. |
| **8 · Deploy** | Sistema desplegado en Vercel + Supabase producción. | URL pública accesible. Build exitoso. |

**5. DETALLE DE TAREAS POR FASE**

**Fase 1 · Setup del Proyecto**

|  |  |
| --- | --- |
| **Prerequisito** | Repo creado en GitHub con protección de main configurada. |
| **Bloquea a** | Todas las demás fases dependen de esta. |
| **Criterio de salida** | El comando npm run dev levanta el proyecto sin errores. La estructura de carpetas está creada y documentada en el README. |

| **Tarea** | **Rama** | **Prio.** |
| --- | --- | --- |
| Crear proyecto Next.js 14 con App Router, TypeScript y Tailwind | feature/project-setup | **Alta** |
| Configurar paleta de colores y variables CSS de la identidad visual | feature/design-system | **Alta** |
| Configurar variables de entorno (.env.example completo) | feature/env-config | **Alta** |
| Definir y crear estructura de carpetas /app, /components, /lib, /prisma | feature/folder-structure | **Alta** |
| Configurar ESLint + Prettier con reglas compartidas | feature/linting-setup | **Media** |

**Fase 2 · Base de Datos**

|  |  |
| --- | --- |
| **Prerequisito** | Fase 1 completada. Proyecto Supabase creado con DATABASE\_URL disponible. |
| **Bloquea a** | La API (Fase 4) no puede desarrollarse sin los modelos de datos. |
| **Criterio de salida** | npx prisma studio muestra las tablas con datos de prueba. Las migraciones están commiteadas en /prisma/migrations. |

| **Tarea** | **Rama** | **Prio.** |
| --- | --- | --- |
| Crear proyecto Supabase y conectar con Prisma (prisma init + DATABASE\_URL) | feature/supabase-setup | **Alta** |
| Schema Prisma: modelo Propiedad (fotos, servicios, capacidad, precio\_base) | feature/schema-propiedad | **Alta** |
| Schema Prisma: modelo Reserva (huésped, fechas, estado, seña) | feature/schema-reserva | **Alta** |
| Schema Prisma: modelo Precio (rangos por temporada y tipo de día) | feature/schema-precio | **Alta** |
| Schema Prisma: modelos Reseña y Consulta | feature/schema-extras | **Media** |
| Ejecutar migraciones y crear seed con datos de prueba realistas | feature/db-seed | **Alta** |

**Fase 3 · Autenticación**

|  |  |
| --- | --- |
| **Prerequisito** | Fase 2 completada. Usuario admin creado en Supabase Auth. |
| **Bloquea a** | El panel admin no puede desarrollarse sin rutas protegidas. |
| **Criterio de salida** | Acceder a /admin sin sesión redirige a /admin/login. Con credenciales correctas, el acceso funciona. |

| **Tarea** | **Rama** | **Prio.** |
| --- | --- | --- |
| Configurar Supabase Auth y crear usuario administrador | feature/auth-setup | **Alta** |
| Página de login del panel admin (/admin/login) | feature/admin-login-page | **Alta** |
| Middleware Next.js que protege todas las rutas /admin/\* | feature/auth-middleware | **Alta** |

**Fase 4 · API (Route Handlers)**

|  |  |
| --- | --- |
| **Prerequisito** | Fases 1-3 completadas. |
| **Bloquea a** | Las fases 5 y 6 consumen esta API. No se puede construir la UI sin endpoints funcionando. |
| **Criterio de salida** | Todos los endpoints responden correctamente verificados con una herramienta como Postman o Thunder Client. |

| **Tarea** | **Rama** | **Prio.** |
| --- | --- | --- |
| GET /api/propiedades — listado con filtros | feature/api-propiedades | **Alta** |
| GET /api/propiedades/[id] — detalle de cabaña | feature/api-propiedad-detalle | **Alta** |
| GET /api/disponibilidad — verificar conflictos por fechas | feature/api-disponibilidad | **Alta** |
| POST /api/pre-reserva — guardar pre-reserva en estado pendiente | feature/api-prereserva | **Alta** |
| CRUD /api/admin/reservas — gestión completa de reservas | feature/api-reservas-admin | **Alta** |
| CRUD /api/admin/propiedades — gestión de cabañas con fotos | feature/api-propiedades-admin | **Alta** |
| CRUD /api/admin/precios — rangos de precios por temporada | feature/api-precios | **Alta** |
| GET/PATCH /api/admin/consultas y /api/admin/resenas | feature/api-consultas-resenas | **Media** |

**Fase 5 · Web Pública**

|  |  |
| --- | --- |
| **Prerequisito** | Fase 4 completada. Fotos de las cabañas disponibles. |
| **Bloquea a** | Esta fase puede desarrollarse en paralelo con la Fase 6. |
| **Criterio de salida** | Un visitante puede buscar disponibilidad, ver una cabaña y completar una pre-reserva que lo redirige a WhatsApp con los datos cargados. |

| **Tarea** | **Rama** | **Prio.** |
| --- | --- | --- |
| Layout base: navbar con logo, navegación y footer | feature/layout-base | **Alta** |
| Home: sección hero con imagen principal y CTA | feature/home-hero | **Alta** |
| Home: buscador de disponibilidad (fechas + personas) | feature/home-buscador | **Alta** |
| Home: sección de servicios e información general del complejo | feature/home-info | **Media** |
| Listado de propiedades con filtros (/propiedades) | feature/properties-list | **Alta** |
| Detalle de cabaña con galería de fotos (/propiedades/[id]) | feature/property-detail | **Alta** |
| Calendario de disponibilidad pública | feature/calendario-publico | **Alta** |
| Formulario de pre-reserva (conectado a la API) | feature/form-prereserva | **Alta** |
| Sección de contacto: WhatsApp, mapa, redes, email | feature/contacto-mapa | **Media** |
| Sección de reseñas de huéspedes (fuera del MVP) | feature/resenas-publico | **Baja** |

**Fase 6 · Panel de Administración**

|  |  |
| --- | --- |
| **Prerequisito** | Fase 4 completada. Fase 3 (auth) operativa. |
| **Bloquea a** | Puede desarrollarse en paralelo con la Fase 5. |
| **Criterio de salida** | El administrador puede confirmar una reserva desde el panel y el calendario se actualiza reflejando la ocupación correcta. |

| **Tarea** | **Rama** | **Prio.** |
| --- | --- | --- |
| Layout del panel: sidebar, header y navegación admin | feature/admin-layout | **Alta** |
| Dashboard principal con KPIs de ocupación y reservas | feature/admin-dashboard | **Alta** |
| Calendario de reservas vista admin | feature/admin-calendario | **Alta** |
| Gestión de reservas: confirmar, rechazar, registrar seña | feature/admin-reservas | **Alta** |
| Vista de check-ins y check-outs del día | feature/admin-hoy | **Alta** |
| CRUD de propiedades con upload de fotos | feature/admin-propiedades | **Alta** |
| Configuración de precios y temporadas | feature/admin-precios | **Alta** |
| Gestión de consultas pendientes | feature/admin-consultas | **Media** |
| Reporte de ingresos diarios y generales | feature/admin-reportes | **Media** |
| Gestión de reseñas (moderar, publicar) | feature/admin-resenas | **Baja** |

**Fase 7 · Integraciones**

|  |  |
| --- | --- |
| **Prerequisito** | Fases 5 y 6 completadas. |
| **Bloquea a** | Ninguna. Es la última fase de funcionalidad. |
| **Criterio de salida** | Al completar una pre-reserva, WhatsApp se abre con los datos cargados. Las fotos se suben y muestran correctamente. |

| **Tarea** | **Rama** | **Prio.** |
| --- | --- | --- |
| WhatsApp redirect con mensaje pre-formateado al completar pre-reserva | feature/whatsapp-redirect | **Alta** |
| Subida y gestión de fotos en Supabase Storage desde el panel admin | feature/storage-fotos | **Alta** |
| Notificaciones por email al huésped al confirmar reserva (Resend) | feature/email-notificaciones | **Media** |

**Fase 8 · Deploy a Producción**

|  |  |
| --- | --- |
| **Prerequisito** | Todas las fases anteriores completadas y mergeadas a main. |
| **Bloquea a** | Fase final. |
| **Criterio de salida** | El sistema está accesible desde una URL pública. El flujo completo funciona en producción sin errores. |

| **Tarea** | **Rama** | **Prio.** |
| --- | --- | --- |
| Cargar variables de entorno en el dashboard de Vercel | feature/deploy-env | **Alta** |
| Conectar repo GitHub a Vercel y verificar build exitoso | feature/deploy-vercel | **Alta** |
| Ejecutar migraciones Prisma en la base de datos de producción (Supabase) | feature/deploy-supabase | **Alta** |
| Pruebas end-to-end en producción: flujo completo pre-reserva → admin → confirmación | feature/testing-prod | **Alta** |

**6. GESTIÓN DE RIESGOS**

| **Riesgo** | **Impacto** | **Mitigación** |
| --- | --- | --- |
| Doble reserva | Dos huéspedes reservan la misma cabaña en el mismo período. | La API de disponibilidad debe usar transacciones Prisma para verificar y crear la reserva de forma atómica. |
| Conflictos de merge | Dos integrantes modifican el mismo archivo. | Commits frecuentes y PRs cortos. El segundo en abrir el PR resuelve los conflictos. |
| Scope creep | El cliente agrega requerimientos durante el desarrollo. | Cualquier cambio de alcance pasa por el Tech Lead. Se evalúa si va al MVP o a una iteración posterior. |
| Inactividad de integrante | Un miembro no avanza con su tarea asignada. | El estado 'En proceso' sin avance por más de 3 días activa una conversación del equipo. |
| Cambio de schema en etapa tardía | Modificar los modelos Prisma cuando hay código dependiente. | Definir el schema completo en la Fase 2 antes de escribir cualquier API o UI. |

**7. CHECKLIST DE INICIO**

Antes de que el equipo comience a trabajar, verificar que todo esto esté configurado:

**Repositorio**

* Repo creado en GitHub con README.md inicial.
* Rama main protegida (ruleset activo, PRs obligatorios para el equipo).
* Archivo AGENTS.md en la raíz del repo.
* .gitignore configurado (node\_modules, .env, .next, dist).
* Todos los integrantes con acceso al repo (rol Write).

**Supabase**

* Proyecto Supabase creado (plan gratuito).
* DATABASE\_URL y claves de API copiadas al .env local.
* Usuario administrador creado en Supabase Auth.

**Equipo**

* Planilla de tareas compartida con todos los integrantes (Google Sheets).
* Nombres reales cargados en el desplegable de Responsable.
* Todos leyeron el AGENTS.md antes de hacer su primera tarea.
* Canal de comunicación del equipo activo (WhatsApp u otro).

*Una vez marcados todos estos ítems, se puede arrancar la Fase 1.*
