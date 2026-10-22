import { formatearFechaCalendario } from "../config";
import {
  MENSAJES_ERROR_ESTADIA,
  type EstadiaCalculada,
  type MotivoErrorEstadia,
} from "../precios/estadia";
import { NOCHES_MAX, type Temporada, type TramoNoches } from "../precios/calcular";

// SIN_PRECIO no es un error de la pre-reserva: la reserva se crea igual con el snapshot en null.
export type MotivoErrorHttp = Exclude<MotivoErrorEstadia, "SIN_PRECIO">;

export function estadoHttpParaMotivo(motivo: MotivoErrorHttp): 400 | 404 | 500 {
  switch (motivo) {
    case "DATOS_INVALIDOS":
    case "FECHAS_INVALIDAS":
    case "SALIDA_NO_POSTERIOR":
    case "ESTADIA_MUY_LARGA":
      return 400;
    case "CABANA_NO_ENCONTRADA":
      return 404;
    case "ERROR_INTERNO":
      return 500;
    default: {
      // La asignación a never hace que tsc falle si se agrega un motivo nuevo.
      const motivoNoContemplado: never = motivo;
      throw new Error(`Motivo de error no contemplado: ${motivoNoContemplado}`);
    }
  }
}

export function mensajeErrorPreReserva(motivo: MotivoErrorHttp): string {
  if (motivo === "ESTADIA_MUY_LARGA") {
    return `La pre-reserva online admite hasta ${NOCHES_MAX} noches. Para estadías más largas, consultanos por WhatsApp.`;
  }

  return MENSAJES_ERROR_ESTADIA[motivo];
}

export type SnapshotPreReserva = {
  totalEstimadoUsd: number | null;
  totalEstimadoArs: number | null;
  precioNocheUsdAplicado: number | null;
  tipoDolarUsado: string | null;
  cotizacionUsada: number | null;
  temporadaAplicada: Temporada | null;
  tramoAplicado: TramoNoches | null;
};

export function snapshotDesdeEstadia(
  estadia: EstadiaCalculada | null
): SnapshotPreReserva {
  if (estadia === null) {
    return {
      totalEstimadoUsd: null,
      totalEstimadoArs: null,
      precioNocheUsdAplicado: null,
      tipoDolarUsado: null,
      cotizacionUsada: null,
      temporadaAplicada: null,
      tramoAplicado: null,
    };
  }

  return {
    totalEstimadoUsd: estadia.totalUsd,
    totalEstimadoArs: estadia.totalArs,
    precioNocheUsdAplicado: estadia.precioNocheAplicadoUsd,
    tipoDolarUsado: estadia.cotizacion?.tipo ?? null,
    cotizacionUsada: estadia.cotizacion?.venta ?? null,
    temporadaAplicada: estadia.temporada,
    tramoAplicado: estadia.tramo,
  };
}

export type DatosMensajePreReserva = {
  id: string;
  nombreCabana: string;
  fechaInicio: string;
  fechaFin: string;
  noches: number;
  estadia: EstadiaCalculada | null;
};

// Separador de miles manual: no depende del ICU disponible en el runtime.
function formatearPesos(valor: number): string {
  return `$${Math.round(valor)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function armarMensajePreReserva(datos: DatosMensajePreReserva): string {
  const { id, nombreCabana, fechaInicio, fechaFin, noches, estadia } = datos;

  // Si el texto no es una fecha válida, se conserva el original para no perder el dato.
  const fechaIni = formatearFechaCalendario(fechaInicio) ?? fechaInicio;
  const fechaFinTexto = formatearFechaCalendario(fechaFin) ?? fechaFin;
  const nochesTexto = noches === 1 ? "1 noche" : `${noches} noches`;

  let mensaje = `Hola, quiero confirmar mi pre-reserva #${id} de la ${nombreCabana} desde el ${fechaIni} hasta el ${fechaFinTexto} (${nochesTexto}).`;

  if (estadia?.totalArs != null) {
    mensaje += ` Valor estimativo: ${formatearPesos(estadia.totalArs)}, sujeto a confirmación.`;
    if (estadia.cotizacion?.desactualizada) {
      mensaje += " La cotización del dólar podría estar desactualizada.";
    }
  } else {
    mensaje += " El valor se consulta.";
  }

  return mensaje;
}
