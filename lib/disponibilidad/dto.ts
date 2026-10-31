import {
  agruparNochesPorCabana,
  type CabanaDisponibilidad,
} from "./cabanas";
import { aClaveFecha, sumarDias } from "./noches";

/**
 * Armado puro del DTO público de disponibilidad.
 *
 * Este módulo no conoce Prisma, React ni la base de datos: recibe las cabañas
 * activas ya filtradas y las filas de `noches_bloqueadas` ya resueltas, y arma
 * el objeto que devolverá la API pública. Las claves de noche son siempre
 * "AAAA-MM-DD" y toda la matemática de fechas se hace en UTC, para que el
 * resultado no dependa de la zona horaria del sistema.
 */

/**
 * Cantidad de noches que cubre la ventana pública, contando la noche de hoy.
 *
 * Son unos 18 meses. Es la única constante a cambiar si se quiere otra ventana.
 */
export const VENTANA_DIAS = 548;

/** Zona horaria con la que se decide qué día es "hoy" para el huésped. */
const ZONA_ARGENTINA = "America/Argentina/Mendoza";

/** Formateador que devuelve los campos de la fecha calendario en Argentina. */
const FORMATO_DIA_ARGENTINA = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_ARGENTINA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Ventana del DTO: claves "AAAA-MM-DD", con "hasta" como última noche incluida. */
export type VentanaDisponibilidad = {
  desde: string;
  hasta: string;
};

/**
 * Cabaña del DTO público.
 *
 * `bloqueadas` viene ordenada ascendente y sin repetidos. No incluye ningún
 * dato de reservas ni de huéspedes.
 */
export type CabanaDisponibilidadDto = {
  id: string;
  capacidad: number;
  bloqueadas: string[];
};

/** Respuesta pública completa: la ventana y una entrada por cabaña activa. */
export type DisponibilidadDto = {
  ventana: VentanaDisponibilidad;
  cabanas: CabanaDisponibilidadDto[];
};

/** Devuelve el valor numérico de una parte del formateador, o NaN si falta. */
function parteNumerica(
  partes: Intl.DateTimeFormatPart[],
  tipo: "year" | "month" | "day",
): number {
  const parte = partes.find((una) => una.type === tipo);
  return parte === undefined ? Number.NaN : Number(parte.value);
}

/**
 * Devuelve la fecha calendario de "hoy" en America/Argentina/Mendoza, como
 * medianoche UTC de ese día.
 *
 * OJO: es la cuarta versión de "hoy" del proyecto; se unifica en D10.
 */
export function hoyEnArgentina(ahora: Date): Date {
  if (Number.isNaN(ahora.getTime())) {
    throw new RangeError("La fecha de referencia es inválida");
  }

  const partes = FORMATO_DIA_ARGENTINA.formatToParts(ahora);
  const anio = parteNumerica(partes, "year");
  const mes = parteNumerica(partes, "month");
  const dia = parteNumerica(partes, "day");

  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia)
  ) {
    throw new RangeError("No se pudo obtener el día de Argentina");
  }

  return new Date(Date.UTC(anio, mes - 1, dia));
}

/**
 * Calcula la ventana pública que empieza en `hoy` y dura `dias` noches.
 *
 * `hoy` se normaliza a la medianoche UTC de su día UTC. `hasta` es la última
 * noche incluida, por eso se suma `dias - 1`. Con `dias = 1`, `desde` y
 * `hasta` son el mismo día.
 */
export function calcularVentana(
  hoy: Date,
  dias: number = VENTANA_DIAS,
): { desde: Date; hasta: Date } {
  if (Number.isNaN(hoy.getTime())) {
    throw new RangeError("La fecha de inicio es inválida");
  }
  if (!Number.isInteger(dias) || dias < 1) {
    throw new RangeError("La cantidad de días debe ser un entero mayor o igual a 1");
  }

  const desde = new Date(
    Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()),
  );
  const hasta = sumarDias(desde, dias - 1);

  return { desde, hasta };
}

/**
 * Arma el DTO público de disponibilidad para las cabañas indicadas.
 *
 * Recorre `propiedades` en su orden de entrada, así que una cabaña activa sin
 * filas aparece igual con `bloqueadas: []`. De cada cabaña se conservan solo
 * las noches bloqueadas dentro de la ventana, con ambos extremos incluidos,
 * ordenadas ascendente y sin repetidos. Las filas de propiedades que no están
 * en la lista se ignoran. No muta ningún argumento.
 */
export function armarDisponibilidad(
  propiedades: ReadonlyArray<{ id: string; capacidad: number }>,
  filas: ReadonlyArray<{ propiedadId: string; fecha: Date }>,
  ventana: { desde: Date; hasta: Date },
): DisponibilidadDto {
  const desde = aClaveFecha(ventana.desde);
  const hasta = aClaveFecha(ventana.hasta);

  if (desde === "" || hasta === "") {
    throw new RangeError("La ventana tiene fechas inválidas");
  }
  if (ventana.desde.getTime() > ventana.hasta.getTime()) {
    throw new RangeError("La ventana termina antes de empezar");
  }

  const agrupadas = agruparNochesPorCabana(filas);

  const cabanas = propiedades.map((propiedad) => {
    const noches = agrupadas.get(propiedad.id);
    const bloqueadas: string[] = [];

    if (noches !== undefined) {
      for (const clave of noches) {
        if (clave >= desde && clave <= hasta) {
          bloqueadas.push(clave);
        }
      }
      // Claves ISO: el orden lexicográfico coincide con el cronológico.
      bloqueadas.sort();
    }

    return {
      id: propiedad.id,
      capacidad: propiedad.capacidad,
      bloqueadas,
    };
  });

  return { ventana: { desde, hasta }, cabanas };
}

/**
 * Convierte el DTO público al tipo `CabanaDisponibilidad` de `cabanas.ts`.
 *
 * Sirve para usar el DTO con `cabanasLibresParaRango` y `nochesOcupadasEnTodas`
 * tanto en el cliente como en el servidor.
 */
export function aCabanasDisponibilidad(
  dto: DisponibilidadDto,
): CabanaDisponibilidad[] {
  return dto.cabanas.map((cabana) => ({
    id: cabana.id,
    capacidad: cabana.capacidad,
    bloqueadas: new Set(cabana.bloqueadas),
  }));
}
