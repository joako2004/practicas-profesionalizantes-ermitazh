DOCUMENTO DE DISCOVERY

Cabañas Ermitazh

Sistema de Gestión Web

Proyecto

Sistema de Gestión y Web Pública — Cabañas Ermitazh

Fecha de relevamiento

20 de mayo de 2026

Tipo de documento

Discovery inicial

Estado

Borrador v1.0

Documento de Discovery

Cabañas Ermitazh

1

Contexto del Negocio

Cabañas Ermitazh es un complejo de alojamiento turístico con 8 propiedades disponibles para alquiler. El
negocio  opera  actualmente  a  través  de  plataformas  externas  (Airbnb,  Booking.com)  y  WhatsApp  como
canales principales de captación y gestión de reservas.

El cliente administra el negocio de forma unipersonal y tiene proyección de crecimiento: existe la posibilidad
de sumar más propiedades en el corto plazo.

2 Objetivo Principal del Proyecto

“Obtener reservas.”

El  cliente  busca  reemplazar  su  sitio  web  desactualizado  por  una  plataforma  moderna  que  funcione  como
vitrina  digital  profesional  y  canal  de  captación  de  consultas  y  pre-reservas,  reforzando  su  presencia
frente a las plataformas externas y habilitando un canal de contacto directo con los huéspedes.

3

Situación Actual (AS-IS)

3.1 Canales de reserva vigentes

(cid:127)  Plataformas externas: Airbnb y Booking.com
(cid:127)  WhatsApp y mensajería directa
(cid:127)  Sitio web propio (desactualizado, sin funcionalidad activa)

3.2 Gestión de pagos actual

(cid:127)  Efectivo
(cid:127)  Transferencia bancaria
(cid:127)  Seña obligatoria para confirmar reserva

3.3 Problemas identificados

#

1

2

3

4

5

Problema

El sitio web actual está desactualizado y no genera valor

No hay canal propio para recibir consultas o pre-reservas directas

Se registró al menos un caso de doble reserva, resuelto manualmente

Dependencia total de plataformas externas con sus comisiones y reglas

Sin panel centralizado para visualizar el estado del negocio

4

Actores del Sistema

Página 2

Documento de Discovery

Cabañas Ermitazh

4.1 Administrador (único usuario interno)

El dueño del complejo. Opera principalmente desde computadora de escritorio/laptop, con uso ocasional
desde celular. Requiere control total sobre precios, disponibilidad, reservas y configuraciones sin depender
de un desarrollador para cambios operativos.

4.2 Huésped / Cliente (usuario externo)

Persona  que  visita  la  web  pública  para  informarse,  consultar  disponibilidad  y  realizar  una  pre-reserva  o
contactar al administrador. No requiere cuenta propia (login de huéspedes descartado).

5

Funcionalidades Requeridas (TO-BE)

5.1 Web Pública — Frontend para Huéspedes

Propósito: Informativa + captación de consultas y pre-reservas con derivación a WhatsApp.

Secciones y contenido

(cid:127)  Hero / Portada: fotos principales, buscador de disponibilidad y botón de contacto destacado
(cid:127)  Propiedades: galería con fotos, descripciones, capacidad, servicios y precio
(cid:127)  Servicios y comodidades del complejo
(cid:127)  Ubicación: mapa integrado con la localización del complejo
(cid:127)  Contacto: acceso directo a WhatsApp, teléfono, email y redes sociales

Acciones disponibles para el cliente

(cid:127)  Consultar disponibilidad por fechas
(cid:127)  Ver fotos e información de cada cabaña
(cid:127)  Enviar consultas al administrador
(cid:127)  Completar un formulario de pre-reserva
(cid:127)  Redireccionamiento a WhatsApp para coordinar y confirmar

Filtros de búsqueda

(cid:127)  Rango de precios
(cid:127)  Capacidad (cantidad de personas)
(cid:127)  Fechas disponibles
(cid:127)  Servicios incluidos (wifi, pileta, parrilla, etc.)
(cid:127)  Tipo de cabaña / habitación
(cid:127)  Promociones u ofertas activas

5.2 Panel de Administración (Backoffice)

Propósito: Control total del negocio desde un panel centralizado.

Vista principal del panel (dashboard)

(cid:127)  Ocupación actual del complejo
(cid:127)  Cabañas/propiedades disponibles
(cid:127)  Reservas activas
(cid:127)  Próximos check-ins y check-outs

Página 3

Documento de Discovery

Cabañas Ermitazh

(cid:127)  Consultas pendientes de respuesta
(cid:127)  Estado de pagos (pendientes / confirmados)
(cid:127)  Calendario visual de reservas

Gestión de reservas

(cid:127)  Visualización de reservas activas e históricas
(cid:127)  Aprobación manual antes de confirmar cada reserva
(cid:127)  Registro de datos del huésped: nombre, apellido, teléfono, cantidad de personas, fechas
(cid:127)  Historial básico de huéspedes
(cid:127)  Si no hay disponibilidad: derivación automática al huésped por WhatsApp

Gestión de precios y propiedades

(cid:127)  Configuración de precios por temporada
(cid:127)  Cálculo automático del costo de estadía a partir de precios cargados por el administrador
(cid:127)  Edición libre de: precios, promociones y disponibilidad — sin depender de un programador

Reportes e ingresos

(cid:127)  Panel con ingresos generales
(cid:127)  Reporte de ingresos diarios

Notificaciones automáticas

(cid:127)  Notificación al confirmar una reserva (al administrador y/o al huésped)

6

Flujo Principal de Reserva (Happy Path)

Pas
o

Actor

Acción

1

2

3

4

5

6

7

Huésped

Huésped

Sistema

Visita la web y consulta disponibilidad por fechas

Elige cabaña y completa el formulario de pre-reserva

Redirige al huésped a WhatsApp con datos pre-cargados

Administrador

Recibe la consulta y revisa en el panel

Administrador

Aprueba manualmente y confirma con el huésped

Administrador

Registra la reserva en el sistema

Sistema

Envía notificación de confirmación

7

Funcionalidades Fuera de Alcance (Fase 1)

Las  siguientes  funcionalidades  fueron  consultadas  y  descartadas  explícitamente  por  el  cliente  para  esta
fase:

Funcionalidad

Estado

Condición

Página 4

Documento de Discovery

Cabañas Ermitazh

Pago online desde la web

Descartado

"No por ahora"

Emisión automática de comprobantes

Descartado

"No por ahora"

Reserva
intervención

Login
/
huéspedes

100%

automática

sin

Descartado

Prefiere aprobación manual

cuentas

propias

para

Descartado

"No es necesario"

Nota: Estas funcionalidades pueden considerarse para una Fase 2, especialmente el pago online y los comprobantes
automáticos.

8

Requerimientos No Funcionales

Categoría

Requerimiento

Responsividad

Web  pública  adaptada  a  mobile;  panel  admin  principalmente  para
desktop

Autonomía del administrador

Edición de precios, disponibilidad y promociones sin programador

Escalabilidad

Soporte para nuevas propiedades sin refactorización mayor

Disponibilidad

Web pública siempre disponible; sin requisitos críticos para el panel

Seguridad

Panel de administración protegido con autenticación

9

Identidad Visual y Estilo

El cliente cuenta con logo e identidad visual definida.

Aspecto

Estilo web

Definición

Moderno y elegante. Referencia visual: Cabañas Río Soñado

Paleta de colores

Suaves y pasteles: grises, beige, rosa pastel, verde oliva pastel

Sensación a transmitir

Tranquilidad · Exclusividad · Familiar · Naturaleza

Contenido disponible

El cliente ya cuenta con fotos y descripciones completas

10

Integraciones y Canales de Contacto

(cid:127)  WhatsApp — canal principal de comunicación y confirmación de reservas
(cid:127)  Redes sociales — enlace desde la web
(cid:127)  Teléfono y email — visibles en la web

Página 5

Documento de Discovery

Cabañas Ermitazh

(cid:127)  Google Maps / mapa — ubicación del complejo integrada
(cid:127)  Plataformas externas (Airbnb, Booking) — siguen operando en paralelo; sin integración técnica en
Fase 1

11

Funcionalidades Deseadas / Backlog Futuro

Funcionalidades mencionadas por el cliente para posibles fases posteriores:

(cid:127)  Calendario de disponibilidad visual interactivo (tipo grid mensual)
(cid:127)  Módulo de opiniones / reseñas de huéspedes
(cid:127)  Recordatorios automáticos (antes del check-in, por ejemplo)
(cid:127)  Integración más profunda con WhatsApp (posiblemente vía API)
(cid:127)  Módulo de reservas con mayor automatización

12 Metodología y Comunicación

El cliente confirma disponibilidad para revisiones cortas cada 1 a 2 semanas para validar avances del
desarrollo. Se adopta un modelo de desarrollo iterativo con entregas frecuentes y validación continua.

13 Preguntas Abiertas y Próximos Pasos

Preguntas a resolver antes del diseño

(cid:127)  ¿Cuántas cabañas distintas hay? ¿Tienen nombres o numeración? ¿Qué las diferencia (capacidad,
servicios, precio)?
(cid:127)  ¿Cuál es la política de seña? ¿Qué porcentaje y en qué plazo?
(cid:127)  ¿Se registran los pagos en el sistema o solo se visualizan los montos?
(cid:127)  ¿Las reseñas/opiniones serán ingresadas manualmente o hay integración con Google/Booking?
(cid:127)  ¿La notificación de confirmación es por email, WhatsApp, o ambos?
(cid:127)  ¿Hay temporadas definidas con nombre (alta, media, baja)? ¿Con fechas fijas?

Próximos pasos sugeridos

1

2

3

4

5

Validar este documento con el cliente en la próxima reunión

Definir arquitectura técnica (stack, base de datos, hosting)

Diseñar wireframes de la web pública y el panel de administración

Priorizar funcionalidades en un backlog ordenado para Sprint 1

Acordar criterios de aceptación para la primera entrega

Documento generado a partir del cuestionario inicial de relevamiento — Cabañas Ermitazh · Mayo 2026

Página 6


