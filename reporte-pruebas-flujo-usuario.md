# Reporte de pruebas de flujo de usuario — Cabañas Ermitazh

**Fecha:** 09/11/2026  
**Entorno:** local — `http://localhost:3000`  
**Stack observado:** Next.js 16.3.1, Supabase Auth, Prisma, Tailwind CSS  
**Alcance:** visitante, huésped registrado y administrador  
**Modalidad:** pruebas black-box a través de la interfaz, con Chrome DevTools MCP  
**Evidencia:** capturas en `/tmp/opencode/capturas/` (archivos `01` a `39`)  
**Cambios en el proyecto:** ninguno. Solo se agrega este informe.

---

## 1. Resumen ejecutivo

Se ejecutaron **66 casos de prueba**: **50 OK (75,8 %)**, **13 FALLA (19,7 %)** y **3 PARCIAL (4,5 %)**.

El sitio funciona correctamente como **web pública informativa y de captación**: home, galería, fichas de cabañas, calculadora de precios, reseñas públicas, registro/login y generación de pre-reservas con envío a WhatsApp. El panel administrador permite gestionar propiedades, fotos, reseñas y bloqueos de disponibilidad, y los bloqueos se propagan correctamente al sitio público.

Sin embargo, el flujo **no constituye todavía un sistema integral de reservas**. Los puntos más graves son:

1. **No existe una pantalla de gestión de pre-reservas en el panel.** Los ítems “Reservas” y “Consultas” del menú lateral no son enlaces, y las rutas `/admin/reservas` y `/admin/consultas` devuelven 404. Las pre-reservas quedan en la base, pero el negocio no puede verlas, confirmarlas ni cancelarlas desde la aplicación.
2. **Las pre-reservas no afectan la disponibilidad.** Se pudo crear una segunda pre-reserva idéntica para la misma cabaña y las mismas fechas. El calendario administrativo solo muestra bloqueos manuales, no reservas. Esto habilita sobreventa y deja fechas “libres” aunque ya tengan pre-reservas.
3. **El header móvil no ofrece navegación ni CTA.** A 390 px se ocultan todos los enlaces y el botón “Reservar”, y no hay menú hamburguesa.
4. **La confirmación depende exclusivamente de WhatsApp.** La pre-reserva se crea en la base antes de que el usuario envíe el mensaje; si abandona WhatsApp, queda un registro sin aviso al negocio y sin confirmación en el sitio.
5. **`/preview-panel` es accesible sin autenticación** y expone la configuración de precios (tipo de dólar, temporada y botones “Aplicar”). No se presionaron los botones para no alterar la configuración, por lo que no se pudo verificar si los cambios persisten; si persisten, la severidad escala a crítica.

**Veredicto:** apto para publicación como sitio informativo con captación por WhatsApp; **no apto** para operar reservas, confirmaciones y disponibilidad sin trabajo manual y sin riesgo de superposición.

---

## 2. Metodología y alcance

- Se navegó exclusivamente por la interfaz. No se llamaron APIs ni se consultó la base de datos directamente para validar resultados.
- La base local no estaba limpia: al inicio del QA el reporte mostraba 23 reservas históricas (21 confirmadas o pendientes, 1 cancelada y 1 rechazada). Los resultados reflejan ese estado y no una base desde cero.
- Se usaron datos identificables como de prueba: nombre `Test Huésped QA`, notas “Pre-reserva automatizada de QA. Cabaña N” y una cuenta de huésped con alias `+test`.
- Los mensajes de WhatsApp **no se enviaron**. Solo se generó el enlace profundo con el texto prellenado; la entrega real no es verificable por el agente.
- Se reintentó como máximo dos veces cada paso bloqueado.
- En mobile se emuló un viewport de **390×844** con modo táctil. La herramienta de redimensionado de Chrome limita a 500 px, por eso se usó emulación de dispositivo.
- Las capturas se guardaron fuera del repositorio, en `/tmp/opencode/capturas/`.
- No se probaron acciones destructivas sobre contenido existente (borrar fotos, moderar reseñas, eliminar propiedades) para no alterar datos del proyecto.

### 2.1. Definición de estados

| Estado | Criterio |
|---|---|
| **OK** | El resultado observado coincide con el esperado. |
| **FALLA** | El resultado no cumple lo esperado o existe un defecto funcional/UX. |
| **PARCIAL** | El resultado cumple solo una parte, o queda condicionado a una decisión de producto no verificable. |

### 2.2. Criterio de severidad

| Severidad | Criterio |
|---|---|
| **Alta** | Impide operar el flujo principal, afecta integridad de datos o expone funcionalidad sensible. |
| **Media** | Genera fricción o pérdida de información relevante, con workaround manual. |
| **Baja** | Detalle de usabilidad, consistencia o documentación. |

### 2.3. Datos de prueba utilizados

| Dato | Valor |
|---|---|
| Cuenta huésped | `joaquinperaltacorbellini24+test@gmail.com` (alias de prueba) |
| Nombre en pre-reservas | `Test Huésped QA` |
| Nombre en duplicado | `Test Huésped QA Duplicado` |
| Notas | `Pre-reserva automatizada de QA. Cabaña N` |
| Cuenta administradora | Cuenta existente del proyecto; no se creó ni modificó |
| Reseña preexistente observada | “Muy buena expo chicos!!!!!” — “asd A.” (no fue creada por QA) |

---

## 3. Resultado global por fase

| Fase | Casos | OK | FALLA | PARCIAL | Resultado principal |
|---|---:|---:|---:|---:|---|
| 1. Acceso público y rutas | 6 | 5 | 1 | 0 | Rutas públicas correctas; `/preview-panel` expuesto |
| 2. Registro y autenticación | 6 | 4 | 1 | 1 | Registro/login operativos; sin verificación de email ni área de huésped |
| 3. Web pública y responsive | 12 | 11 | 1 | 0 | Contenido y calculadora correctos; header móvil sin navegación |
| 4. Pre-reservas | 14 | 10 | 4 | 0 | 8 pre-reservas creadas; sin precio previo, contacto ni control de superposición |
| 5. Panel admin e integración | 28 | 20 | 6 | 2 | Contenido y bloqueos OK; gestión de reservas inexistente |
| **Total** | **66** | **50** | **13** | **3** | **75,8 % OK** |

---

## 4. Fase 1 — Acceso público y rutas

| ID | Acción | Esperado | Obtenido | Estado | Evidencia |
|---|---|---|---|---|---|
| P1-01 | Abrir `/` como visitante sin sesión | Home completa, sin errores | Carga hero, secciones, cabañas, galería y footer | OK | `01-home-visitante.png` |
| P1-02 | Usar los enlaces del header (Inicio, Cabañas, Galería, Nuestro Complejo, Contacto) | Desplazamiento a cada sección | Los anclajes funcionan y el header permanece fijo | OK | `01-home-visitante.png` |
| P1-03 | Abrir `/pre-reserva` sin sesión | Formulario accesible sin login | Formulario visible y operable | OK | `03-pre-reserva-sin-login-habilitado.png` |
| P1-04 | Abrir `/admin` sin sesión | Redirección a login | Redirige a `/login` | OK | `02-admin-redirect-login.png` |
| P1-05 | Abrir `/admin/propiedades` sin sesión | Redirección a login | Redirige a `/login` | OK | `02-admin-redirect-login.png` |
| P1-06 | Abrir `/preview-panel` sin sesión | 404 o redirección a login | Muestra “Configuración de precios” con tipo de dólar, temporada y botones “Aplicar” | **FALLA** | `38-preview-panel-publico.png` |

**Observaciones de la fase**

- El control de acceso de `/admin` y `/admin/propiedades` funciona correctamente para visitantes.
- `/preview-panel` queda fuera de esa protección. La pantalla parece un modo de previsualización, pero es accesible por URL directa y expone controles de configuración global.
- No se presionó “Aplicar” para no modificar la cotización ni la temporada activa. Queda como ítem no verificable si esos controles escriben en la base.

---

## 5. Fase 2 — Registro y autenticación

| ID | Acción | Esperado | Obtenido | Estado | Evidencia |
|---|---|---|---|---|---|
| P2-01 | Enviar registro con campos vacíos | Validación nativa, sin crear cuenta | El navegador muestra los mensajes nativos y no envía | OK | `04-registro-validacion-nativa.png` |
| P2-02 | Registrarse con email y contraseña válidos | Cuenta creada; confirmación de email antes de operar | Crea la cuenta e inicia sesión automáticamente; no pide confirmar el correo | **PARCIAL** | `05-registro-exitoso-logueado.png` |
| P2-03 | Cerrar sesión desde el menú “Cuenta” | Sesión finalizada y header de visitante | La sesión se cierra y el header vuelve al estado público | OK | `05-registro-exitoso-logueado.png` |
| P2-04 | Iniciar sesión con credenciales válidas | Ingreso a la cuenta | Ingresa correctamente | OK | `05-registro-exitoso-logueado.png` |
| P2-05 | Iniciar sesión con contraseña incorrecta | Error claro, sin ingreso | Muestra error de credenciales y permanece en login | OK | `06-login-error-credenciales.png` |
| P2-06 | Abrir el menú “Cuenta” con sesión de huésped | Perfil, mis reservas, logout | Solo muestra “Cerrar sesión” | **FALLA** | `39-menu-cuenta-huesped.png` |

**Observaciones de la fase**

- El registro no exige verificación de email. Esto agiliza la prueba, pero permite crear cuentas con correos no verificados.
- El área de huésped es prácticamente inexistente: no hay perfil ni historial de pre-reservas. El menú “Cuenta” solo permite cerrar sesión.
- El login diferencia correctamente credenciales inválidas.
- No se probó el envío real del correo de recuperación. Solo se verificó que `/recuperar` carga.

---

## 6. Fase 3 — Web pública y responsive

| ID | Acción | Esperado | Obtenido | Estado | Evidencia |
|---|---|---|---|---|---|
| P3-01 | Recorrer la home completa | Hero, propuesta, cabañas, galería, reseñas, contacto y footer | Todo el contenido carga sin errores visibles | OK | `01-home-visitante.png` |
| P3-02 | Usar los anclajes del header | Navegación interna fluida | Los enlaces desplazan a la sección correspondiente | OK | `01-home-visitante.png` |
| P3-03 | Abrir `/galeria` | Grilla de álbumes | Galería visible con álbumes y miniaturas | OK | `07-galeria.png` |
| P3-04 | Abrir el álbum de una cabaña | Fotos del álbum | Álbum de Cabaña 1 con imágenes | OK | `08-galeria-album-cabana1.png` |
| P3-05 | Abrir y cerrar el lightbox | Ampliación, navegación y cierre | El lightbox abre, navega y cierra correctamente | OK | `08-galeria-album-cabana1.png` |
| P3-06 | Revisar las tarjetas de cabañas | Nombre, capacidad, precio y CTA | Tarjetas completas y legibles | OK | `13-mobile-cabanas-lista-390.png` |
| P3-07 | Abrir la ficha de Cabaña 1 | Detalle, fotos, descripción y CTA | Ficha completa con galería y “Pre-reservar esta cabaña” | OK | `09-precio-calculado-cabana1.png` |
| P3-08 | Calcular precio con fechas y huéspedes | Total coherente con tarifa nocturna | Total correcto para las noches seleccionadas | OK | `09-precio-calculado-cabana1.png` |
| P3-09 | Abrir `/resenas` | Reseñas públicas visibles | Listado de reseñas renderizado | OK | `10-resenas-publicas.png` |
| P3-10 | Abrir `/recuperar` por URL directa | Formulario de recuperación | Carga correctamente | OK | — |
| P3-11 | Ver home, listado y pre-reserva a 390 px | Sin overflow horizontal; contenido legible | Las tres vistas se adaptan sin scroll lateral | OK | `11b-mobile-home-viewport.png`, `12-mobile-pre-reserva-390.png`, `13-mobile-cabanas-lista-390.png` |
| P3-12 | Usar la navegación en mobile | Enlaces y CTA “Reservar” visibles o menú hamburguesa | Todos los enlaces y el CTA se ocultan; no hay hamburguesa | **FALLA** | `11b-mobile-home-viewport.png`, `13-mobile-cabanas-lista-390.png` |

**Observaciones de la fase**

- La web pública es la parte más sólida del producto: contenido, imágenes, precios y navegación desktop funcionan bien.
- En mobile el contenido se adapta, pero la única forma de navegar es scroll o URL directa. El usuario móvil no puede llegar a “Reservar” desde el header.
- La calculadora de la ficha de cabaña muestra el total antes de pre-reservar; esa misma claridad no se traslada al formulario de pre-reserva.
- `/recuperar` existe y funciona por URL directa, pero no está enlazado desde el login (ver F-09).

---

## 7. Fase 4 — Pre-reservas

| ID | Acción | Esperado | Obtenido | Estado | Evidencia |
|---|---|---|---|---|---|
| P4-01 | Abrir `/pre-reserva` y seleccionar cabaña y fechas | Calendario, disponibilidad y campos operativos | Formulario operativo; muestra noches, huéspedes, cabañas disponibles y notas | OK | `14-pre-reserva-1-formulario.png` |
| P4-02 | Indicar más huéspedes que la capacidad de la cabaña | Rechazo con mensaje claro | Bloquea el envío y muestra error de capacidad | OK | `23-validacion-capacidad-cabana6.png` |
| P4-03 | Pre-reservar Cabaña 1, 09–11/12/2026, 2 huéspedes | Crear pre-reserva y abrir WhatsApp con el detalle | Crea la pre-reserva y genera el mensaje prellenado | OK | `15-whatsapp-pre-reserva-1.png` |
| P4-04 | Pre-reservar Cabaña 2, 16–18/12/2026 | Igual al caso anterior | Crea la pre-reserva y genera el mensaje | OK | `16-whatsapp-pre-reserva-2.png` |
| P4-05 | Pre-reservar Cabaña 3, 23–25/12/2026 | Igual al caso anterior | Crea la pre-reserva y genera el mensaje | OK | `17-whatsapp-pre-reserva-3.png` |
| P4-06 | Pre-reservar Cabaña 4, 30/12/2026–01/01/2027 | Igual al caso anterior | Crea la pre-reserva y genera el mensaje | OK | `18-whatsapp-pre-reserva-4.png` |
| P4-07 | Pre-reservar Cabaña 5, 06–08/01/2027 | Igual al caso anterior | Crea la pre-reserva y genera el mensaje | OK | `19-whatsapp-pre-reserva-5.png` |
| P4-08 | Pre-reservar Cabaña 6, 13–15/01/2027 | Igual al caso anterior | Crea la pre-reserva y genera el mensaje | OK | `20-whatsapp-pre-reserva-6.png` |
| P4-09 | Pre-reservar Cabaña 7, 20–22/01/2027 | Igual al caso anterior | Crea la pre-reserva y genera el mensaje | OK | `21-whatsapp-pre-reserva-7.png` |
| P4-10 | Pre-reservar Cabaña 8, 27–29/01/2027 | Igual al caso anterior | Crea la pre-reserva y genera el mensaje | OK | `22-whatsapp-pre-reserva-8.png` |
| P4-11 | Ver el precio estimado antes de enviar | Resumen con noches, tarifa y total en el formulario | No hay total en el formulario; recién aparece dentro del mensaje de WhatsApp | **FALLA** | `14-pre-reserva-1-formulario.png`, `15-whatsapp-pre-reserva-1.png` |
| P4-12 | Capturar teléfono o email del huésped | Campo de contacto para seguimiento | Solo pide nombre y notas; no hay teléfono ni email | **FALLA** | `14-pre-reserva-1-formulario.png` |
| P4-13 | Confirmar la pre-reserva en el sitio | Pantalla de confirmación con ID y estado | Redirección inmediata a WhatsApp; no hay confirmación local | **FALLA** | `15-whatsapp-pre-reserva-1.png` a `22-whatsapp-pre-reserva-8.png` |
| P4-14 | Repetir exactamente la misma cabaña y fechas | Rechazo o advertencia de superposición | Crea una segunda pre-reserva y abre otro mensaje de WhatsApp | **FALLA** | `24-duplicado-misma-fecha-permitido.png` |

**Observaciones de la fase**

- Las 8 pre-reservas se crearon correctamente y los totales son coherentes con las tarifas nocturnas.
- El flujo es de **captación**: la pre-reserva se persiste antes de que el usuario envíe el mensaje. Si abandona WhatsApp, el negocio no recibe aviso y la fila queda sin gestión.
- El formulario no muestra el precio ni el resumen de la estadía. El usuario recién ve el valor estimado dentro del texto de WhatsApp.
- No se solicitan datos de contacto. `huespedTelefono` queda vacío y el único canal es el número de WhatsApp del negocio.
- La validación de capacidad funciona, pero no existe validación de superposición entre pre-reservas. La segunda pre-reserva idéntica fue aceptada.

### 7.1. Pre-reservas generadas

Todas las pre-reservas usan 2 huéspedes y 2 noches. El total surge de la tarifa nocturna vigente al momento de la prueba.

| # | Cabaña | Fechas | Noches | Personas | Total estimado | ID | Mensaje WhatsApp |
|---|---|---|---:|---:|---|---|---|
| 1 | Cabaña 1 | 09/12/2026 → 11/12/2026 | 2 | 2 | $ 342.100 | `cmw99uj410001dqd55kw7yyjj` | Generado, no enviado |
| 2 | Cabaña 2 | 16/12/2026 → 18/12/2026 | 2 | 2 | $ 342.100 | `cmw99v30y0003dqd5kpl9gyc9` | Generado, no enviado |
| 3 | Cabaña 3 | 23/12/2026 → 25/12/2026 | 2 | 2 | $ 279.900 | `cmw99vgmk0005dqd5tljuliyo` | Generado, no enviado |
| 4 | Cabaña 4 | 30/12/2026 → 01/01/2027 | 2 | 2 | $ 279.900 | `cmw99vwf60007dqd59hdqqmgi` | Generado, no enviado |
| 5 | Cabaña 5 | 06/01/2027 → 08/01/2027 | 2 | 2 | $ 217.700 | `cmw99w93y0009dqd5i8dnxbw3` | Generado, no enviado |
| 6 | Cabaña 6 | 13/01/2027 → 15/01/2027 | 2 | 2 | $ 217.700 | `cmw99wkdd000bdqd5mm92qqkd` | Generado, no enviado |
| 7 | Cabaña 7 | 20/01/2027 → 22/01/2027 | 2 | 2 | $ 279.900 | `cmw99wzee000ddqd541yqmpkz` | Generado, no enviado |
| 8 | Cabaña 8 | 27/01/2027 → 29/01/2027 | 2 | 2 | $ 342.100 | `cmw99xd9s000fdqd59te83lg6` | Generado, no enviado |
| 9 | Cabaña 1 (duplicado intencional) | 09/12/2026 → 11/12/2026 | 2 | 2 | $ 342.100 | `cmw99zlsm000hdqd5ap8sx41c` | Generado, no enviado |

**Total generado:** $ 2.301.400 por las 8 pre-reservas + $ 342.100 por el duplicado = **$ 2.643.500**.

**Texto del mensaje generado (resumido):**

> “Hola, quiero confirmar mi pre-reserva #`<id>` de la Cabaña N desde el DD de diciembre hasta el DD de diciembre (2 noches). Valor estimado: $ XXX.XXX, sujeto a confirmación.”

El mensaje incluye el ID, la cabaña, las fechas, la cantidad de noches y el valor estimado. No incluye teléfono ni email del huésped.

---

## 8. Fase 5 — Panel administrador e integración

| ID | Acción | Esperado | Obtenido | Estado | Evidencia |
|---|---|---|---|---|---|
| P5-01 | Iniciar sesión con cuenta administradora | Acceso al panel | Login correcto y acceso a `/admin` | OK | `25-admin-home.png` |
| P5-02 | Abrir `/admin` | Dashboard con menú lateral | Panel con bienvenida y menú | OK | `25-admin-home.png` |
| P5-03 | Abrir `/admin/propiedades` | Listado de propiedades | Listado completo con acciones | OK | `26-admin-propiedades.png` |
| P5-04 | Abrir `/admin/fotos` | Galería administrable | Galería visible | OK | `28-admin-fotos.png` |
| P5-05 | Abrir el detalle de fotos de Cabaña 1 | Fotos de la cabaña | Detalle correcto | OK | `29-admin-fotos-cabana1.png` |
| P5-06 | Abrir `/admin/resenas` | Listado de reseñas | Reseñas visibles con datos del autor | OK | `30-admin-resenas.png` |
| P5-07 | Abrir `/admin/disponibilidad` | Calendario por cabaña | Calendario operativo con leyenda | OK | `31-admin-bloqueo-cabana1-antes.png` |
| P5-08 | Abrir `/admin/reportes` con valores por defecto | Informe del año en curso, solo confirmadas | Muestra 5 reservas, 21 noches y 0,72 % de ocupación | OK | `37-admin-reportes.png` |
| P5-09 | Cambiar el filtro a “Confirmadas + pendientes” | Incluir pendientes en los agregados | Los totales suben a 21 reservas y 23 con canceladas/rechazadas | OK | `37-admin-reportes.png` (vista base; cambio verificado en pantalla) |
| P5-10 | Bloquear 09–10/12/2026 en Cabaña 1 | 2 noches bloqueadas | Mensaje “Se bloquearon 2 noches” | OK | `32-admin-bloqueo-cabana1-ok.png` |
| P5-11 | Bloquear 16–17/12/2026 en Cabaña 2 | 2 noches bloqueadas | Bloqueo correcto | OK | — |
| P5-12 | Bloquear 23–24/12/2026 en Cabaña 3 | 2 noches bloqueadas | Bloqueo correcto | OK | — |
| P5-13 | Bloquear 30–31/12/2026 en Cabaña 4 | 2 noches bloqueadas | Bloqueo correcto | OK | — |
| P5-14 | Bloquear 06–07/01/2027 en Cabaña 5 | 2 noches bloqueadas | Bloqueo correcto | OK | — |
| P5-15 | Bloquear 13–14/01/2027 en Cabaña 6 | 2 noches bloqueadas | Bloqueo correcto | OK | — |
| P5-16 | Bloquear 20–21/01/2027 en Cabaña 7 | 2 noches bloqueadas | Bloqueo correcto | OK | — |
| P5-17 | Bloquear 27–28/01/2027 en Cabaña 8 | 2 noches bloqueadas | Bloqueo correcto | OK | `36-admin-bloqueo-cabana8-enero.png` |
| P5-18 | Ver Cabaña 1 en el sitio público | 09–10/12 figuran ocupadas | Las noches bloqueadas se muestran como “Noche ocupada” | OK | `33-cabana1-fechas-bloqueadas.png`, `34-prereserva-cabana1-bloqueada.png` |
| P5-19 | Abrir `/pre-reserva?cabana=1` | Noches bloqueadas deshabilitadas | 09–10/12 no se pueden seleccionar | OK | `34-prereserva-cabana1-bloqueada.png` |
| P5-20 | Ver Cabaña 8 en el sitio público | 27–28/01 figuran ocupadas | Las noches bloqueadas se reflejan como ocupadas | OK | `36-admin-bloqueo-cabana8-enero.png` |
| P5-21 | Hacer clic en “Reservas” del menú lateral | Abrir el listado de reservas | No es un enlace; no navega | **FALLA** | `25-admin-home.png` |
| P5-22 | Hacer clic en “Consultas” del menú lateral | Abrir el listado de consultas | No es un enlace; no navega | **FALLA** | `25-admin-home.png` |
| P5-23 | Abrir `/admin/reservas` por URL directa | Listado o detalle de reservas | 404 | **FALLA** | `25-admin-home.png`, `35-propiedades-new-404.png` |
| P5-24 | Abrir `/admin/consultas` por URL directa | Listado de consultas | 404 | **FALLA** | `25-admin-home.png`, `35-propiedades-new-404.png` |
| P5-25 | Abrir `/admin/propiedades/new` o “+ Nueva propiedad” | Formulario de alta | 404 | **FALLA** | `27-admin-nueva-propiedad-404.png`, `35-propiedades-new-404.png` |
| P5-26 | Abrir `/admin` con sesión de huésped | Login o 403 | Redirección silenciosa al home | **FALLA** | Observación directa; `39-menu-cuenta-huesped.png` muestra la sesión de huésped |
| P5-27 | Buscar detalle por reserva en `/admin/reportes` | Tabla o exportación auditable | Solo KPI agregados; no hay detalle individual | **PARCIAL** | `37-admin-reportes.png` |
| P5-28 | Ver reservas en el calendario de disponibilidad | Reservas y bloqueos diferenciados | Solo se ven bloqueos manuales; las pre-reservas no aparecen | **PARCIAL** | `36-admin-bloqueo-cabana8-enero.png`, `37-admin-reportes.png` |

**Observaciones de la fase**

- El panel de contenido funciona: propiedades, fotos, reseñas y disponibilidad.
- Los bloqueos manuales se propagan correctamente al sitio público, incluida la pre-reserva por cabaña.
- El informe solo ofrece agregados. No hay forma de auditar una reserva individual, su estado o sus datos de contacto.
- Las pre-reservas existen en la base —el reporte las cuenta— pero no hay pantalla para gestionarlas. El reporte las incluye como números, no como registros accionables.
- La redirección de un huésped desde `/admin` al home es silenciosa: no explica que no tiene permisos.

---

## 9. Hallazgos ordenados por severidad

### 9.1. Severidad alta

#### F-01 — Alta — No existe gestión de pre-reservas en el panel

**Reproducción:**

1. Iniciar sesión como administrador.
2. Observar el menú lateral: “Reservas” y “Consultas” aparecen como texto, sin ícono ni comportamiento de enlace.
3. Hacer clic en “Reservas” o “Consultas”: no ocurre nada.
4. Navegar a `/admin/reservas` o `/admin/consultas`: se obtiene 404.
5. Abrir `/admin/reportes`: solo hay KPI agregados, sin listado ni detalle por reserva.

**Esperado:** un listado de pre-reservas con datos del huésped, cabaña, fechas, estado y acciones para confirmar, cancelar o contactar.  
**Obtenido:** las pre-reservas se crean y se cuentan en reportes, pero no se pueden ver ni gestionar desde la aplicación.  
**Impacto:** el negocio depende de la base de datos o de WhatsApp para operar; no puede confirmar ni cancelar desde el panel.  
**Evidencia:** `25-admin-home.png`, `35-propiedades-new-404.png`, `37-admin-reportes.png`.

#### F-02 — Alta — Las pre-reservas no bloquean la disponibilidad y permiten superposición

**Reproducción:**

1. Crear una pre-reserva para Cabaña 1 del 09/12/2026 al 11/12/2026.
2. Volver a `/pre-reserva` y cargar exactamente la misma cabaña, fechas y huéspedes.
3. Enviar el formulario.
4. Revisar el calendario de `/admin/disponibilidad` y el sitio público.

**Esperado:** rechazo o advertencia por superposición; las noches reservadas deberían figurar como ocupadas.  
**Obtenido:** la segunda pre-reserva se crea y genera otro mensaje de WhatsApp. El calendario solo muestra bloqueos manuales; las pre-reservas no se reflejan.  
**Impacto:** riesgo directo de sobreventa y de prometer disponibilidad que ya tiene una pre-reserva.  
**Evidencia:** `24-duplicado-misma-fecha-permitido.png`, `33-cabana1-fechas-bloqueadas.png`, `36-admin-bloqueo-cabana8-enero.png`, `37-admin-reportes.png`.

#### F-03 — Alta — El header móvil no ofrece navegación ni CTA

**Reproducción:**

1. Emular un viewport de 390×844 con modo táctil.
2. Abrir la home.
3. Observar el header.
4. Repetir en el listado de cabañas.

**Esperado:** enlaces visibles o menú hamburguesa, y CTA “Reservar” accesible.  
**Obtenido:** se ocultan todos los enlaces y el botón “Reservar”; no hay hamburguesa ni menú alternativo.  
**Impacto:** el usuario móvil no puede navegar a secciones ni iniciar una reserva desde el header.  
**Evidencia:** `11b-mobile-home-viewport.png`, `13-mobile-cabanas-lista-390.png`.

### 9.2. Severidad media

#### F-04 — Media — `/preview-panel` es público y expone configuración de precios

**Reproducción:**

1. Cerrar sesión o abrir una ventana sin sesión.
2. Navegar a `/preview-panel`.
3. Observar la pantalla “Configuración de precios”.

**Esperado:** 404, redirección a login o acceso restringido a administradores.  
**Obtenido:** la pantalla muestra tipo de dólar, temporada activa y botones “Aplicar” sin autenticación.  
**Impacto:** expone configuración interna; si los botones persisten cambios, un visitante podría alterar precios globales. No se presionaron para no modificar datos, por lo que la persistencia queda sin verificar.  
**Evidencia:** `38-preview-panel-publico.png`.

#### F-05 — Media — “+ Nueva propiedad” lleva a una ruta 404

**Reproducción:**

1. Iniciar sesión como administrador.
2. Abrir `/admin/propiedades`.
3. Hacer clic en “+ Nueva propiedad” o navegar a `/admin/propiedades/new`.

**Esperado:** formulario de alta de propiedad.  
**Obtenido:** 404 “This page could not be found”.  
**Impacto:** la acción principal del listado está rota; no se pueden crear propiedades desde la UI.  
**Evidencia:** `27-admin-nueva-propiedad-404.png`, `35-propiedades-new-404.png`.

#### F-06 — Media — No se muestra el precio antes de enviar la pre-reserva

**Reproducción:**

1. Abrir `/pre-reserva`.
2. Seleccionar cabaña, fechas y huéspedes.
3. Completar nombre y notas.
4. Observar el formulario antes de enviar.

**Esperado:** resumen con noches, tarifa nocturna y total estimado.  
**Obtenido:** el formulario no muestra ningún total; el valor aparece recién en el mensaje de WhatsApp.  
**Impacto:** el usuario no puede validar el costo antes de iniciar el contacto; aumenta el abandono y las consultas por precio.  
**Evidencia:** `14-pre-reserva-1-formulario.png`, `15-whatsapp-pre-reserva-1.png`.

#### F-07 — Media — El huésped no tiene estado ni historial de su pre-reserva

**Reproducción:**

1. Iniciar sesión con la cuenta de huésped.
2. Abrir el menú “Cuenta”.

**Esperado:** acceso a perfil y a “Mis reservas” con estado.  
**Obtenido:** solo existe “Cerrar sesión”.  
**Impacto:** el huésped no puede consultar si su pre-reserva fue recibida, confirmada o cancelada.  
**Evidencia:** `39-menu-cuenta-huesped.png`.

#### F-08 — Media — La confirmación es solo por WhatsApp y depende de una acción manual

**Reproducción:**

1. Completar una pre-reserva.
2. Enviar el formulario.
3. Observar la redirección a `api.whatsapp.com`.
4. Cerrar WhatsApp sin enviar el mensaje.

**Esperado:** confirmación en el sitio con ID y estado, y un canal alternativo (email o aviso interno).  
**Obtenido:** la pre-reserva ya se creó en la base, pero el sitio redirige a WhatsApp sin confirmación local; si el usuario no envía el mensaje, el negocio no recibe aviso.  
**Impacto:** pérdida de leads y reservas “fantasma” que solo se descubren consultando la base.  
**Evidencia:** `15-whatsapp-pre-reserva-1.png` a `22-whatsapp-pre-reserva-8.png`.

### 9.3. Severidad baja

#### F-09 — Baja — `/recuperar` no está enlazado desde el login

**Reproducción:**

1. Abrir `/login`.
2. Buscar un enlace de “Olvidé mi contraseña” o similar.
3. Navegar manualmente a `/recuperar`.

**Esperado:** enlace visible en el formulario de login.  
**Obtenido:** no hay enlace; la pantalla solo es accesible por URL directa.  
**Impacto:** el usuario que olvida su contraseña no descubre cómo recuperarla.  
**Evidencia:** `06-login-error-credenciales.png`.

#### F-10 — Baja — Reseña con datos de prueba publicada en el sitio

**Reproducción:**

1. Abrir `/resenas`.
2. Observar la reseña “Muy buena expo chicos!!!!!” de “asd A.”.

**Esperado:** reseñas reales y moderadas, sin datos de prueba visibles.  
**Obtenido:** la reseña está publicada y visible para visitantes, con apariencia de dato de prueba. Es preexistente; no fue creada por QA.  
**Impacto:** afecta la credibilidad del sitio.  
**Evidencia:** `10-resenas-publicas.png`.

#### F-11 — Baja — El acceso de huésped a `/admin` redirige al home sin explicación

**Reproducción:**

1. Iniciar sesión con la cuenta de huésped.
2. Navegar a `/admin`.

**Esperado:** redirección a login o página 403 con mensaje.  
**Obtenido:** redirección silenciosa al home.  
**Impacto:** el usuario no entiende por qué no puede acceder; dificulta el soporte.  
**Evidencia:** `39-menu-cuenta-huesped.png` (observación directa de la redirección).

#### F-12 — Baja — El informe de reportes no permite auditar reservas individuales

**Reproducción:**

1. Abrir `/admin/reportes`.
2. Aplicar el período y el filtro “Confirmadas + pendientes”.
3. Buscar una tabla o exportación con las reservas.

**Esperado:** detalle por reserva para auditar ocupación e ingresos.  
**Obtenido:** solo KPI agregados (noches ocupadas, reservas, ocupación, estadía promedio, personas promedio, canceladas/rechazadas).  
**Impacto:** no se puede conciliar el número agregado con reservas concretas.  
**Evidencia:** `37-admin-reportes.png`.

---

## 10. Ítems no verificables

| Ítem | Motivo | Qué se verificó |
|---|---|---|
| Entrega real del mensaje de WhatsApp | El agente no puede enviar ni recibir WhatsApp | Se generó el deep link con texto prellenado (capturas 15–22) |
| Recepción y respuesta del negocio | Depende de una persona y de la app externa | No verificable |
| Confirmación por email | El flujo no solicita email al huésped ni muestra envío | Solo se observó que no existe canal email |
| Recuperación de contraseña | No se envió el formulario para no generar correos | `/recuperar` carga correctamente |
| Persistencia de “Aplicar” en `/preview-panel` | No se presionó para no alterar precios/temporada | Se observó que la pantalla es pública |
| Carga y borrado de fotos en Supabase Storage | Acción destructiva/administrativa | Se verificó listado y detalle de fotos |
| Moderación de reseñas | Acción destructiva | Se verificó el listado de reseñas |
| Cambio de estado de una reserva | No existe UI | No hay flujo para probarlo |
| Pagos o señas | No forman parte del flujo actual | No aplica |
| Rendimiento y seguridad en producción | Prueba local | Solo se verificaron redirects básicos |
| Concurrencia real de usuarios | Prueba secuencial de una sola sesión | Se probó duplicado secuencial, no concurrencia |
| Eliminación de pre-reservas | No existe UI de borrado | Se documentan IDs para limpieza por base |

---

## 11. Recomendaciones

### 11.1. Antes de considerar el sistema “operativo”

| Prioridad | Acción | Hallazgo |
|---|---|---|
| 1 | Implementar listado, detalle y estados de pre-reservas en `/admin/reservas`, con acciones confirmar/cancelar/rechazar y datos de contacto. | F-01 |
| 2 | Unificar disponibilidad: las pre-reservas deben ocupar noches o, como mínimo, generar alertas de conflicto. Mostrar reservas y bloqueos en el mismo calendario con leyenda. | F-02 |
| 3 | Resolver la navegación móvil: hamburguesa con todos los enlaces y CTA “Reservar” visible. | F-03 |
| 4 | Proteger `/preview-panel` con autenticación de administrador o eliminarlo del build de producción. | F-04 |
| 5 | Mostrar un resumen de precio (noches × tarifa + total) antes de enviar la pre-reserva. | F-06 |
| 6 | Capturar teléfono o email y agregar confirmación en el sitio con ID y estado; mantener WhatsApp como canal opcional. | F-08 |

### 11.2. Corto plazo

| Acción | Hallazgo |
|---|---|
| Corregir o eliminar el botón “+ Nueva propiedad” si el alta no está implementada. | F-05 |
| Agregar “Mis reservas” al área de huésped. | F-07 |
| Agregar enlace “Olvidé mi contraseña” en el login. | F-09 |
| Reemplazar la redirección silenciosa de huésped en `/admin` por un 403 o login con mensaje. | F-11 |
| Agregar detalle/exportación de reservas al informe. | F-12 |
| Limpiar reseñas y datos de prueba del entorno productivo. | F-10 |

### 11.3. Calidad y prevención

- Agregar pruebas E2E de los flujos críticos: registro, login, pre-reserva, duplicado, bloqueo y propagación pública.
- Incluir una prueba específica de superposición de fechas y otra de navegación mobile.
- Definir una política de estados: `pendiente`, `confirmada`, `cancelada`, `rechazada`, y reflejarla tanto en admin como en el área del huésped.
- Si la pre-reserva no bloquea por decisión de producto, el panel debe mostrar los conflictos y permitir resolverlos; hoy no hay ninguna de las dos cosas.
- Completar el `README.md`: actualmente solo contiene el título y no documenta instalación, variables, migraciones ni flujo de negocio.
- Estandarizar la página 404 en español, con navegación de vuelta al sitio.

---

## 12. Anexo de limpieza

Las pruebas dejaron datos en la base local. **No se eliminaron** porque el panel no ofrece borrado de pre-reservas y no se quiso alterar el entorno sin autorización.

### 12.1. Pre-reservas

| # | ID | Cabaña | Fechas | Acción sugerida |
|---|---|---|---|---|
| 1 | `cmw99uj410001dqd55kw7yyjj` | Cabaña 1 | 09–11/12/2026 | Eliminar por base o Prisma Studio |
| 2 | `cmw99v30y0003dqd5kpl9gyc9` | Cabaña 2 | 16–18/12/2026 | Eliminar por base o Prisma Studio |
| 3 | `cmw99vgmk0005dqd5tljuliyo` | Cabaña 3 | 23–25/12/2026 | Eliminar por base o Prisma Studio |
| 4 | `cmw99vwf60007dqd59hdqqmgi` | Cabaña 4 | 30/12/2026–01/01/2027 | Eliminar por base o Prisma Studio |
| 5 | `cmw99w93y0009dqd5i8dnxbw3` | Cabaña 5 | 06–08/01/2027 | Eliminar por base o Prisma Studio |
| 6 | `cmw99wkdd000bdqd5mm92qqkd` | Cabaña 6 | 13–15/01/2027 | Eliminar por base o Prisma Studio |
| 7 | `cmw99wzee000ddqd541yqmpkz` | Cabaña 7 | 20–22/01/2027 | Eliminar por base o Prisma Studio |
| 8 | `cmw99xd9s000fdqd59te83lg6` | Cabaña 8 | 27–29/01/2027 | Eliminar por base o Prisma Studio |
| 9 | `cmw99zlsm000hdqd5ap8sx41c` | Cabaña 1 (duplicado) | 09–11/12/2026 | Eliminar por base o Prisma Studio |

Todas están identificadas con `huespedNombre` `Test Huésped QA` o `Test Huésped QA Duplicado`. Se pueden localizar con Prisma Studio (`npx prisma studio`) o con una consulta autorizada sobre `Reserva`. **No usar `prisma migrate reset` ni `db push` para limpiar.**

### 12.2. Bloqueos manuales

Se crearon 8 bloqueos de 2 noches cada uno:

| Cabaña | Noches bloqueadas |
|---|---|
| Cabaña 1 | 09 y 10/12/2026 |
| Cabaña 2 | 16 y 17/12/2026 |
| Cabaña 3 | 23 y 24/12/2026 |
| Cabaña 4 | 30 y 31/12/2026 |
| Cabaña 5 | 06 y 07/01/2027 |
| Cabaña 6 | 13 y 14/01/2027 |
| Cabaña 7 | 20 y 21/01/2027 |
| Cabaña 8 | 27 y 28/01/2027 |

Se pueden liberar desde `/admin/disponibilidad` seleccionando las noches y usando la acción de liberar, o por base si el panel no lo permite.

### 12.3. Otros restos de la prueba

| Elemento | Detalle | Limpieza |
|---|---|---|
| Cuenta de huésped | `joaquinperaltacorbellini24+test@gmail.com` | Eliminar desde Supabase Auth si se desea |
| Capturas | `/tmp/opencode/capturas/` (01–39) | Fuera del repo; se pueden borrar |
| Log del servidor | `/tmp/opencode/ermitazh-dev.log` | Fuera del repo |
| Servidor de desarrollo | `next dev` en ejecución (PID 10217/10228 al cierre) | Detener con Ctrl+C o `pkill -f "next dev"` |
| Reseña “Muy buena expo chicos!!!!!” | Preexistente; no creada por QA | Revisar si corresponde a datos de prueba |
| `lib/config.ts` | Modificación preexistente, no tocada por QA | No incluir en el commit de este informe |
| `AGENTS.md` | Bloque autogenerado por `next dev` restaurado | Verificar que no vuelva a aparecer antes de commitear |

### 12.4. Estado de Git al cierre

- No se realizaron commits.
- No se modificó código de la aplicación.
- El único cambio preexistente es `M lib/config.ts`; debe permanecer fuera de este trabajo.
- Este informe es el único archivo nuevo agregado por la tarea.

---

## 13. Conclusión

El producto cumple bien la función de **escaparate y captación**: el visitante puede conocer las cabañas, calcular un precio y generar una pre-reserva con un mensaje de WhatsApp. El panel administrador también resuelve contenido, fotos, reseñas y bloqueos de disponibilidad.

Para pasar a ser un **sistema de gestión de reservas** falta lo esencial: ver y gestionar las pre-reservas, hacer que ocupen disponibilidad, confirmar al huésped y darle seguimiento. Mientras eso no exista, el negocio sigue operando “por fuera” de la aplicación y la base acumula registros que nadie administra.

Las tres correcciones de mayor impacto son: **gestión de pre-reservas en el admin**, **disponibilidad unificada con control de superposición** y **navegación móvil**. Después de esas, el resto de los hallazgos son mejoras acotadas de UX y consistencia.
