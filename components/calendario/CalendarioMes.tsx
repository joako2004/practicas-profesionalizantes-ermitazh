"use client";

/**
 * CalendarioMes — dibuja UN mes del calendario de disponibilidad.
 *
 * Qué hace: muestra el encabezado con el nombre del mes, los botones para
 * navegar al mes anterior/siguiente y la grilla de 6 semanas x 7 días que
 * arma `armarMes` (semana de lunes a domingo, toda la matemática en UTC).
 *
 * Es un componente TONTO y reutilizable: no conoce reglas de negocio (admin,
 * estadías, noches bloqueadas). El padre decide cómo se ve y cómo se comporta
 * cada día mediante `infoDia`, y recibe los clics mediante `onElegirDia`.
 *
 * Decisiones de diseño:
 * - El mes visible es estado INTERNO. Para forzar otro mes desde afuera hay
 *   que remontar el componente con una `key` distinta, así el estado se
 *   reinicia con el nuevo `mesInicial`.
 * - "Hoy" NO se calcula acá: llega por props (`hoy`) para no depender de la
 *   zona horaria del navegador ni provocar diferencias de hidratación.
 * - `ocupado` (noche bloqueada) y `deshabilitado` (no se puede elegir) son
 *   INDEPENDIENTES: un día puede estar ocupado y aun así ser elegible, por
 *   ejemplo como fecha de salida de una estadía.
 * - Los casilleros de relleno (`delMes: false`, días de otro mes) van vacíos:
 *   no muestran número ni reciben clics, así no hay días repetidos.
 */

import { useState } from "react";
import {
  DIAS_SEMANA_CORTOS,
  armarMes,
  etiquetaMes,
  mesAnterior,
  mesEnRango,
  mesSiguiente,
  type AnioMes,
  type MesGrilla,
} from "@/lib/disponibilidad/grilla";
import { aTextoFecha, deClaveFecha } from "@/lib/disponibilidad/noches";

/** Parte de la selección actual que representa un día. */
export type SeleccionDia = "inicio" | "medio" | "fin" | "unico";

/** Cómo se ve y cómo se comporta un día concreto. */
export type InfoDia = {
  /** Noche bloqueada: se ve apagada y tachada. No impide elegir el día. */
  ocupado?: boolean;
  /** No se puede elegir: sin clic y sin foco. Independiente de `ocupado`. */
  deshabilitado?: boolean;
  /** Parte de la selección actual, si corresponde. */
  seleccion?: SeleccionDia;
};

/** Props del calendario. El componente no conoce nada más que esto. */
export type PropsCalendarioMes = {
  /** Mes que se muestra al montar. Para forzar otro, remontar con otra key. */
  mesInicial: AnioMes;
  /** Devuelve el aspecto/comportamiento de cada día del mes visible. */
  infoDia: (clave: string) => InfoDia;
  /** Se llama al elegir un día que no esté deshabilitado. */
  onElegirDia: (clave: string) => void;
  /** Ventana de navegación (extremo incluido), clave "AAAA-MM-DD". */
  desde?: string;
  /** Ventana de navegación (extremo incluido), clave "AAAA-MM-DD". */
  hasta?: string;
  /** Clave "AAAA-MM-DD" de hoy, para marcarlo. Si falta, no se marca nada. */
  hoy?: string;
};

/** Nombres completos de los días, en el mismo orden que la grilla (lunes primero). */
const NOMBRES_DIAS_SEMANA = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

/** Rango de años que soporta la grilla. */
const ANIO_MINIMO = 2000;
const ANIO_MAXIMO = 2100;

/** Clases comunes de los botones de navegación del encabezado. */
const CLASES_BOTON_NAVEGACION = [
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
  "border border-[var(--color-border)] text-[var(--color-ink)] transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
].join(" ");

/** Clases comunes del botón de cada día. */
const CLASES_BOTON_DIA = [
  "block h-10 w-full rounded-[var(--radius-sm)] text-sm font-medium transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
].join(" ");

/** Clases de la celda que forma la banda continua del rango seleccionado. */
const CLASES_CELDA_EN_RANGO = "p-0 align-middle bg-[var(--color-accent)]/15";

/** Clases de la celda normal (relleno o día suelto). */
const CLASES_CELDA = "p-0 align-middle";

/** Arma el mes atrapando el RangeError para no romper la pantalla. */
function armarMesSeguro(anio: number, mes: number): MesGrilla | null {
  try {
    return armarMes(anio, mes);
  } catch {
    // Año o mes inválidos: el componente muestra un mensaje corto.
    return null;
  }
}

/** Texto visible de una clave: "DD/MM/AAAA" (nunca la clave interna). */
function aTextoDia(clave: string): string {
  const fecha = deClaveFecha(clave);
  if (fecha === null) {
    return clave;
  }
  const texto = aTextoFecha(fecha);
  return texto === "" ? clave : texto;
}

/** Etiqueta accesible del día, con sus estados separados por coma. */
function etiquetaDia(clave: string, info: InfoDia, esHoy: boolean): string {
  const partes = [aTextoDia(clave)];

  if (info.ocupado === true) {
    partes.push("ocupado");
  }

  if (
    info.seleccion === "inicio" ||
    info.seleccion === "fin" ||
    info.seleccion === "unico"
  ) {
    partes.push("seleccionado");
  } else if (info.seleccion === "medio") {
    partes.push("dentro del rango");
  }

  if (esHoy) {
    partes.push("hoy");
  }

  return partes.join(", ");
}

/** Indica si el día es un extremo (o un único día) de la selección. */
function esSeleccionSolida(info: InfoDia): boolean {
  return (
    info.seleccion === "inicio" ||
    info.seleccion === "fin" ||
    info.seleccion === "unico"
  );
}

/** Combina las clases del botón del día según ocupado/deshabilitado/selección. */
function clasesBotonDia(info: InfoDia, esHoy: boolean): string {
  const clases = [CLASES_BOTON_DIA];
  const solida = esSeleccionSolida(info);

  if (solida) {
    // Extremos y día único: forma sólida con el acento y texto de contraste.
    clases.push("bg-[var(--color-accent)] text-white focus-visible:ring-white/80");
    if (info.deshabilitado !== true) {
      clases.push("hover:bg-[var(--color-accent)]/90");
    }
  } else {
    clases.push("focus-visible:ring-[var(--color-accent)]");
    if (info.deshabilitado === true) {
      clases.push("text-[var(--color-ink)]/50");
    } else if (info.ocupado === true) {
      clases.push("text-[var(--color-ink)]/45 hover:bg-[var(--color-warm)]/40");
    } else {
      clases.push("text-[var(--color-ink)] hover:bg-[var(--color-warm)]/40");
    }
  }

  // El tachado no depende del color: se entiende también en blanco y negro.
  if (info.ocupado === true) {
    clases.push("line-through");
  }

  if (info.deshabilitado === true) {
    clases.push("cursor-not-allowed opacity-40");
  }

  // "Hoy" se marca con un borde fino y se combina con el resto de los estados.
  if (esHoy) {
    clases.push(
      solida
        ? "border border-white/80"
        : "border border-[var(--color-accent)]",
    );
  }

  return clases.join(" ");
}

/** Clases del botón de navegación según esté habilitado o no. */
function clasesBotonNavegacion(habilitado: boolean): string {
  return habilitado
    ? `${CLASES_BOTON_NAVEGACION} hover:bg-[var(--color-warm)]/40`
    : `${CLASES_BOTON_NAVEGACION} cursor-not-allowed opacity-40`;
}

/** Comprueba que el mes destino esté dentro de los límites soportados. */
function destinoPermitido(
  destino: AnioMes,
  desde?: string,
  hasta?: string,
): boolean {
  if (destino.anio < ANIO_MINIMO || destino.anio > ANIO_MAXIMO) {
    return false;
  }
  if (desde !== undefined && hasta !== undefined) {
    return mesEnRango(destino.anio, destino.mes, desde, hasta);
  }
  return true;
}

export function CalendarioMes({
  mesInicial,
  infoDia,
  onElegirDia,
  desde,
  hasta,
  hoy,
}: PropsCalendarioMes) {
  // Mes visible: estado interno, inicializado una sola vez desde las props.
  const [mesVisto, setMesVisto] = useState<AnioMes>(() => ({
    anio: mesInicial.anio,
    mes: mesInicial.mes,
  }));

  const grilla = armarMesSeguro(mesVisto.anio, mesVisto.mes);

  if (grilla === null) {
    return (
      <div className="w-full rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-4 text-sm text-[var(--color-danger)]">
        Mes no válido
      </div>
    );
  }

  const destinoAnterior = mesAnterior(mesVisto.anio, mesVisto.mes);
  const destinoSiguiente = mesSiguiente(mesVisto.anio, mesVisto.mes);
  const puedeRetroceder = destinoPermitido(destinoAnterior, desde, hasta);
  const puedeAvanzar = destinoPermitido(destinoSiguiente, desde, hasta);

  const tituloMes = etiquetaMes(mesVisto.anio, mesVisto.mes);

  return (
    <div className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setMesVisto(destinoAnterior)}
          disabled={!puedeRetroceder}
          className={clasesBotonNavegacion(puedeRetroceder)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <p
          aria-live="polite"
          className="min-w-0 text-center text-base font-semibold text-[var(--color-ink)]"
        >
          {tituloMes}
        </p>

        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setMesVisto(destinoSiguiente)}
          disabled={!puedeAvanzar}
          className={clasesBotonNavegacion(puedeAvanzar)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">{`Calendario de ${tituloMes}`}</caption>
        <thead>
          <tr>
            {DIAS_SEMANA_CORTOS.map((diaCorto, indice) => (
              <th
                key={diaCorto}
                scope="col"
                aria-label={NOMBRES_DIAS_SEMANA[indice]}
                className="pb-1 text-center text-xs font-medium text-[var(--color-ink)]/60"
              >
                {diaCorto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grilla.semanas.map((semana) => (
            <tr key={semana[0].clave}>
              {semana.map((dia) => {
                if (!dia.delMes) {
                  // Relleno: casillero vacío, sin número ni botón.
                  return <td key={dia.clave} className={CLASES_CELDA} />;
                }

                const info = infoDia(dia.clave);
                const esHoy = hoy !== undefined && dia.clave === hoy;
                const solida = esSeleccionSolida(info);
                const enRango = info.seleccion === "medio";

                return (
                  <td
                    key={dia.clave}
                    className={enRango ? CLASES_CELDA_EN_RANGO : CLASES_CELDA}
                  >
                    <button
                      type="button"
                      disabled={info.deshabilitado === true}
                      aria-label={etiquetaDia(dia.clave, info, esHoy)}
                      aria-pressed={solida ? true : undefined}
                      onClick={() => {
                        if (info.deshabilitado !== true) {
                          onElegirDia(dia.clave);
                        }
                      }}
                      className={clasesBotonDia(info, esHoy)}
                    >
                      {dia.dia}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
