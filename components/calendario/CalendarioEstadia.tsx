"use client";

/**
 * CalendarioEstadia — calendario público para elegir llegada y salida.
 *
 * Es un componente CONTROLADO: la selección vive en el padre. Acá se normaliza
 * contra el contexto vigente y, si quedó inválida (por ejemplo porque cambió la
 * disponibilidad), se avisa al padre para que la sincronice.
 *
 * Seguridad ante fallos: si la consulta no está lista o los datos no permiten
 * armar el contexto, no se dibuja ningún calendario. Un error siempre se ve con
 * un mensaje; el error de consulta además ofrece "Reintentar".
 *
 * "Hoy" y la ventana salen de los datos del servidor (`ctx.desde` / `ctx.hasta`),
 * nunca de la hora del navegador.
 */

import { useEffect } from "react";

import {
  CalendarioMes,
  LeyendaCalendario,
  type TamanoCalendario,
} from "@/components/calendario/CalendarioMes";
import type { EstadoDisponibilidad } from "@/components/calendario/useDisponibilidad";
import { mesDeClave, type AnioMes } from "@/lib/disponibilidad/grilla";
import { aTextoFecha, deClaveFecha } from "@/lib/disponibilidad/noches";
import {
  contextoCabanaUnica,
  contextoGeneral,
} from "@/lib/disponibilidad/respuesta-api";
import {
  AYUDA_SALIDA_OCUPADA,
  ESTADIA_VACIA,
  elegirDiaEstadia,
  infoDiaEstadia,
  normalizarSeleccion,
  resumirEstadia,
  salidaOcupadaDisponible,
  type ContextoEstadia,
  type SeleccionEstadia,
} from "@/lib/disponibilidad/seleccion-estadia";

/** Props del calendario público de estadía. */
type Props = {
  estado: EstadoDisponibilidad;
  onReintentar: () => void;
  propiedadId?: string;
  seleccion: SeleccionEstadia;
  onCambiar: (seleccion: SeleccionEstadia) => void;
  /** Tamaño visual. Por defecto "normal". */
  tamano?: TamanoCalendario;
};

/** Props internas del calendario cuando el contexto ya es válido. */
type PropsCalendarioConContexto = {
  ctx: ContextoEstadia;
  mesInicial: AnioMes;
  propiedadId?: string;
  seleccion: SeleccionEstadia;
  onCambiar: (seleccion: SeleccionEstadia) => void;
  tamano: TamanoCalendario;
};

const CLASES_TARJETA =
  "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink)]";

const CLASES_ERROR =
  "space-y-3 rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-4 text-sm text-[var(--color-danger)]";

const CLASES_BOTON =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

const CLASES_BOTON_TERCIARIO =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-warm)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

/** Texto del resumen de la selección, con fechas visibles DD/MM/AAAA. */
function textoResumen(seleccion: SeleccionEstadia): string {
  if (seleccion.ingreso === null) {
    return "Elegí tu día de llegada.";
  }

  if (seleccion.salida === null) {
    const fecha = deClaveFecha(seleccion.ingreso);
    if (fecha === null) {
      return "Elegí tu día de salida.";
    }
    return `Llegada: ${aTextoFecha(fecha)}. Elegí tu día de salida.`;
  }

  const resumen = resumirEstadia(seleccion);
  if (resumen === null) {
    return "Elegí tu día de llegada.";
  }

  const unidad = resumen.noches === 1 ? "noche" : "noches";
  return `Del ${resumen.textoIngreso} al ${resumen.textoSalida} (${resumen.noches} ${unidad})`;
}

/**
 * Calendario con contexto válido. Se separa para poder usar hooks sin
 * condicionales y para no montar nada cuando los datos no son confiables.
 */
function CalendarioConContexto({
  ctx,
  mesInicial,
  propiedadId,
  seleccion,
  onCambiar,
  tamano,
}: PropsCalendarioConContexto) {
  // Siempre se dibuja la selección normalizada: nunca una vieja inválida.
  const efectiva = normalizarSeleccion(seleccion, ctx);
  const hayDiferencia =
    efectiva.ingreso !== seleccion.ingreso ||
    efectiva.salida !== seleccion.salida;

  useEffect(() => {
    if (hayDiferencia) {
      onCambiar(efectiva);
    }
  }, [hayDiferencia, efectiva, onCambiar]);

  const mostrarAyuda =
    efectiva.ingreso !== null &&
    efectiva.salida === null &&
    salidaOcupadaDisponible(efectiva.ingreso, ctx);

  return (
    <div className="space-y-3">
      <CalendarioMes
        key={`${propiedadId ?? "general"}:${ctx.desde}`}
        mesInicial={mesInicial}
        infoDia={(clave) => infoDiaEstadia(efectiva, clave, ctx)}
        onElegirDia={(clave) =>
          onCambiar(elegirDiaEstadia(efectiva, clave, ctx))
        }
        desde={ctx.desde}
        hasta={ctx.hasta}
        hoy={ctx.desde}
        tamano={tamano}
      />

      <LeyendaCalendario etiquetaOcupado="Noche ocupada" />

      {mostrarAyuda && (
        <p className="text-sm text-[var(--color-ink)]/70">
          {AYUDA_SALIDA_OCUPADA}
        </p>
      )}

      <p
        aria-live="polite"
        className="text-sm font-medium text-[var(--color-ink)]"
      >
        {textoResumen(efectiva)}
      </p>

      {efectiva.ingreso !== null && (
        <button
          type="button"
          onClick={() => onCambiar(ESTADIA_VACIA)}
          className={CLASES_BOTON_TERCIARIO}
        >
          Limpiar fechas
        </button>
      )}
    </div>
  );
}

export function CalendarioEstadia({
  estado,
  onReintentar,
  propiedadId,
  seleccion,
  onCambiar,
  tamano = "normal",
}: Props) {
  if (estado.estado === "cargando") {
    return (
      <p role="status" className={CLASES_TARJETA}>
        Cargando disponibilidad…
      </p>
    );
  }

  if (estado.estado === "error") {
    return (
      <div role="alert" className={CLASES_ERROR}>
        <p>{estado.mensaje}</p>
        <button type="button" onClick={onReintentar} className={CLASES_BOTON}>
          Reintentar
        </button>
      </div>
    );
  }

  const ctx =
    propiedadId === undefined
      ? contextoGeneral(estado.datos)
      : contextoCabanaUnica(estado.datos, propiedadId);

  if (ctx === null) {
    return (
      <div role="alert" className={CLASES_ERROR}>
        <p>
          {propiedadId === undefined
            ? "No hay cabañas disponibles para reservar."
            : "Esta cabaña no está disponible para reservar."}
        </p>
      </div>
    );
  }

  const mesInicial = mesDeClave(ctx.desde);

  if (mesInicial === null) {
    return (
      <div role="alert" className={CLASES_ERROR}>
        <p>No pudimos cargar la disponibilidad.</p>
      </div>
    );
  }

  return (
    <CalendarioConContexto
      ctx={ctx}
      mesInicial={mesInicial}
      propiedadId={propiedadId}
      seleccion={seleccion}
      onCambiar={onCambiar}
      tamano={tamano}
    />
  );
}
