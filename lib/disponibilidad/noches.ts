import { NOCHES_MAX } from "../precios/calcular";
import { nochesEntre } from "../precios/estadia";

/**
 * Lógica pura del calendario de disponibilidad.
 *
 * Una estadía ocupa las noches del intervalo [ingreso, salida): la noche del
 * día de salida queda libre para otra llegada. Todas las cuentas se hacen en
 * UTC para que las columnas @db.Date de Prisma no se corran de día.
 *
 * Hay dos textos con roles distintos:
 * - Clave interna "AAAA-MM-DD": identifica una noche y sirve para comparar,
 *   ordenar y usar como elemento de un Set.
 * - Texto visible "DD/MM/AAAA": es el que se muestra y se escribe.
 */

const MS_POR_DIA = 86_400_000;

const FORMATO_CLAVE = /^(\d{4})-(\d{2})-(\d{2})$/;
const FORMATO_TEXTO = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Indica si la fecha es un Date con un instante válido (no NaN). */
function esFechaValida(fecha: Date): boolean {
  return !Number.isNaN(fecha.getTime());
}

/**
 * Normaliza una fecha a la medianoche UTC de su día.
 *
 * Se copia el instante y se ajustan las horas con setUTCHours para no caer en
 * el mapeo de años 0-99 que hace Date.UTC. Devuelve null si la fecha es inválida.
 */
function aDiaUtc(fecha: Date): Date | null {
  if (!esFechaValida(fecha)) {
    return null;
  }
  const dia = new Date(fecha.getTime());
  dia.setUTCHours(0, 0, 0, 0);
  return dia;
}

/**
 * Devuelve la clave interna "AAAA-MM-DD" de una fecha, usando sus campos UTC.
 * Si la fecha es inválida devuelve "".
 */
export function aClaveFecha(fecha: Date): string {
  if (!esFechaValida(fecha)) {
    return "";
  }
  const anio = String(fecha.getUTCFullYear()).padStart(4, "0");
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/**
 * Convierte una clave "AAAA-MM-DD" a la medianoche UTC de ese día.
 * Devuelve null si el formato no es estricto o la fecha no existe.
 */
export function deClaveFecha(clave: string): Date | null {
  const coincidencia = FORMATO_CLAVE.exec(clave);
  if (!coincidencia) {
    return null;
  }

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  // La ida y vuelta descarta fechas inexistentes (31/02) y años que Date.UTC
  // mapea fuera de rango (los años 0-99 se interpretan como 1900-1999).
  if (aClaveFecha(fecha) !== clave) {
    return null;
  }

  return fecha;
}

/**
 * Devuelve el texto visible "DD/MM/AAAA" de una fecha, usando sus campos UTC.
 * Si la fecha es inválida devuelve "".
 */
export function aTextoFecha(fecha: Date): string {
  if (!esFechaValida(fecha)) {
    return "";
  }
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const anio = String(fecha.getUTCFullYear()).padStart(4, "0");
  return `${dia}/${mes}/${anio}`;
}

/**
 * Convierte un texto visible "DD/MM/AAAA" a la medianoche UTC de ese día.
 * El formato es estricto y siempre se interpreta como día/mes/año.
 * Devuelve null si no cumple el formato o la fecha no existe.
 */
export function deTextoFecha(texto: string): Date | null {
  const coincidencia = FORMATO_TEXTO.exec(texto);
  if (!coincidencia) {
    return null;
  }

  const diaTexto = coincidencia[1];
  const mesTexto = coincidencia[2];
  const anioTexto = coincidencia[3];
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  // Convertir de vuelta a clave comprueba la existencia real del día.
  const claveEsperada = `${anioTexto}-${mesTexto}-${diaTexto}`;
  if (aClaveFecha(fecha) !== claveEsperada) {
    return null;
  }

  return fecha;
}

/**
 * Devuelve una fecha nueva desplazada la cantidad de días indicada (puede ser
 * negativa). No muta la fecha original. Si la fecha es inválida, devuelve otra
 * fecha inválida.
 */
export function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha.getTime());
  if (!esFechaValida(resultado)) {
    return resultado;
  }
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

/**
 * Cuenta las noches del intervalo [ingreso, salida) usando nochesEntre.
 * Devuelve null si alguna fecha es inválida o si la salida no es posterior.
 */
function contarNoches(ingreso: Date, salida: Date): number | null {
  const diaIngreso = aDiaUtc(ingreso);
  const diaSalida = aDiaUtc(salida);

  if (diaIngreso === null || diaSalida === null) {
    return null;
  }
  if (diaSalida.getTime() <= diaIngreso.getTime()) {
    return null;
  }

  const calculo = nochesEntre(aClaveFecha(diaIngreso), aClaveFecha(diaSalida));
  if (calculo.ok) {
    return calculo.noches;
  }

  // nochesEntre solo acepta años entre 2000 y 2100. Fuera de ese rango se
  // cuenta en UTC, donde cada día mide exactamente MS_POR_DIA milisegundos.
  return Math.round((diaSalida.getTime() - diaIngreso.getTime()) / MS_POR_DIA);
}

/**
 * Devuelve las claves de las noches del intervalo [ingreso, salida), en orden
 * ascendente. Si la salida no es posterior o alguna fecha es inválida, [].
 */
export function nochesDeRango(ingreso: Date, salida: Date): string[] {
  const cantidad = contarNoches(ingreso, salida);
  const diaIngreso = aDiaUtc(ingreso);

  if (cantidad === null || diaIngreso === null) {
    return [];
  }

  const noches: string[] = [];
  for (let i = 0; i < cantidad; i += 1) {
    noches.push(aClaveFecha(sumarDias(diaIngreso, i)));
  }
  return noches;
}

export type ResultadoValidacionRango =
  | { ok: true; noches: string[] }
  | { ok: false; motivo: "RANGO_INVALIDO" }
  | { ok: false; motivo: "EXCEDE_NOCHES_MAX"; maximo: number }
  | { ok: false; motivo: "NOCHES_BLOQUEADAS"; noches: string[] };

/**
 * Valida un rango de estadía. Comprueba en este orden: rango inválido, exceso
 * de noches y noches bloqueadas. La noche del día de salida no cuenta, así que
 * puede estar bloqueada sin invalidar el rango.
 */
export function validarRango(
  ingreso: Date,
  salida: Date,
  bloqueadas: ReadonlySet<string>,
): ResultadoValidacionRango {
  const cantidad = contarNoches(ingreso, salida);

  if (cantidad === null) {
    return { ok: false, motivo: "RANGO_INVALIDO" };
  }
  if (cantidad > NOCHES_MAX) {
    return { ok: false, motivo: "EXCEDE_NOCHES_MAX", maximo: NOCHES_MAX };
  }

  const noches = nochesDeRango(ingreso, salida);
  const nochesBloqueadas = noches.filter((clave) => bloqueadas.has(clave));

  if (nochesBloqueadas.length > 0) {
    // El recorrido es ascendente, así que la lista conserva ese orden.
    return { ok: false, motivo: "NOCHES_BLOQUEADAS", noches: nochesBloqueadas };
  }

  return { ok: true, noches };
}

/**
 * Indica si un día puede elegirse como llegada: su propia noche no debe estar
 * bloqueada.
 */
export function puedeElegirseComoLlegada(
  dia: Date,
  bloqueadas: ReadonlySet<string>,
): boolean {
  const clave = aClaveFecha(dia);
  if (clave === "") {
    return false;
  }
  return !bloqueadas.has(clave);
}

/**
 * Indica si un día puede elegirse como salida para un ingreso dado, es decir,
 * si el rango resultante es válido.
 */
export function puedeElegirseComoSalida(
  ingreso: Date,
  dia: Date,
  bloqueadas: ReadonlySet<string>,
): boolean {
  return validarRango(ingreso, dia, bloqueadas).ok;
}

/**
 * Devuelve el último día elegible como salida para un ingreso: el día anterior
 * a la primera noche bloqueada dentro del límite, o ingreso + NOCHES_MAX si no
 * hay bloqueos. Si la noche del propio ingreso está bloqueada, null.
 */
export function salidaMaxima(
  ingreso: Date,
  bloqueadas: ReadonlySet<string>,
): Date | null {
  const diaIngreso = aDiaUtc(ingreso);
  if (diaIngreso === null) {
    return null;
  }

  if (bloqueadas.has(aClaveFecha(diaIngreso))) {
    return null;
  }

  for (let i = 1; i <= NOCHES_MAX; i += 1) {
    const dia = sumarDias(diaIngreso, i);
    if (bloqueadas.has(aClaveFecha(dia))) {
      return dia;
    }
  }

  return sumarDias(diaIngreso, NOCHES_MAX);
}
