"use server";

import { prisma } from "@/lib/prisma";
import { calcularPrecio, NOCHES_MAX } from "@/lib/precios/calcular";
import {
  nochesEntre,
  MENSAJES_ERROR_ESTADIA,
  type RespuestaCalculoEstadia,
  type MotivoErrorEstadia,
} from "@/lib/precios/estadia";
import { serializarPropiedad, obtenerPreciosUsd } from "@/lib/serializers";
import { obtenerConfiguracionPrecios } from "@/lib/configuracion-precios";
import { obtenerCotizacion, ETIQUETAS_TIPO_DOLAR } from "@/lib/cotizacion";

const LARGO_MAX_ID = 100;

const FORMATEADOR_FECHA_COTIZACION = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

function error(motivo: MotivoErrorEstadia): RespuestaCalculoEstadia {
  return { ok: false, motivo, mensaje: MENSAJES_ERROR_ESTADIA[motivo] };
}

export async function calcularEstadia(
  propiedadId: unknown,
  fechaIngreso: unknown,
  fechaSalida: unknown,
): Promise<RespuestaCalculoEstadia> {
  if (typeof propiedadId !== "string") {
    return error("DATOS_INVALIDOS");
  }

  const id = propiedadId.trim();
  if (id.length === 0 || id.length > LARGO_MAX_ID) {
    return error("DATOS_INVALIDOS");
  }

  const noches = nochesEntre(fechaIngreso, fechaSalida);
  if (!noches.ok) {
    return error(noches.motivo);
  }

  if (noches.noches > NOCHES_MAX) {
    return error("ESTADIA_MUY_LARGA");
  }

  try {
    // El select debe incluir los 6 campos de precio: serializarPropiedad no
    // está tipado contra Prisma y un campo ausente llegaría como null.
    const propiedad = await prisma.propiedad.findUnique({
      where: { id },
      select: {
        id: true,
        promoSemanalAlta: true,
        promoSemanalBaja: true,
        precioNocheAltaUsd: true,
        precioNocheBajaUsd: true,
        precio2a6AltaUsd: true,
        precio2a6BajaUsd: true,
      },
    });

    if (!propiedad) {
      return error("CABANA_NO_ENCONTRADA");
    }

    const configuracion = await obtenerConfiguracionPrecios();
    const cotizacion = await obtenerCotizacion(configuracion.tipoDolar);

    const resultado = calcularPrecio({
      noches: noches.noches,
      temporada: configuracion.temporadaActiva,
      precios: obtenerPreciosUsd(serializarPropiedad(propiedad)),
      cotizacionVenta: cotizacion ? cotizacion.venta : null,
    });

    if (!resultado.ok) {
      return resultado.motivo === "SIN_PRECIO" ? error("SIN_PRECIO") : error("DATOS_INVALIDOS");
    }

    return {
      ok: true,
      estadia: {
        noches: resultado.noches,
        temporada: resultado.temporada,
        tramo: resultado.tramo,
        precioUnaNocheUsd: resultado.precioUnaNocheUsd,
        precioNocheBaseUsd: resultado.precioNocheBaseUsd,
        precioNocheAplicadoUsd: resultado.precioNocheAplicadoUsd,
        promoAplicadaPct: resultado.promoAplicadaPct,
        totalUsd: resultado.totalUsd,
        precioNocheBaseArs: resultado.precioNocheBaseArs,
        precioNocheAplicadoArs: resultado.precioNocheAplicadoArs,
        totalArs: resultado.totalArs,
        cotizacion: cotizacion
          ? {
              tipo: cotizacion.tipo,
              etiqueta: ETIQUETAS_TIPO_DOLAR[cotizacion.tipo],
              venta: cotizacion.venta,
              fechaTexto: FORMATEADOR_FECHA_COTIZACION.format(
                cotizacion.fechaApi ?? cotizacion.obtenidaEn,
              ),
              desactualizada: cotizacion.desactualizada,
            }
          : null,
      },
    };
  } catch (e) {
    console.error("Error al calcular la estadía:", e);
    return error("ERROR_INTERNO");
  }
}
