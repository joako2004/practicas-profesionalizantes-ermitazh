import { aClaveFecha, deClaveFecha, sumarDias } from "./noches";

/**
 * Armado puro de la grilla mensual del calendario de disponibilidad.
 *
 * Reglas de dibujo:
 * - La semana empieza en lunes y termina en domingo (formato argentino).
 * - Cada mes se dibuja siempre con 6 semanas de 7 casilleros (42 en total),
 *   así el calendario no cambia de alto al navegar entre meses. Los casilleros
 *   que no pertenecen al mes van marcados con `delMes: false` y sirven de
 *   relleno al principio y al final.
 * - Los meses se numeran de 1 a 12.
 * - Toda la matemática de fechas se hace en UTC (getUTCDay, getUTCDate,
 *   Date.UTC), para que el resultado no dependa de la zona horaria del sistema.
 * - La clave de cada día es el texto "AAAA-MM-DD".
 *
 * Este módulo no conoce Prisma, React ni la base de datos: solo transforma
 * números y claves en la grilla que consumirá el componente visual.
 */

/** Nombres de los meses en orden, para etiquetas. */
export const MESES: readonly string[] = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Iniciales de los días de la semana, con lunes primero. */
export const DIAS_SEMANA_CORTOS: readonly string[] = [
  "Lu",
  "Ma",
  "Mi",
  "Ju",
  "Vi",
  "Sá",
  "Do",
];

/** Cantidad fija de semanas que se dibujan por mes. */
const SEMANAS_POR_MES = 6;

/** Cantidad de días por semana. */
const DIAS_POR_SEMANA = 7;

/** Cantidad total de casilleros de la grilla. */
const DIAS_POR_GRILLA = SEMANAS_POR_MES * DIAS_POR_SEMANA;

/** Año mínimo soportado por el módulo de disponibilidad. */
const ANIO_MINIMO = 2000;

/** Año máximo soportado por el módulo de disponibilidad. */
const ANIO_MAXIMO = 2100;

/** Casillero de un día dentro de la grilla mensual. */
export type DiaGrilla = {
  /** Clave interna del día, siempre "AAAA-MM-DD". */
  clave: string;
  /** Número del día del mes de esa fecha (1-31). */
  dia: number;
  /** Indica si la fecha pertenece al mes que se está dibujando. */
  delMes: boolean;
};

/** Grilla completa de un mes: exactamente 6 semanas de 7 casilleros. */
export type MesGrilla = {
  anio: number;
  /** Mes de 1 a 12. */
  mes: number;
  semanas: DiaGrilla[][];
};

/** Año y mes, con el mes numerado de 1 a 12. */
export type AnioMes = {
  anio: number;
  mes: number;
};

/** Comprueba que el valor sea un entero. */
function esEntero(valor: number): boolean {
  return Number.isInteger(valor);
}

/** Valida un mes entero entre 1 y 12 y lanza RangeError si no lo es. */
function validarMes(mes: number): void {
  if (!esEntero(mes) || mes < 1 || mes > 12) {
    throw new RangeError(`El mes debe ser un entero entre 1 y 12; se recibió ${String(mes)}.`);
  }
}

/** Valida un año entero dentro del rango soportado y lanza RangeError. */
function validarAnioSoportado(anio: number): void {
  if (!esEntero(anio) || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
    throw new RangeError(
      `El año debe ser un entero entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}; se recibió ${String(anio)}.`,
    );
  }
}

/**
 * Valida que el año sea un entero, sin limitarlo al rango 2000-2100.
 * Se usa en la navegación entre meses, que puede salir del rango y dejar que
 * `armarMes` sea quien lo controle al dibujar.
 */
function validarAnioEntero(anio: number): void {
  if (!esEntero(anio)) {
    throw new RangeError(`El año debe ser un entero; se recibió ${String(anio)}.`);
  }
}

/**
 * Arma la grilla de un mes con 6 semanas fijas de 7 casilleros.
 *
 * El primer casillero es el lunes de la semana en la que cae el día 1; los
 * casilleros anteriores y posteriores al mes llevan `delMes: false`.
 * Lanza RangeError si el año no es entero entre 2000 y 2100 o el mes no es
 * entero entre 1 y 12.
 */
export function armarMes(anio: number, mes: number): MesGrilla {
  validarAnioSoportado(anio);
  validarMes(mes);

  // Primer día del mes a medianoche UTC.
  const primerDia = new Date(Date.UTC(anio, mes - 1, 1));

  // getUTCDay() devuelve 0 para domingo; con esta cuenta el lunes vale 0.
  const desfaseAlLunes = (primerDia.getUTCDay() + 6) % 7;

  // Primer casillero: el lunes de la semana en la que cae el día 1.
  const primerCasillero = sumarDias(primerDia, -desfaseAlLunes);

  const dias: DiaGrilla[] = [];
  for (let i = 0; i < DIAS_POR_GRILLA; i += 1) {
    const fecha = sumarDias(primerCasillero, i);
    dias.push({
      clave: aClaveFecha(fecha),
      dia: fecha.getUTCDate(),
      delMes:
        fecha.getUTCMonth() + 1 === mes && fecha.getUTCFullYear() === anio,
    });
  }

  const semanas: DiaGrilla[][] = [];
  for (let i = 0; i < SEMANAS_POR_MES; i += 1) {
    semanas.push(dias.slice(i * DIAS_POR_SEMANA, (i + 1) * DIAS_POR_SEMANA));
  }

  return { anio, mes, semanas };
}

/**
 * Devuelve el año y el mes (1-12) de una clave "AAAA-MM-DD", o null si la
 * clave no cumple el formato estricto o la fecha no existe.
 */
export function mesDeClave(clave: string): AnioMes | null {
  const fecha = deClaveFecha(clave);
  if (fecha === null) {
    return null;
  }
  return { anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() + 1 };
}

/**
 * Devuelve el mes siguiente. Diciembre pasa a enero del año siguiente.
 * Lanza RangeError si el año o el mes no son enteros o el mes no está entre
 * 1 y 12. No limita el año al rango 2000-2100.
 */
export function mesSiguiente(anio: number, mes: number): AnioMes {
  validarAnioEntero(anio);
  validarMes(mes);

  if (mes === 12) {
    return { anio: anio + 1, mes: 1 };
  }
  return { anio, mes: mes + 1 };
}

/**
 * Devuelve el mes anterior. Enero pasa a diciembre del año anterior.
 * Lanza RangeError si el año o el mes no son enteros o el mes no está entre
 * 1 y 12. No limita el año al rango 2000-2100.
 */
export function mesAnterior(anio: number, mes: number): AnioMes {
  validarAnioEntero(anio);
  validarMes(mes);

  if (mes === 1) {
    return { anio: anio - 1, mes: 12 };
  }
  return { anio, mes: mes - 1 };
}

/**
 * Devuelve la etiqueta visible del mes, por ejemplo "Noviembre de 2026".
 * Lanza RangeError si el mes no es entero entre 1 y 12.
 */
export function etiquetaMes(anio: number, mes: number): string {
  validarMes(mes);

  const nombre = MESES[mes - 1];
  const nombreCapitalizado = nombre.charAt(0).toUpperCase() + nombre.slice(1);
  return `${nombreCapitalizado} de ${String(anio)}`;
}

/**
 * Indica si algún día del mes cae dentro de la ventana [desde, hasta], con
 * ambos extremos incluidos y expresados como claves "AAAA-MM-DD".
 *
 * La comparación se hace como texto ISO, que ordena igual que la fecha.
 * Devuelve false si alguna clave es inválida o si desde es posterior a hasta.
 * Lanza RangeError si el mes no es entero entre 1 y 12.
 */
export function mesEnRango(
  anio: number,
  mes: number,
  desde: string,
  hasta: string,
): boolean {
  validarMes(mes);

  if (deClaveFecha(desde) === null || deClaveFecha(hasta) === null) {
    return false;
  }
  if (desde > hasta) {
    return false;
  }

  // Primer y último día del mes; Date.UTC(anio, mes, 0) da el último día del
  // mes anterior a `mes`, es decir, el último día del mes pedido.
  const primerDiaMes = aClaveFecha(new Date(Date.UTC(anio, mes - 1, 1)));
  const ultimoDiaMes = aClaveFecha(new Date(Date.UTC(anio, mes, 0)));

  // Si el año no permite construir una fecha válida, no hay solapamiento.
  if (primerDiaMes === "" || ultimoDiaMes === "") {
    return false;
  }

  return primerDiaMes <= hasta && ultimoDiaMes >= desde;
}
