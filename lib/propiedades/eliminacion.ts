/**
 * Reglas puras para decidir si una cabaña se puede eliminar definitivamente.
 *
 * Este módulo no importa Prisma, Next, Supabase ni lee process.env: recibe los
 * conteos ya calculados y devuelve la decisión con el mensaje visible para el
 * administrador. La consulta a la base y el borrado real viven en la acción.
 */

export type ConteosEliminacion = {
  reservas: number;
  resenas: number;
};

export type ResultadoEvaluacionEliminacion =
  | { permitida: true }
  | { permitida: false; motivo: string };

const MOTIVO_DATOS_INVALIDOS =
  "No se pudieron verificar las reservas y las reseñas de la cabaña. Desactivala en lugar de eliminarla.";

const CONSEJO_CONSERVAR_HISTORIAL =
  "Para no perder el historial, desactivala en lugar de eliminarla.";

function esConteoValido(valor: unknown): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor >= 0
  );
}

function nombrarCantidad(
  cantidad: number,
  singular: string,
  plural: string
): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/**
 * Evalúa si la cabaña no tiene reservas ni reseñas asociadas.
 *
 * Cualquier conteo inválido (negativo, NaN, infinito o decimal) se rechaza:
 * ante la duda no se elimina, porque el borrado no se puede deshacer.
 */
export function evaluarEliminacion(conteos: {
  reservas: number;
  resenas: number;
}): ResultadoEvaluacionEliminacion {
  if (
    typeof conteos !== "object" ||
    conteos === null ||
    !esConteoValido(conteos.reservas) ||
    !esConteoValido(conteos.resenas)
  ) {
    return { permitida: false, motivo: MOTIVO_DATOS_INVALIDOS };
  }

  const { reservas, resenas } = conteos;

  if (reservas === 0 && resenas === 0) {
    return { permitida: true };
  }

  const partes: string[] = [];

  if (reservas > 0) {
    partes.push(nombrarCantidad(reservas, "reserva", "reservas"));
  }

  if (resenas > 0) {
    partes.push(nombrarCantidad(resenas, "reseña", "reseñas"));
  }

  const total = reservas + resenas;
  const asociadas = total === 1 ? "asociada" : "asociadas";

  return {
    permitida: false,
    motivo: `Esta cabaña tiene ${partes.join(
      " y "
    )} ${asociadas}. ${CONSEJO_CONSERVAR_HISTORIAL}`,
  };
}
