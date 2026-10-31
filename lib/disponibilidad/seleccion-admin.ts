import { aClaveFecha, deClaveFecha, sumarDias } from "./noches";
import { NOCHES_MAX_POR_ACCION } from "./rangos-admin";

/**
 * Lógica pura de la selección de días que el administrador hace en el
 * calendario de disponibilidad.
 *
 * El rango del administrador es inclusivo en ambos extremos: elegir del
 * 05/11/2026 al 08/11/2026 alcanza las noches 5, 6, 7 y 8. Un solo día se
 * representa con inicio = fin y equivale a 1 noche. Es distinto del intervalo
 * [ingreso, salida) de una estadía, donde la noche de salida no se ocupa.
 *
 * Comportamiento de los clics:
 * - Sin selección, el primer clic fija el inicio (fin queda en null).
 * - Con solo inicio, un clic posterior o igual cierra el rango; un clic
 *   anterior descarta el inicio viejo y pasa a ser el nuevo inicio.
 * - Con inicio y fin, cualquier clic reinicia la selección en ese día.
 *
 * Las claves son texto "AAAA-MM-DD" y se comparan como texto (orden ISO). Toda
 * la matemática de fechas se hace en UTC, así que el resultado no depende de la
 * zona horaria del sistema.
 *
 * El módulo es puro: no toca la base de datos, no conoce componentes visuales y
 * no depende de la hora actual.
 */

/** Estado de la selección de días del administrador. */
export type SeleccionRango = {
  /** Primer día elegido, o null si todavía no hay selección. */
  inicio: string | null;
  /** Último día elegido, o null si solo se eligió el inicio por ahora. */
  fin: string | null;
};

/**
 * Selección sin ningún día elegido. Se congela para que nadie la modifique por
 * accidente; el tipo no se ve afectado porque las propiedades de solo lectura
 * son asignables a las mutables.
 */
export const SELECCION_VACIA: SeleccionRango = Object.freeze({
  inicio: null,
  fin: null,
});

/** Posición que ocupa un día dentro de la selección, para pintarlo. */
export type MarcaSeleccion = "inicio" | "medio" | "fin" | "unico";

/** Cantidad máxima de días que se recorren al resumir una selección. */
const DIAS_MAXIMOS_RECORRIDO = 40_000;

/** Milisegundos que tiene un día cuando se cuenta en UTC. */
const MS_POR_DIA = 86_400_000;

/**
 * Aplica el clic de un día sobre la selección actual y devuelve el estado
 * nuevo, sin mutar el anterior.
 *
 * Si la clave no es un día válido, la selección queda como estaba.
 */
export function elegirDiaRango(
  actual: SeleccionRango,
  clave: string,
): SeleccionRango {
  if (deClaveFecha(clave) === null) {
    return actual;
  }

  if (actual.inicio === null) {
    return { inicio: clave, fin: null };
  }

  if (actual.fin === null) {
    // Un clic anterior al inicio reemplaza el inicio: el rango siempre se arma
    // de menor a mayor. Un clic igual cierra un rango de un solo día.
    if (clave < actual.inicio) {
      return { inicio: clave, fin: null };
    }
    return { inicio: actual.inicio, fin: clave };
  }

  // Ya había un rango completo: el clic arranca una selección nueva.
  return { inicio: clave, fin: null };
}

/**
 * Devuelve el rango inclusivo [desde, hasta] de la selección, normalizado para
 * que desde nunca sea mayor que hasta. Devuelve null si no hay inicio.
 */
export function rangoDeSeleccion(
  seleccion: SeleccionRango,
): { desde: string; hasta: string } | null {
  const { inicio, fin } = seleccion;

  if (inicio === null) {
    return null;
  }

  if (fin === null) {
    return { desde: inicio, hasta: inicio };
  }

  if (inicio <= fin) {
    return { desde: inicio, hasta: fin };
  }

  return { desde: fin, hasta: inicio };
}

/**
 * Indica qué marca le corresponde a un día dentro de la selección: primer día,
 * día intermedio, último día o día único. Devuelve undefined si el día queda
 * fuera del rango o si no hay selección.
 */
export function marcaDeDia(
  seleccion: SeleccionRango,
  clave: string,
): MarcaSeleccion | undefined {
  const rango = rangoDeSeleccion(seleccion);
  if (rango === null) {
    return undefined;
  }

  if (rango.desde === rango.hasta) {
    return clave === rango.desde ? "unico" : undefined;
  }

  if (clave === rango.desde) {
    return "inicio";
  }
  if (clave === rango.hasta) {
    return "fin";
  }
  if (clave > rango.desde && clave < rango.hasta) {
    return "medio";
  }

  return undefined;
}

/** Totales de una selección, ya contrastados con las noches bloqueadas. */
export type ResumenSeleccion = {
  desde: string;
  hasta: string;
  noches: number;
  yaBloqueadas: number;
  libres: number;
  excedeMaximo: boolean;
};

/**
 * Resume la selección: cuántos días abarca, cuántos ya están bloqueados y
 * cuántos quedarían libres. Devuelve null si no hay rango, si alguna clave es
 * inválida o si el rango supera el tope de seguridad del recorrido.
 *
 * El máximo de noches por acción no invalida el resumen: solo marca
 * excedeMaximo para que la pantalla avise y deshabilite los botones.
 */
export function resumirSeleccion(
  seleccion: SeleccionRango,
  bloqueadas: ReadonlySet<string>,
): ResumenSeleccion | null {
  const rango = rangoDeSeleccion(seleccion);
  if (rango === null) {
    return null;
  }

  const fechaDesde = deClaveFecha(rango.desde);
  const fechaHasta = deClaveFecha(rango.hasta);
  if (fechaDesde === null || fechaHasta === null) {
    return null;
  }

  // Rango inclusivo: desde = hasta cuenta 1 día. La diferencia en UTC se
  // redondea porque cada día mide exactamente MS_POR_DIA milisegundos.
  const noches =
    Math.round((fechaHasta.getTime() - fechaDesde.getTime()) / MS_POR_DIA) + 1;

  // Tope de seguridad: evita recorrer millones de días por una clave absurda.
  if (noches > DIAS_MAXIMOS_RECORRIDO) {
    return null;
  }

  let yaBloqueadas = 0;
  for (let i = 0; i < noches; i += 1) {
    const clave = aClaveFecha(sumarDias(fechaDesde, i));
    if (bloqueadas.has(clave)) {
      yaBloqueadas += 1;
    }
  }

  return {
    desde: rango.desde,
    hasta: rango.hasta,
    noches,
    yaBloqueadas,
    libres: noches - yaBloqueadas,
    excedeMaximo: noches > NOCHES_MAX_POR_ACCION,
  };
}
