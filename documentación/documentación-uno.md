**IES-9012 San Rafael — Informática**

Prácticas Profesionalizantes III

**ESPECIFICACIÓN DE REQUERIMIENTOS DE SOFTWARE**

**Sistema de Gestión de Reservas**

Cabañas Ermitazh — Mendoza, Argentina

|  |  |
| --- | --- |
| **Alumnos** | Gomila Micaela / Bermudez Damaris / Alvarez Claudio / Peralta Joaquín |
| **Coordinadores** | Prof. Sergio Arroyo — Práctica Profesionalizante III Prof. Graciela Denita — Gestión de Proyectos de Software |
| **Institución** | IES 9-012 San Rafael — Dirección de Informática |
| **Versión** | 1.0 — Junio 2026 |

**1. DEFINICIÓN DE LA EMPRESA**

**1.1 Descripción de la Empresa**

Cabañas Ermitazh es un complejo de alojamiento turístico privado ubicado en la provincia de Mendoza, Argentina. El complejo ofrece ocho (8) propiedades disponibles para alquiler temporario, orientadas al turismo de descanso, naturaleza y experiencias rurales. El negocio opera de forma unipersonal, con el propietario a cargo de todas las funciones administrativas y operativas. El cliente tiene proyección de crecimiento y prevé incorporar nuevas propiedades en el corto plazo.

El complejo comercializa sus propiedades a través de plataformas externas como Airbnb y Booking.com, además de la comunicación directa por WhatsApp. Estos canales generan visibilidad pero implican el pago de comisiones y someten al negocio a las reglas de dichos intermediarios.

**1.2 Descripción del Área de Estudio**

El área de estudio comprende los procesos operativos y digitales de Cabañas Ermitazh: captación y gestión de reservas, comunicación con huéspedes, administración de disponibilidad, registro de pagos y señas, y gestión de precios por temporada. Todos estos procesos se desarrollan actualmente de forma manual y descentralizada, sin integración entre las herramientas utilizadas.

**1.3 Descripción de la Problemática**

La situación actual del negocio presenta los siguientes problemas identificados durante el relevamiento inicial:

* Sitio web desactualizado: no refleja la identidad visual del negocio, no ofrece información actualizada y no permite ninguna interacción con el usuario.
* Ausencia de canal de reservas propio: el complejo no dispone de un medio digital propio para recibir consultas o pre-reservas directas.
* Riesgo de doble reserva: la gestión manual sin sistema centralizado ha generado al menos un episodio de doble reserva.
* Dependencia de plataformas externas: la totalidad de las reservas se canaliza a través de Airbnb y Booking.com, con comisiones de entre el 3% y el 25% por transacción.
* Falta de panel centralizado: el propietario no dispone de herramientas que centralicen el estado de ocupación, ingresos, reservas activas y check-ins.

**2. DEFINICIÓN DEL PROYECTO**

**2.1 Objetivos del Proyecto**

Objetivo general: desarrollar una plataforma web integral para Cabañas Ermitazh que permita al negocio captar reservas directas, centralizar la gestión operativa y profesionalizar su presencia digital, reduciendo la dependencia de plataformas externas.

Objetivos específicos:

1. Desarrollar un sitio web público moderno, responsivo y alineado con la identidad visual del complejo, que funcione como canal de captación de consultas y pre-reservas.
2. Implementar un sistema de gestión de disponibilidad en tiempo real que elimine el riesgo de doble reserva.
3. Desarrollar un panel de administración centralizado para gestionar reservas, propiedades, precios y obtener reportes del negocio.
4. Proveer al administrador autonomía total para modificar precios, disponibilidad y contenido sin depender de asistencia técnica.
5. Desplegar el sistema en producción en infraestructura gratuita (Vercel + Supabase) accesible desde internet.
6. Aplicar buenas prácticas de desarrollo: control de versiones con Git/GitHub, revisión de código mediante pull requests y documentación técnica completa.

**3. ALCANCES**

**Incluido en el sistema (Fase 1 — MVP):**

* Sitio web público: home con buscador de disponibilidad, listado y detalle de propiedades, calendario de disponibilidad, formulario de pre-reserva con redirect a WhatsApp, sección de contacto con mapa, filtros de búsqueda.
* Panel de administración: login seguro, dashboard con KPIs, gestión de reservas (confirmar/rechazar/registrar seña), calendario de ocupación, CRUD de propiedades con carga de fotos, configuración de precios por temporada, reporte de ingresos.
* API interna: endpoints para disponibilidad, pre-reservas y administración completa.
* Integraciones: WhatsApp redirect, Supabase Storage para fotos, notificaciones por email.
* Deploy: sistema desplegado en producción en Vercel y Supabase.

**Fuera del alcance (Fase 1):**

* Procesamiento de pagos online.
* Emisión automática de comprobantes o facturas.
* Reserva 100% automática sin aprobación manual.
* Cuentas de usuario para huéspedes.
* Sincronización de calendario con Airbnb o Booking.com.
* Múltiples administradores o roles de usuario.

**4. OBJETIVOS DEL SOFTWARE**

|  |  |
| --- | --- |
| **OBJ-01** | Permitir al huésped consultar disponibilidad de cabañas en tiempo real según fechas y capacidad. |
| **OBJ-02** | Habilitar la realización de pre-reservas con derivación automática al administrador vía WhatsApp. |
| **OBJ-03** | Prevenir la doble reserva mediante verificación transaccional al confirmar una reserva. |
| **OBJ-04** | Proveer al administrador un panel centralizado con visión completa del estado operativo del negocio. |
| **OBJ-05** | Permitir al administrador gestionar reservas, propiedades y precios sin intervención de un desarrollador. |
| **OBJ-06** | Calcular automáticamente el costo total de una estadía a partir de precios y rangos de temporada configurados. |
| **OBJ-07** | Almacenar y gestionar fotografías de las propiedades con acceso público desde la web. |
| **OBJ-08** | Enviar notificaciones automáticas al confirmar o rechazar una reserva. |
| **OBJ-09** | Garantizar el acceso al panel de administración exclusivamente mediante autenticación segura. |
| **OBJ-10** | Permitir la incorporación de nuevas propiedades sin modificaciones de código. |

**5. DESCRIPCIÓN GLOBAL DEL PRODUCTO**

El sistema es una aplicación web full-stack desarrollada con Next.js 14, compuesta por tres capas: el sitio web público orientado al huésped, el panel de administración para el propietario, y una API interna que conecta ambos módulos con la base de datos PostgreSQL alojada en Supabase.

**5.1 Interfaz del Usuario**

Huésped (usuario externo): accede al sitio web público desde cualquier dispositivo. La interfaz cuenta con navegación simple orientada a la conversión. Puede visualizar propiedades, consultar disponibilidad, filtrar resultados, completar la pre-reserva y contactar por WhatsApp. No requiere cuenta ni inicio de sesión.

Administrador (usuario interno): accede al panel desde computadora de escritorio, previa autenticación con email y contraseña. La interfaz del panel está diseñada para desktop con sidebar de navegación que da acceso a: dashboard, reservas, calendario, propiedades, precios, consultas y reportes.

**5.2 Interfaz del Hardware**

* Huésped: cualquier dispositivo con navegador moderno y conexión a internet (celular, tablet o computadora).
* Administrador: computadora de escritorio o laptop con navegador moderno y resolución mínima recomendada de 1280×720 px.
* Servidor: infraestructura en la nube de Vercel y Supabase. No se requiere servidor físico propio.

**5.3 Interfaz del Software**

* Next.js 14 App Router: framework principal para el renderizado del sitio público (Server Components) y el panel admin (Client Components).
* Prisma ORM: capa de abstracción entre la aplicación y PostgreSQL, gestiona consultas y migraciones.
* Supabase Auth: gestiona la autenticación del administrador mediante JWT y sesiones persistentes.
* Supabase Storage: almacenamiento de fotografías de propiedades con generación de URLs públicas.
* WhatsApp API URL (wa.me): redirección al huésped con datos de pre-reserva pre-cargados.
* Resend / Nodemailer: envío de notificaciones por email al confirmar una reserva.
* Google Maps Embed API: mapa de ubicación del complejo integrado en la web pública.

**6. REQUERIMIENTOS ESPECÍFICOS**

**6.1 Requerimientos Funcionales del Sistema**

**Módulo: Web Pública**

| **ID** | **Descripción del Requerimiento** | **Prioridad** |
| --- | --- | --- |
| **RF-01** | Mostrar propiedades con fotos, descripción, capacidad, servicios y precio por noche. | **Alta** |
| **RF-02** | Permitir buscar propiedades disponibles por fecha de ingreso, salida y cantidad de personas. | **Alta** |
| **RF-03** | Mostrar calendario de disponibilidad visual por propiedad con días ocupados y libres. | **Alta** |
| **RF-04** | Permitir completar formulario de pre-reserva con nombre, teléfono, personas y fechas. | **Alta** |
| **RF-05** | Al enviar el formulario, redirigir a WhatsApp con los datos pre-cargados en el mensaje. | **Alta** |
| **RF-06** | Mostrar filtros de búsqueda por precio, capacidad, fechas, servicios y tipo de cabaña. | **Media** |
| **RF-07** | Mostrar sección de contacto con WhatsApp, teléfono, email, redes y mapa de ubicación. | **Alta** |
| **RF-08** | Mostrar reseñas de huéspedes publicadas por el administrador. | **Baja** |

**Módulo: Panel de Administración**

| **ID** | **Descripción del Requerimiento** | **Prioridad** |
| --- | --- | --- |
| **RF-09** | Requerir autenticación con email y contraseña para acceder al panel. | **Alta** |
| **RF-10** | Mostrar dashboard con: ocupación, cabañas disponibles, reservas activas, check-ins/outs del día, consultas pendientes y estado de pagos. | **Alta** |
| **RF-11** | Mostrar calendario visual de todas las reservas con detalle al hacer clic en una fecha. | **Alta** |
| **RF-12** | Permitir confirmar, rechazar o cancelar reservas, y registrar seña y forma de pago. | **Alta** |
| **RF-13** | Verificar disponibilidad de forma transaccional al confirmar una reserva, impidiendo la doble reserva. | **Alta** |
| **RF-14** | Permitir crear, editar y eliminar propiedades con carga de fotografías, descripción, capacidad, servicios y precio base. | **Alta** |
| **RF-15** | Permitir configurar rangos de precios por temporada y tipo de día (semana / fin de semana). | **Alta** |
| **RF-16** | Calcular automáticamente el costo total de la estadía a partir de fechas y precios configurados. | **Alta** |
| **RF-17** | Mostrar reporte de ingresos con totales diarios y generales, filtrable por período. | **Media** |
| **RF-18** | Permitir gestionar consultas: visualizar, marcar como respondidas y ver detalle. | **Media** |
| **RF-19** | Enviar notificación automática al administrador y/o huésped al confirmar una reserva. | **Media** |
| **RF-20** | Permitir al administrador moderar y publicar reseñas de huéspedes. | **Baja** |

**7. FACTIBILIDAD TÉCNICA**

El proyecto es técnicamente factible. El stack está compuesto íntegramente por tecnologías maduras, de código abierto, ampliamente documentadas y con comunidades activas de soporte.

|  |  |
| --- | --- |
| **Next.js 14** | Framework principal para frontend, backend y API. Utilizado en producción por empresas de escala global. |
| **TypeScript** | Superset de JavaScript con tipado estático. Reduce errores en tiempo de desarrollo. |
| **Tailwind CSS** | Framework de utilidades CSS ampliamente adoptado en la industria. |
| **PostgreSQL 15** | Sistema de gestión de bases de datos relacional robusto y de alto rendimiento. |
| **Prisma ORM** | Capa de abstracción con soporte nativo para TypeScript y migraciones versionadas. |
| **Supabase Auth** | Servicio de autenticación listo para usar, sin implementación propia. |
| **Supabase Storage** | Almacenamiento de objetos con URLs públicas para las fotografías. |
| **Vercel** | Plataforma de deploy continuo para Next.js con integración nativa a GitHub. |

El equipo posee conocimiento previo en el stack. No se requieren licencias pagas ni hardware adicional. Toda la infraestructura necesaria está disponible en planes gratuitos para el volumen actual del cliente.

**8. FACTIBILIDAD OPERATIVA**

El sistema es operativamente factible. El administrador utiliza computadora de escritorio como herramienta principal y tiene familiaridad con herramientas digitales. El panel será diseñado con foco en simplicidad de uso, minimizando la curva de aprendizaje.

Un requerimiento clave relevado con el cliente es la autonomía operativa: el administrador debe poder modificar precios, disponibilidad y contenido sin depender de un programador. Esto se garantiza mediante formularios de edición en el panel sin necesidad de modificar código.

El sistema no requiere personal adicional ni capacitación especializada. Se proveerá documentación de usuario básica como parte de la entrega final. La web pública no requiere intervención del administrador para su funcionamiento diario.

**9. FACTIBILIDAD ECONÓMICA**

El proyecto es económicamente factible. El costo de desarrollo es nulo para el cliente dado que el sistema se desarrolla en el marco de la Práctica Profesionalizante III. Los costos de operación en producción son los siguientes:

|  |  |
| --- | --- |
| **Vercel — hosting** | USD 0 / mes — plan gratuito con CDN global y SSL. |
| **Supabase — BD + auth + storage** | USD 0 / mes — 500 MB BD, 1 GB storage, 50.000 usuarios activos. |
| **GitHub — repositorio** | USD 0 / mes — plan gratuito con repositorio privado. |
| **Dominio personalizado** | USD 10–15 / año (opcional, decisión del cliente). |
| **Costo total** | USD 0 en desarrollo. USD 0–15/año en producción. |

El beneficio económico principal es la reducción de comisiones a plataformas externas: Booking.com cobra entre el 15% y el 25% por reserva, Airbnb entre el 3% y el 15%. Al captar reservas directas, el cliente elimina estos costos por cada reserva gestionada a través de su propia plataforma.

**10. CONCLUSIÓN DE LA FACTIBILIDAD**

El análisis de factibilidad en sus tres dimensiones permite concluir que el proyecto es completamente viable.

Técnicamente, el stack es maduro, documentado y conocido por el equipo. No existen barreras tecnológicas para implementar el sistema dentro del alcance definido.

Operativamente, el sistema fue diseñado priorizando la autonomía del administrador y la simplicidad de uso, garantizando su adopción sin capacitación especializada ni dependencia de asistencia técnica continua.

Económicamente, el costo de desarrollo es nulo para el cliente y los costos de operación son mínimos. Los beneficios en reducción de comisiones superan ampliamente estos costos desde el primer mes de operación.

Se aprueba el desarrollo del Sistema de Gestión de Reservas para Cabañas Ermitazh con el alcance, stack tecnológico y planificación definidos en el presente documento.

**11. CASOS DE USO**

**11.1 Actores**

|  |  |
| --- | --- |
| **Huésped** | Usuario externo. Accede al sitio web público sin autenticación. Puede consultar propiedades, verificar disponibilidad, completar pre-reservas y contactar al administrador. |
| **Administrador** | Usuario interno (propietario). Accede al panel con autenticación. Gestiona reservas, propiedades, precios y configuraciones del sistema. |
| **Sistema** | Actor secundario que ejecuta acciones automatizadas: verificación de disponibilidad, cálculo de precios, redirect a WhatsApp y envío de notificaciones. |

**11.3 Descripción de Casos de Uso**

**CU-01: Consultar Disponibilidad**

| **Campo** | **Detalle** |
| --- | --- |
| **Actor principal** | Huésped |
| **Precondición** | El huésped accede al sitio web. |
| **Descripción** | El huésped ingresa fechas y cantidad de personas. El sistema consulta la base de datos y muestra las propiedades disponibles para ese período. |
| **Flujo principal** | 1. El huésped ingresa fecha de ingreso, salida y cantidad de personas. 2. El sistema valida que las fechas sean correctas. 3. El sistema consulta disponibilidad en la base de datos. 4. El sistema muestra las propiedades disponibles con foto, nombre y precio. |
| **Flujo alternativo** | Si no hay disponibilidad para el período, el sistema muestra mensaje e invita a modificar las fechas. |
| **Postcondición** | El huésped visualiza las propiedades disponibles para el período solicitado. |

**CU-02: Realizar Pre-Reserva**

| **Campo** | **Detalle** |
| --- | --- |
| **Actor principal** | Huésped |
| **Precondición** | El huésped seleccionó una propiedad disponible. |
| **Descripción** | El huésped completa el formulario de pre-reserva. El sistema registra la solicitud en estado pendiente y redirige a WhatsApp con los datos pre-cargados. |
| **Flujo principal** | 1. El huésped completa nombre, teléfono, personas y fechas. 2. El sistema valida los campos obligatorios. 3. El sistema registra la pre-reserva en estado 'pendiente'. 4. El sistema redirige a WhatsApp con mensaje pre-formateado. |
| **Flujo alternativo** | Si la validación falla, el sistema muestra errores en línea sin enviar el formulario. |
| **Postcondición** | La pre-reserva queda registrada y el administrador recibe la consulta por WhatsApp. |

**CU-03: Confirmar Reserva**

| **Campo** | **Detalle** |
| --- | --- |
| **Actor principal** | Administrador |
| **Precondición** | Existe al menos una pre-reserva en estado pendiente en el panel. |
| **Descripción** | El administrador revisa la pre-reserva, registra la seña y la confirma. El sistema verifica disponibilidad de forma transaccional, actualiza el estado y envía notificación. |
| **Flujo principal** | 1. El administrador accede al listado de reservas pendientes. 2. Selecciona y revisa la pre-reserva. 3. Registra el monto de la seña y forma de pago. 4. Confirma la reserva. 5. El sistema verifica que no exista conflicto de disponibilidad. 6. El sistema cambia el estado a 'confirmada' y actualiza el calendario. 7. El sistema envía notificación de confirmación. |
| **Flujo alternativo** | Si se detecta conflicto en el paso 5, el sistema informa al administrador y no confirma la reserva. |
| **Postcondición** | Reserva confirmada, calendario actualizado y notificación enviada. |

**CU-04: Gestionar Propiedades**

| **Campo** | **Detalle** |
| --- | --- |
| **Actor principal** | Administrador |
| **Precondición** | El administrador está autenticado en el panel. |
| **Descripción** | El administrador puede crear, editar y eliminar propiedades, incluyendo carga de fotografías. |
| **Flujo principal** | 1. El administrador accede a la sección de propiedades. 2. Selecciona crear nueva o editar una existente. 3. Completa o modifica los campos del formulario. 4. Carga las fotografías desde su dispositivo. 5. El sistema sube las imágenes a Supabase Storage y guarda las URLs. 6. El sistema guarda los cambios en la base de datos. |
| **Flujo alternativo** | Si el formato de imagen no es válido, el sistema informa el error y no sube el archivo. |
| **Postcondición** | La propiedad es creada o actualizada y los cambios se reflejan en la web pública. |

**CU-05: Configurar Precios por Temporada**

| **Campo** | **Detalle** |
| --- | --- |
| **Actor principal** | Administrador |
| **Precondición** | El administrador está autenticado en el panel. |
| **Descripción** | El administrador define rangos de fechas y precios para distintas temporadas y tipos de día. El sistema utiliza estos precios para calcular automáticamente el costo de las estadías. |
| **Flujo principal** | 1. El administrador accede a la sección de precios. 2. Crea o edita un rango indicando fechas, precio por noche y tipo de día. 3. El sistema guarda la configuración. 4. Al registrar una reserva, el sistema calcula el total sumando el precio por noche de cada día. |
| **Flujo alternativo** | Si dos rangos de fechas se superponen, el sistema aplica el de mayor prioridad o informa el conflicto. |
| **Postcondición** | Precios configurados y cálculo automático de estadías actualizado. |

**12. DISEÑO**

**12.1 Diseño Físico de la Base de Datos**

*Aviso: el diseño presentado corresponde a la planificación inicial. Los modelos, atributos y relaciones son susceptibles de modificación durante el desarrollo a medida que se validen requerimientos con el cliente o surjan necesidades técnicas no anticipadas.*

La base de datos está alojada en Supabase (PostgreSQL 15) y gestionada a través de Prisma ORM. El schema está compuesto por los siguientes modelos:

**Modelo: Propiedad**

|  |  |
| --- | --- |
| **id** | String — cuid() — Clave primaria autogenerada |
| **nombre** | String — Nombre de la cabaña |
| **descripcion** | String — Descripción completa |
| **capacidad** | Int — Cantidad máxima de personas |
| **precioBase** | Decimal — Precio base por noche |
| **fotos** | String[] — Array de URLs de Supabase Storage |
| **servicios** | String[] — Lista de servicios incluidos |
| **activa** | Boolean — Visible en la web pública |
| **creadaEn** | DateTime — Fecha de creación |
| **reservas** | Reserva[] — Relación 1:N |
| **precios** | Precio[] — Relación 1:N |

**Modelo: Reserva**

|  |  |
| --- | --- |
| **id** | String — cuid() — Clave primaria autogenerada |
| **propiedadId** | String — FK → Propiedad.id |
| **huespedNombre** | String — Nombre completo del huésped |
| **huespedTelefono** | String — Teléfono de contacto |
| **personas** | Int — Cantidad de personas |
| **fechaIngreso** | DateTime — Fecha de check-in |
| **fechaSalida** | DateTime — Fecha de check-out |
| **estado** | Enum — PENDIENTE | CONFIRMADA | RECHAZADA | CANCELADA |
| **totalEstadia** | Decimal? — Costo total calculado |
| **sena** | Decimal? — Monto de la seña registrada |
| **formaPago** | String? — Efectivo / Transferencia |
| **notas** | String? — Notas internas del administrador |
| **creadaEn** | DateTime — Fecha de creación |

**Modelo: Precio**

|  |  |
| --- | --- |
| **id** | String — cuid() — Clave primaria autogenerada |
| **propiedadId** | String — FK → Propiedad.id |
| **nombre** | String — Nombre de la temporada |
| **fechaInicio** | DateTime — Inicio del rango |
| **fechaFin** | DateTime — Fin del rango |
| **precioPorNoche** | Decimal — Precio para este rango |
| **tipoDia** | Enum — TODOS | SEMANA | FIN\_DE\_SEMANA |
| **activo** | Boolean — Rango activo |

**Modelo: Consulta**

|  |  |
| --- | --- |
| **id** | String — cuid() — Clave primaria autogenerada |
| **nombre** | String — Nombre del huésped |
| **email** | String? — Email de contacto |
| **mensaje** | String — Contenido de la consulta |
| **estado** | Enum — PENDIENTE | RESPONDIDA |
| **creadaEn** | DateTime — Fecha de recepción |

**Modelo: Reseña**

|  |  |
| --- | --- |
| **id** | String — cuid() — Clave primaria autogenerada |
| **autor** | String — Nombre del autor |
| **texto** | String — Contenido de la reseña |
| **puntuacion** | Int — Puntaje del 1 al 5 |
| **publicada** | Boolean — Visible en la web |
| **creadaEn** | DateTime — Fecha de la reseña |

**12.2 Especificación de Módulos**

|  |  |
| --- | --- |
| **MOD-01: Web Pública** | Server Components de Next.js 14. Comprende: home, listado de propiedades, detalle de cabaña, calendario de disponibilidad, formulario de pre-reserva y contacto. Consume la API interna para datos en tiempo real. |
| **MOD-02: Panel Admin** | Client Components de Next.js 14 bajo /admin. Requiere sesión activa. Comprende: dashboard, reservas, calendario, CRUD de propiedades, precios, consultas y reportes. |
| **MOD-03: API** | Next.js Route Handlers bajo /api. Expone endpoints RESTful para: disponibilidad, pre-reservas, propiedades (público) y administración completa (protegido). Accede a la BD exclusivamente a través de Prisma. |
| **MOD-04: Autenticación** | Supabase Auth con JWT. Middleware de Next.js protege todas las rutas /admin/\* redirigiendo a /admin/login si no hay sesión. |
| **MOD-05: Storage** | Supabase Storage para fotografías de propiedades. URLs públicas almacenadas en el campo fotos[] del modelo Propiedad. |
