"use client";

/**
 * DisponibilidadAdmin — pantalla interactiva del calendario de disponibilidad.
 *
 * Qué hace: permite elegir una cabaña, marcar un día o un rango inclusivo en el
 * calendario y bloquear o liberar esas noches. El calendario es tonto: acá se
 * decide qué día está ocupado, cuál ya pasó y cuál forma parte de la selección.
 *
 * Las escrituras pasan SOLO por las server actions bloquearNoches y
 * liberarNoches: este componente nunca toca la base ni Prisma. "Hoy" llega como
 * clave "AAAA-MM-DD" desde el servidor, así que no se calcula ninguna fecha en
 * el navegador. Después de escribir se llama a router.refresh() para volver a
 * leer las noches bloqueadas y que la selección quede limpia.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarioMes } from "@/components/calendario/CalendarioMes";
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
  "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90",
].join(" ");

const CLASES_BOTON_SECUNDARIO = [
  CLASES_BOTON_BASE,
  "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)]",
  "hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-warm)]/30",
].join(" ");

const CLASES_BOTON_TERCIARIO = [
  CLASES_BOTON_BASE,
  "border border-transparent text-[var(--color-ink)]/75",
  "hover:bg-[var(--color-warm)]/30 hover:text-[var(--color-ink)]",
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
    <div className="space-y-6">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
        <label
          htmlFor="cabana-disponibilidad"
          className="mb-2 block text-sm font-medium text-[var(--color-ink)]"
        >
          Cabaña
        </label>
        <select
          id="cabana-disponibilidad"
          value={propiedadId}
          onChange={(evento) => cambiarCabana(evento.target.value)}
          disabled={guardando}
          className="min-h-11 w-full max-w-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {cabanas.map((cabana) => (
            <option key={cabana.id} value={cabana.id}>
              {cabana.nombre}
            </option>
          ))}
        </select>
      </section>

      {mensaje !== null && (
        <div
          role={mensaje.tipo === "ok" ? "status" : "alert"}
          aria-live={mensaje.tipo === "ok" ? "polite" : "assertive"}
          className={
            mensaje.tipo === "ok"
              ? "rounded-[var(--radius-md)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-3 text-sm text-[var(--color-ink)]"
              : "rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]"
          }
        >
          <strong className="font-semibold">
            {mensaje.tipo === "ok" ? "Listo:" : "Error:"}
          </strong>{" "}
          {mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className="w-full max-w-md space-y-3">
          {mesInicial === null ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-4 text-sm text-[var(--color-danger)]">
              No se pudo armar el calendario con la ventana disponible.
            </div>
          ) : (
            <CalendarioMes
              mesInicial={mesInicial}
              desde={ventana.desde}
              hasta={ventana.hasta}
              hoy={hoy}
              infoDia={infoDia}
              onElegirDia={elegirDia}
            />
          )}
          <p className="text-sm text-[var(--color-ink)]/70">
            Los días tachados están bloqueados. Los días apagados ya pasaron.
          </p>
        </div>

        <section
          aria-labelledby="resumen-seleccion"
          aria-busy={guardando}
          className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6"
        >
          <h3
            id="resumen-seleccion"
            className="text-base font-semibold text-[var(--color-ink)]"
          >
            Resumen de la selección
          </h3>

          {resumen === null ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]/70">
              Elegí un día o un rango en el calendario. Primer clic: desde
              cuándo; segundo clic: hasta cuándo (los dos días se incluyen).
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-base font-medium text-[var(--color-ink)]">
                {resumen.desde === resumen.hasta
                  ? `Noche del ${textoDeClave(resumen.desde)}`
                  : `Del ${textoDeClave(resumen.desde)} al ${textoDeClave(resumen.hasta)}`}
              </p>
              <p className="text-sm text-[var(--color-ink)]/70">
                {`${resumen.noches} ${textoNoches(resumen.noches)} (${resumen.yaBloqueadas} ya ${textoBloqueadas(resumen.yaBloqueadas)}, ${resumen.libres} ${textoLibres(resumen.libres)})`}
              </p>
              {resumen.excedeMaximo && (
                <p className="rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-sm text-[var(--color-ink)]">
                  Podés marcar hasta {NOCHES_MAX_POR_ACCION} noches por vez.
                  Acortá el rango.
                </p>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => ejecutarAccion("bloquear")}
              disabled={!puedeBloquear}
              className={CLASES_BOTON_PRIMARIO}
            >
              Bloquear noches
            </button>
            <button
              type="button"
              onClick={() => ejecutarAccion("liberar")}
              disabled={!puedeLiberar}
              className={CLASES_BOTON_SECUNDARIO}
            >
              Liberar noches
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
        </section>
      </div>
    </div>
  );
}
