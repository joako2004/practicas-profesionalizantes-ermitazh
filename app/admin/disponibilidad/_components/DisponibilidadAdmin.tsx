"use client";

/**
 * DisponibilidadAdmin — pantalla interactiva del calendario de disponibilidad.
 *
 * Qué hace: permite elegir una cabaña, marcar un día o un rango inclusivo en el
 * calendario y bloquear o liberar esas noches. El calendario es tonto: acá se
 * decide qué día está ocupado, cuál ya pasó y cuál forma parte de la selección.
 *
 * Layout (D5c-3): columna única alineada a la izquierda. La primera tarjeta
 * tiene el selector de cabaña, el calendario en tamaño "grande" y la leyenda de
 * estados; la segunda, debajo, tiene el resultado de la acción, el resumen de
 * la selección y los botones. Todo el texto vive dentro de una tarjeta clara
 * para que se lea sobre la foto de fondo del panel.
 *
 * Las escrituras pasan SOLO por las server actions bloquearNoches y
 * liberarNoches: este componente nunca toca la base ni Prisma. "Hoy" llega como
 * clave "AAAA-MM-DD" desde el servidor, así que no se calcula ninguna fecha en
 * el navegador. Después de escribir se llama a router.refresh() para volver a
 * leer las noches bloqueadas y que la selección quede limpia.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarioMes,
  LeyendaCalendario,
} from "@/components/calendario/CalendarioMes";
import { bloquearNoches, liberarNoches } from "@/lib/actions/disponibilidad";
import { mesDeClave } from "@/lib/disponibilidad/grilla";
import { aTextoFecha, deClaveFecha } from "@/lib/disponibilidad/noches";
import { NOCHES_MAX_POR_ACCION } from "@/lib/disponibilidad/rangos-admin";
import {
  SELECCION_VACIA,
  elegirDiaRango,
  marcaDeDia,
  rangoDeSeleccion,
  resumirSeleccion,
  type SeleccionRango,
} from "@/lib/disponibilidad/seleccion-admin";

type CabanaAdmin = {
  id: string;
  nombre: string;
  bloqueadas: string[];
};

type VentanaDisponibilidad = {
  desde: string;
  hasta: string;
};

type Props = {
  cabanas: CabanaAdmin[];
  ventana: VentanaDisponibilidad;
  hoy: string;
};

type Mensaje = {
  tipo: "ok" | "error";
  texto: string;
};

/** Convierte una clave interna a texto visible "DD/MM/AAAA". */
function textoDeClave(clave: string): string {
  const fecha = deClaveFecha(clave);
  if (fecha === null) {
    return "fecha inválida";
  }
  return aTextoFecha(fecha);
}

/** Texto de éxito al bloquear, con singular y plural correctos. */
function mensajeDeBloqueo(cantidad: number): string {
  if (cantidad === 0) {
    return "No había noches nuevas para bloquear.";
  }
  if (cantidad === 1) {
    return "Se bloqueó 1 noche.";
  }
  return `Se bloquearon ${cantidad} noches.`;
}

/** Texto de éxito al liberar, con singular y plural correctos. */
function mensajeDeLiberacion(cantidad: number): string {
  if (cantidad === 0) {
    return "No había noches bloqueadas para liberar.";
  }
  if (cantidad === 1) {
    return "Se liberó 1 noche.";
  }
  return `Se liberaron ${cantidad} noches.`;
}

/** Devuelve "noche" o "noches" según la cantidad. */
function textoNoches(cantidad: number): string {
  return cantidad === 1 ? "noche" : "noches";
}

/** Devuelve "bloqueada" o "bloqueadas" según la cantidad. */
function textoBloqueadas(cantidad: number): string {
  return cantidad === 1 ? "bloqueada" : "bloqueadas";
}

/** Devuelve "libre" o "libres" según la cantidad. */
function textoLibres(cantidad: number): string {
  return cantidad === 1 ? "libre" : "libres";
}

/** Clases completas de los botones, con el foco visible del proyecto. */
const CLASES_BOTON_BASE = [
  "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] px-4 py-2.5",
  "text-sm font-medium transition-colors sm:w-auto",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
  "disabled:cursor-not-allowed disabled:opacity-40",
].join(" ");

const CLASES_BOTON_PRIMARIO = [
  CLASES_BOTON_BASE,
  "bg-[var(--color-accent)] text-white hover:brightness-95",
].join(" ");

const CLASES_BOTON_SECUNDARIO = [
  CLASES_BOTON_BASE,
  "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)]",
  "hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-warm)]/30",
].join(" ");

const CLASES_BOTON_TERCIARIO = [
  CLASES_BOTON_BASE,
  "border border-transparent text-[var(--color-ink)]/75 underline-offset-4",
  "hover:text-[var(--color-ink)] hover:underline",
].join(" ");

/** Clases de las píldoras del resumen: sobrias y con el texto completo. */
const CLASES_PILDORA_BASE =
  "inline-flex items-center rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium";

const CLASES_PILDORA_NOCHES = [
  CLASES_PILDORA_BASE,
  "border-[var(--color-border)] bg-[var(--color-warm)]/25 text-[var(--color-ink)]",
].join(" ");

const CLASES_PILDORA_BLOQUEADAS = [
  CLASES_PILDORA_BASE,
  "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
].join(" ");

const CLASES_PILDORA_LIBRES = [
  CLASES_PILDORA_BASE,
  "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-ink)]",
].join(" ");

export default function DisponibilidadAdmin({
  cabanas,
  ventana,
  hoy,
}: Props) {
  const router = useRouter();
  const [propiedadId, setPropiedadId] = useState<string>(cabanas[0].id);
  const [seleccion, setSeleccion] = useState<SeleccionRango>(SELECCION_VACIA);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [guardando, iniciar] = useTransition();

  const cabanaActual =
    cabanas.find((cabana) => cabana.id === propiedadId) ?? cabanas[0];
  const bloqueadasSet = useMemo(
    () => new Set(cabanaActual.bloqueadas),
    [cabanaActual.bloqueadas],
  );

  const resumen = resumirSeleccion(seleccion, bloqueadasSet);
  const mesInicial = mesDeClave(hoy) ?? mesDeClave(ventana.desde);

  const puedeBloquear =
    resumen !== null &&
    !resumen.excedeMaximo &&
    !guardando &&
    resumen.libres > 0;
  const puedeLiberar =
    resumen !== null &&
    !resumen.excedeMaximo &&
    !guardando &&
    resumen.yaBloqueadas > 0;
  const puedeLimpiar = seleccion.inicio !== null && !guardando;

  // Solo para las etiquetas de los botones: un rango que excede el máximo no
  // muestra cantidades porque la acción está deshabilitada.
  const resumenParaAcciones =
    resumen !== null && !resumen.excedeMaximo ? resumen : null;

  const etiquetaBloquear =
    resumenParaAcciones === null
      ? "Bloquear noches"
      : `Bloquear ${resumenParaAcciones.libres} ${textoNoches(resumenParaAcciones.libres)}`;
  const etiquetaLiberar =
    resumenParaAcciones === null
      ? "Liberar noches"
      : `Liberar ${resumenParaAcciones.yaBloqueadas} ${textoNoches(resumenParaAcciones.yaBloqueadas)}`;

  function infoDia(clave: string) {
    return {
      ocupado: bloqueadasSet.has(clave),
      deshabilitado: clave < hoy,
      seleccion: marcaDeDia(seleccion, clave),
    };
  }

  function elegirDia(clave: string): void {
    setSeleccion((actual) => elegirDiaRango(actual, clave));
    setMensaje(null);
  }

  function cambiarCabana(id: string): void {
    setPropiedadId(id);
    setSeleccion(SELECCION_VACIA);
    setMensaje(null);
  }

  function limpiarSeleccion(): void {
    setSeleccion(SELECCION_VACIA);
    setMensaje(null);
  }

  function ejecutarAccion(accion: "bloquear" | "liberar"): void {
    const rango = rangoDeSeleccion(seleccion);
    if (rango === null) {
      return;
    }

    iniciar(async () => {
      try {
        const resultado =
          accion === "bloquear"
            ? await bloquearNoches(propiedadId, rango.desde, rango.hasta)
            : await liberarNoches(propiedadId, rango.desde, rango.hasta);

        if (resultado.success) {
          setMensaje({
            tipo: "ok",
            texto:
              accion === "bloquear"
                ? mensajeDeBloqueo(resultado.cantidad)
                : mensajeDeLiberacion(resultado.cantidad),
          });
          setSeleccion(SELECCION_VACIA);
          router.refresh();
        } else {
          setMensaje({ tipo: "error", texto: resultado.error });
        }
      } catch {
        setMensaje({
          tipo: "error",
          texto: "No se pudo guardar el cambio. Probá de nuevo.",
        });
      }
    });
  }

  return (
    <div className="w-full max-w-3xl space-y-4">
      {/* Tarjeta 1: cabaña, calendario grande y leyenda. */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
        <div className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <label
            htmlFor="cabana-disponibilidad"
            className="text-sm font-medium text-[var(--color-ink)]"
          >
            Cabaña
          </label>
          <select
            id="cabana-disponibilidad"
            value={propiedadId}
            onChange={(evento) => cambiarCabana(evento.target.value)}
            disabled={guardando}
            className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-72"
          >
            {cabanas.map((cabana) => (
              <option key={cabana.id} value={cabana.id}>
                {cabana.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          {mesInicial === null ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-4 text-sm text-[var(--color-danger)]">
              No se pudo armar el calendario con la ventana disponible.
            </div>
          ) : (
            <CalendarioMes
              tamano="grande"
              mesInicial={mesInicial}
              desde={ventana.desde}
              hasta={ventana.hasta}
              hoy={hoy}
              infoDia={infoDia}
              onElegirDia={elegirDia}
            />
          )}
        </div>

        <div className="mt-4 border-t border-[var(--color-border)] pt-4">
          <LeyendaCalendario />
        </div>
      </section>

      {/* Tarjeta 2: resultado, resumen de la selección y acciones. */}
      <section
        aria-label="Resumen y acciones"
        aria-busy={guardando}
        className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6"
      >
        <div className="space-y-4">
          {mensaje !== null && (
            <div
              role={mensaje.tipo === "ok" ? "status" : "alert"}
              aria-live={mensaje.tipo === "ok" ? "polite" : "assertive"}
              className={
                mensaje.tipo === "ok"
                  ? "flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-3 text-sm text-[var(--color-ink)]"
                  : "flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]"
              }
            >
              {mensaje.tipo === "ok" ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8.5 12.5 2.5 2.5 4.5-5" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 h-4 w-4 shrink-0"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4.5" />
                  <path d="M12 16h.01" />
                </svg>
              )}
              <p className="min-w-0">
                <strong className="font-semibold">
                  {mensaje.tipo === "ok" ? "Listo:" : "Error:"}
                </strong>{" "}
                {mensaje.texto}
              </p>
            </div>
          )}

          {resumen === null ? (
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M8 3v4" />
                <path d="M16 3v4" />
                <path d="M3 10h18" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  Elegí un día o un rango en el calendario
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink)]/70">
                  Primer clic: desde cuándo. Segundo clic: hasta cuándo. Los dos
                  días se incluyen.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xl font-semibold text-[var(--color-ink)]">
                {resumen.desde === resumen.hasta
                  ? `Noche del ${textoDeClave(resumen.desde)}`
                  : `Del ${textoDeClave(resumen.desde)} al ${textoDeClave(resumen.hasta)}`}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={CLASES_PILDORA_NOCHES}>
                  {`${resumen.noches} ${textoNoches(resumen.noches)}`}
                </span>
                <span className={CLASES_PILDORA_BLOQUEADAS}>
                  {`${resumen.yaBloqueadas} ya ${textoBloqueadas(resumen.yaBloqueadas)}`}
                </span>
                <span className={CLASES_PILDORA_LIBRES}>
                  {`${resumen.libres} ${textoLibres(resumen.libres)}`}
                </span>
              </div>

              {resumen.excedeMaximo && (
                <div className="mt-3 flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-sm text-[var(--color-ink)]">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink)]/70"
                  >
                    <path d="M12 4 3 20h18L12 4Z" />
                    <path d="M12 10v4" />
                    <path d="M12 17h.01" />
                  </svg>
                  <p className="min-w-0">
                    {`Podés marcar hasta ${NOCHES_MAX_POR_ACCION} noches por vez. Acortá el rango.`}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => ejecutarAccion("bloquear")}
              disabled={!puedeBloquear}
              className={CLASES_BOTON_PRIMARIO}
            >
              {etiquetaBloquear}
            </button>
            <button
              type="button"
              onClick={() => ejecutarAccion("liberar")}
              disabled={!puedeLiberar}
              className={CLASES_BOTON_SECUNDARIO}
            >
              {etiquetaLiberar}
            </button>
            <button
              type="button"
              onClick={limpiarSeleccion}
              disabled={!puedeLimpiar}
              className={CLASES_BOTON_TERCIARIO}
            >
              Limpiar selección
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
