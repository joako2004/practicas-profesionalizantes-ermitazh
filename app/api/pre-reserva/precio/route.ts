import { prisma } from "@/lib/prisma";
import { contarCaracteres } from "@/lib/utils";
import { leerCabanasParaRango } from "@/lib/disponibilidad/servidor";
import { hoyEnArgentina } from "@/lib/fechas";
import { validarPreReserva } from "@/lib/pre-reserva/validar-disponibilidad";
import { estimarEstadia } from "@/lib/precios/estimar-estadia";
import { nochesEntre, type EstadiaCalculada } from "@/lib/precios/estadia";
import {
  snapshotDesdeEstadia,
  type SnapshotPreReserva,
} from "@/lib/pre-reserva/mensaje";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const propiedad_id = searchParams.get("propiedad_id");
  const fecha_inicio = searchParams.get("fecha_inicio");
  const fecha_fin = searchParams.get("fecha_fin");

  if (
    !propiedad_id ||
    !fecha_inicio ||
    !fecha_fin
  ) {
    return new Response(
      JSON.stringify({ error: "Faltan parámetros: propiedad_id, fecha_inicio, fecha_fin" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Precio, temporada y cotización salen siempre del servidor, nunca del cliente.
  const resultado = await estimarEstadia(propiedad_id, fecha_inicio, fecha_fin);

  let estadia: EstadiaCalculada | null = null;
  if (!resultado.ok) {
    if (resultado.motivo === "SIN_PRECIO") {
      estadia = null;
    } else {
      return new Response(
        JSON.stringify({ error: resultado.mensaje }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } else {
    estadia = resultado.estadia;
  }

  // Validar disponibilidad y capacidad (igual que en el POST handler)
  const id = propiedad_id.trim();
  const noches = nochesEntre(fecha_inicio, fecha_fin);
  if (!noches.ok) {
    return new Response(
      JSON.stringify({ error: "Fechas inválidas" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (noches.noches > 30) {
    return new Response(
      JSON.stringify({ error: "Estadía muy larga" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const propiedad = await prisma.propiedad.findUnique({
    where: { id },
    select: { nombre: true },
  });

  if (!propiedad) {
    return new Response(
      JSON.stringify({ error: "Cabaña no encontrada" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const fechaIn = new Date(`${fecha_inicio}T00:00:00.000Z`);
  const fechaFin = new Date(`${fecha_fin}T00:00:00.000Z`);

  if (isNaN(fechaIn.getTime()) || isNaN(fechaFin.getTime())) {
    return new Response(
      JSON.stringify({ error: "Fechas inválidas" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const cabanas = await leerCabanasParaRango(fechaIn, fechaFin, id);
  const validacion = validarPreReserva({
    propiedadId: id,
    ingreso: fechaIn,
    salida: fechaFin,
    personas: 2, // valor por defecto para validación
    hoy: hoyEnArgentina(new Date()),
    cabanas,
  });

  if (!validacion.ok) {
    return new Response(
      JSON.stringify({ error: validacion.mensaje }),
      {
        status: validacion.estado,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const snapshot = snapshotDesdeEstadia(estadia);

  // Incluir el porcentaje de promoción aplicada (para +7 noches)
  const promoPct = estadia?.promoAplicadaPct ?? 0;

  return new Response(
    JSON.stringify({
      ...snapshot,
      propiedad_nombre: propiedad.nombre,
      promoAplicadaPct: promoPct,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}