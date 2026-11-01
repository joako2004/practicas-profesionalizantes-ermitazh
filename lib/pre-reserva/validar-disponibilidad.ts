import {
  cabanasLibresParaRango,
  type CabanaDisponibilidad,
  type ResultadoCabanasLibres,
} from "../disponibilidad/cabanas";
import { mensajeErrorPreReserva } from "./mensaje";

/**
 * Decisión pura sobre una pre-reserva.
 *
 * No conoce React, Prisma ni la base de datos: recibe las fechas ya
 * normalizadas, la cantidad de personas y la cabaña candidata tal como la
 * devuelve `leerCabanasParaRango`. El día actual entra por parámetro (`hoy`)
 * para que la función no dependa del reloj ni de la zona horaria del proceso.
 *
 * El orden de evaluación es: fecha pasada, existencia de la cabaña y, por
 * último, el rango, los huéspedes y las noches bloqueadas a través de
 * `cabanasLibresParaRango`.
 */

/** Datos necesarios para decidir si una pre-reserva se puede aceptar. */
export type EntradaValidacionPreReserva = {
  propiedadId: string;
  ingreso: Date;
  salida: Date;
  personas: number;
  hoy: Date;
  cabanas: readonly CabanaDisponibilidad[];
};

/** Motivos por los que se rechaza una pre-reserva. */
export type MotivoRechazoPreReserva =
  | "FECHA_PASADA"
  | "CABANA_NO_DISPONIBLE"
  | "PERSONAS_INVALIDAS"
  | "EXCEDE_CAPACIDAD"
  | "NOCHES_BLOQUEADAS"
  | "RANGO_INVALIDO"
  | "EXCEDE_NOCHES_MAX";

/** Resultado de validar una pre-reserva, con el estado HTTP sugerido. */
export type ResultadoValidacionPreReserva =
  | { ok: true }
  | {
      ok: false;
      motivo: MotivoRechazoPreReserva;
      estado: 400 | 404 | 409;
      mensaje: string;
    };

const MENSAJE_FECHA_PASADA = "La fecha de ingreso no puede ser anterior a hoy.";
const MENSAJE_CABANA_NO_DISPONIBLE = "No encontramos la cabaña.";
const MENSAJE_PERSONAS_INVALIDAS = "La cantidad de huéspedes no es válida.";
const MENSAJE_NOCHES_BLOQUEADAS =
  "Alguna de las noches elegidas ya no está disponible. Volvé a elegir tus fechas.";

// Concuerda el singular con la capacidad real de la cabaña.
function mensajeCapacidad(capacidad: number): string {
  if (capacidad === 1) {
    return "La cabaña admite hasta 1 huésped.";
  }
  return `La cabaña admite hasta ${capacidad} huéspedes.`;
}

function rechazo(
  motivo: MotivoRechazoPreReserva,
  estado: 400 | 404 | 409,
  mensaje: string,
): ResultadoValidacionPreReserva {
  return { ok: false, motivo, estado, mensaje };
}

// Traduce el resultado de cabanasLibresParaRango a un rechazo de pre-reserva.
function mapearResultado(
  resultado: ResultadoCabanasLibres<CabanaDisponibilidad>,
  capacidad: number,
): ResultadoValidacionPreReserva {
  if (resultado.ok) {
    return { ok: true };
  }

  const motivo = resultado.motivo;

  switch (motivo) {
    case "HUESPEDES_INVALIDOS":
      return rechazo("PERSONAS_INVALIDAS", 400, MENSAJE_PERSONAS_INVALIDAS);
    case "NINGUNA_CON_CAPACIDAD":
      return rechazo("EXCEDE_CAPACIDAD", 400, mensajeCapacidad(capacidad));
    case "NINGUNA_LIBRE":
      return rechazo("NOCHES_BLOQUEADAS", 409, MENSAJE_NOCHES_BLOQUEADAS);
    case "RANGO_INVALIDO":
      return rechazo(
        "RANGO_INVALIDO",
        400,
        mensajeErrorPreReserva("FECHAS_INVALIDAS"),
      );
    case "EXCEDE_NOCHES_MAX":
      return rechazo(
        "EXCEDE_NOCHES_MAX",
        400,
        mensajeErrorPreReserva("ESTADIA_MUY_LARGA"),
      );
    default: {
      // La asignación a never hace que tsc falle si se agrega un motivo nuevo.
      const motivoNoContemplado: never = motivo;
      throw new Error(
        `Motivo de disponibilidad no contemplado: ${motivoNoContemplado}`,
      );
    }
  }
}

/**
 * Decide si una pre-reserva se puede aceptar.
 *
 * El primer problema encontrado define el rechazo: primero la fecha de ingreso
 * anterior a hoy, después la cabaña inexistente en el arreglo y, por último,
 * las validaciones de rango, huéspedes, noches bloqueadas y capacidad que
 * resuelve `cabanasLibresParaRango`. No muta la entrada ni sus conjuntos.
 */
export function validarPreReserva(
  entrada: EntradaValidacionPreReserva,
): ResultadoValidacionPreReserva {
  const { propiedadId, ingreso, salida, personas, hoy, cabanas } = entrada;

  // Un ingreso hoy mismo es válido: solo se rechaza si es anterior.
  if (ingreso.getTime() < hoy.getTime()) {
    return rechazo("FECHA_PASADA", 400, MENSAJE_FECHA_PASADA);
  }

  const cabana = cabanas.find((una) => una.id === propiedadId);
  if (cabana === undefined) {
    return rechazo("CABANA_NO_DISPONIBLE", 404, MENSAJE_CABANA_NO_DISPONIBLE);
  }

  return mapearResultado(
    cabanasLibresParaRango(ingreso, salida, personas, [cabana]),
    cabana.capacidad,
  );
}
