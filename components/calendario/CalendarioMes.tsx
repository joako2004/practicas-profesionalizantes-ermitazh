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
 * - `tamano` ("normal" | "grande") solo cambia las medidas. "normal" conserva
 *   el tamaño de siempre; "grande" aprovecha todo el ancho disponible en la
 *   pantalla de administración.
 * - El estado `ocupado` no depende solo del color: fondo suave de la familia
 *   danger, texto legible y tachado. Así se distingue del día pasado, que va
 *   apagado, sin fondo y sin tachar.
 * - `LeyendaCalendario` reutiliza las MISMAS constantes de estado que los días
 *   reales, para que la referencia visual nunca se desfase del calendario.
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
  /** Noche bloqueada: se ve con fondo suave y tachada. No impide elegir el día. */
  ocupado?: boolean;
  /** No se puede elegir: sin clic y sin foco. Independiente de `ocupado`. */
  deshabilitado?: boolean;
  /** Parte de la selección actual, si corresponde. */
  seleccion?: SeleccionDia;
};

/** Tamaño visual del calendario. "normal" es el de siempre. */
export type TamanoCalendario = "normal" | "grande";

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
  /** Tamaño visual. Por defecto "normal". */
  tamano?: TamanoCalendario;
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

/**
 * Clases de estado compartidas por los días reales y por las muestras de
 * `LeyendaCalendario`. Son cadenas completas y literales para que Tailwind las
 * detecte y para que la leyenda nunca se desfase del calendario.
 */
const ESTADO_LIBRE = "text-[var(--color-ink)] hover:bg-[var(--color-warm)]/40";

const ESTADO_OCUPADO =
  "bg-[var(--color-danger-bg)] text-[var(--color-danger)] enabled:hover:brightness-95";

const ESTADO_SELECCIONADO =
  "bg-[var(--color-accent)] font-semibold text-white enabled:hover:brightness-95";

const ESTADO_HOY = "ring-1 ring-inset ring-[var(--color-accent)]";

const ESTADO_HOY_SELECCIONADO = "ring-1 ring-inset ring-white/80";

const ESTADO_PASADO = "text-[var(--color-ink)]/55";

const ESTADO_OCUPADO_APAGADO = "opacity-75";

/** El cursor de "no se puede" solo aplica a los botones, no a la leyenda. */
const CLASE_DESHABILITADO = "cursor-not-allowed";

/** El tachado no depende del color: se entiende también en blanco y negro. */
const CLASE_TACHADO = "line-through";

/** Medidas de cada tamaño del calendario. */
type EstiloTamano = {
  contenedor: string;
  barra: string;
  titulo: string;
  botonNavegacion: string;
  iconoNavegacion: string;
  encabezadoDia: string;
  botonDia: string;
};

const ESTILOS_TAMANO: Record<TamanoCalendario, EstiloTamano> = {
  normal: {
    contenedor:
      "w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3",
    barra: "mb-2 flex items-center justify-between gap-2",
    titulo:
      "min-w-0 text-center text-base font-semibold text-[var(--color-ink)]",
    botonNavegacion:
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
    iconoNavegacion: "h-4 w-4",
    encabezadoDia:
      "pb-1 text-center text-xs font-medium text-[var(--color-ink)]/60",
    botonDia:
      "block h-10 w-full rounded-[var(--radius-sm)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
  },
  grande: {
    contenedor:
      "w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4",
    barra: "mb-3 flex items-center justify-between gap-3",
    titulo:
      "min-w-0 text-center text-base font-semibold leading-tight text-[var(--color-ink)] sm:text-lg md:text-xl",
    botonNavegacion:
      "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
    iconoNavegacion: "h-5 w-5",
    encabezadoDia:
      "pb-1.5 text-center text-sm font-medium text-[var(--color-ink)]/70",
    botonDia:
      "block h-11 w-full rounded-[var(--radius-sm)] text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:h-12 md:h-14 md:text-lg lg:h-16",
  },
};

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
function clasesBotonDia(
  info: InfoDia,
  esHoy: boolean,
  tamano: TamanoCalendario,
): string {
  const clases = [ESTILOS_TAMANO[tamano].botonDia];
  const solida = esSeleccionSolida(info);

  // Foco visible: blanco sobre el fondo de acento, acento sobre el resto.
  clases.push(
    solida
      ? "focus-visible:ring-white/80"
      : "focus-visible:ring-[var(--color-accent)]",
  );

  if (solida) {
    // Extremos y día único: gana la forma sólida, pero el tachado se mantiene.
    clases.push(ESTADO_SELECCIONADO);
    if (esHoy) {
      clases.push(ESTADO_HOY_SELECCIONADO);
    }
  } else if (info.deshabilitado === true && info.ocupado === true) {
    // Pasado y bloqueado: conserva el fondo suave y el tachado, más apagado.
    clases.push(ESTADO_OCUPADO, ESTADO_OCUPADO_APAGADO);
    if (esHoy) {
      clases.push(ESTADO_HOY);
    }
  } else if (info.deshabilitado === true) {
    // Pasado y libre: sin fondo ni tachado, para no confundirlo con "ocupado".
    clases.push(ESTADO_PASADO);
    if (esHoy) {
      clases.push(ESTADO_HOY);
    }
  } else if (info.ocupado === true) {
    clases.push(ESTADO_OCUPADO);
    if (esHoy) {
      clases.push(ESTADO_HOY);
    }
  } else {
    clases.push(ESTADO_LIBRE);
    if (esHoy) {
      clases.push(ESTADO_HOY);
    }
  }

  if (info.ocupado === true) {
    clases.push(CLASE_TACHADO);
  }

  if (info.deshabilitado === true) {
    clases.push(CLASE_DESHABILITADO);
  }

  return clases.join(" ");
}

/** Clases del botón de navegación según esté habilitado o no. */
function clasesBotonNavegacion(
  habilitado: boolean,
  tamano: TamanoCalendario,
): string {
  const base = ESTILOS_TAMANO[tamano].botonNavegacion;
  return habilitado
    ? `${base} hover:bg-[var(--color-warm)]/40`
    : `${base} cursor-not-allowed opacity-40`;
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
  tamano = "normal",
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

  const estilos = ESTILOS_TAMANO[tamano];
  const destinoAnterior = mesAnterior(mesVisto.anio, mesVisto.mes);
  const destinoSiguiente = mesSiguiente(mesVisto.anio, mesVisto.mes);
  const puedeRetroceder = destinoPermitido(destinoAnterior, desde, hasta);
  const puedeAvanzar = destinoPermitido(destinoSiguiente, desde, hasta);

  const tituloMes = etiquetaMes(mesVisto.anio, mesVisto.mes);

  return (
    <div className={estilos.contenedor}>
      <div className={estilos.barra}>
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setMesVisto(destinoAnterior)}
          disabled={!puedeRetroceder}
          className={clasesBotonNavegacion(puedeRetroceder, tamano)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={estilos.iconoNavegacion}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <p aria-live="polite" className={estilos.titulo}>
          {tituloMes}
        </p>

        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setMesVisto(destinoSiguiente)}
          disabled={!puedeAvanzar}
          className={clasesBotonNavegacion(puedeAvanzar, tamano)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={estilos.iconoNavegacion}
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
                className={estilos.encabezadoDia}
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
                      className={clasesBotonDia(info, esHoy, tamano)}
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

/** Estados que puede mostrar la leyenda del calendario. */
type EstadoLeyenda = "libre" | "ocupado" | "seleccionado" | "hoy" | "pasado";

/** Estados que se muestran cuando no se pasa `estados`. */
const ESTADOS_LEYENDA: ReadonlyArray<EstadoLeyenda> = [
  "libre",
  "ocupado",
  "seleccionado",
  "hoy",
  "pasado",
];

/** Número de ejemplo de cada muestra de la leyenda. */
const NUMERO_MUESTRA: Record<EstadoLeyenda, string> = {
  libre: "5",
  ocupado: "12",
  seleccionado: "8",
  hoy: "21",
  pasado: "3",
};

/** Marco común de las muestras: un cuadradito del tamaño de un día chico. */
const CLASES_MUESTRA_LEYENDA =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-xs font-medium";

/** Clases de cada muestra: reutilizan los estados de los días reales. */
function clasesMuestraLeyenda(estado: EstadoLeyenda): string {
  switch (estado) {
    case "libre":
      return `${CLASES_MUESTRA_LEYENDA} ${ESTADO_LIBRE}`;
    case "ocupado":
      return `${CLASES_MUESTRA_LEYENDA} ${ESTADO_OCUPADO} ${CLASE_TACHADO}`;
    case "seleccionado":
      return `${CLASES_MUESTRA_LEYENDA} ${ESTADO_SELECCIONADO}`;
    case "hoy":
      return `${CLASES_MUESTRA_LEYENDA} ${ESTADO_LIBRE} ${ESTADO_HOY}`;
    case "pasado":
      return `${CLASES_MUESTRA_LEYENDA} ${ESTADO_PASADO}`;
  }
}

/** Texto visible de cada estado. */
function etiquetaLeyenda(
  estado: EstadoLeyenda,
  etiquetaOcupado: string,
): string {
  switch (estado) {
    case "libre":
      return "Libre";
    case "ocupado":
      return etiquetaOcupado;
    case "seleccionado":
      return "Elegida";
    case "hoy":
      return "Hoy";
    case "pasado":
      return "Ya pasó";
  }
}

/** Props de la leyenda del calendario. */
type PropsLeyendaCalendario = {
  /** Estados a mostrar. Por defecto, los cinco. */
  estados?: ReadonlyArray<EstadoLeyenda>;
  /** Etiqueta del estado ocupado. Por defecto, "Bloqueada". */
  etiquetaOcupado?: string;
};

/**
 * LeyendaCalendario — referencia visual de los estados del calendario.
 *
 * Las muestras usan las mismas constantes de clases que los días reales, así
 * que si cambia el aspecto de un estado la leyenda cambia con él. El texto va
 * con color de tinta del proyecto para leerse sobre la tarjeta clara.
 */
export function LeyendaCalendario({
  estados = ESTADOS_LEYENDA,
  etiquetaOcupado = "Bloqueada",
}: PropsLeyendaCalendario) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {estados.map((estado) => (
        <li key={estado} className="flex items-center gap-2">
          <span aria-hidden="true" className={clasesMuestraLeyenda(estado)}>
            {NUMERO_MUESTRA[estado]}
          </span>
          <span className="text-sm text-[var(--color-ink)]">
            {etiquetaLeyenda(estado, etiquetaOcupado)}
          </span>
        </li>
      ))}
    </ul>
  );
}
