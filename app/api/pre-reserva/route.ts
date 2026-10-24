import { prisma } from "@/lib/prisma";
import { contarCaracteres } from "@/lib/utils";
import { estimarEstadia } from "@/lib/precios/estimar-estadia";
import { nochesEntre, type EstadiaCalculada } from "@/lib/precios/estadia";
import {
  armarMensajePreReserva,
  estadoHttpParaMotivo,
  mensajeErrorPreReserva,
  snapshotDesdeEstadia,
  type MotivoErrorHttp,
} from "@/lib/pre-reserva/mensaje";

const MAX_CARACTERES_SIN_ESPACIOS = 1000;
const MAX_CARACTERES_TOTAL = 3000;

const MENSAJE_CAMPOS_REQUERIDOS =
  "Faltan campos requeridos o inválidos: propiedad_id, fecha_inicio, fecha_fin, huesped_nombre, personas (number > 0)";

function respuestaJson(datos: unknown, status: number): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function respuestaError(mensaje: string, status: number): Response {
  return respuestaJson({ error: mensaje }, status);
}

function respuestaMotivo(motivo: MotivoErrorHttp): Response {
  return respuestaError(mensajeErrorPreReserva(motivo), estadoHttpParaMotivo(motivo));
}

export async function POST(request: Request): Promise<Response> {
  // Flujo de lo más barato a lo más caro: formato, validaciones y recién al final la base.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respuestaError("Body inválido o JSON esperado", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return respuestaError("Body inválido o JSON esperado", 400);
  }

  const datos = body as Record<string, unknown>;
  const {
    propiedad_id,
    fecha_inicio,
    fecha_fin,
    huesped_nombre,
    personas,
    informacion_adicional,
  } = datos;

  // Campos requeridos: strings no vacíos para id y nombre, fechas como strings.
  if (
    typeof propiedad_id !== "string" ||
    propiedad_id.trim() === "" ||
    typeof fecha_inicio !== "string" ||
    typeof fecha_fin !== "string" ||
    typeof huesped_nombre !== "string" ||
    huesped_nombre.trim() === "" ||
    typeof personas !== "number" ||
    !(personas > 0)
  ) {
    return respuestaError(MENSAJE_CAMPOS_REQUERIDOS, 400);
  }

  const id = propiedad_id.trim();
  const nombreLimpio = huesped_nombre.trim();

  let informacionAdicional: string | null | undefined;
  if (informacion_adicional !== null && informacion_adicional !== undefined) {
    if (typeof informacion_adicional !== "string") {
      return respuestaError("informacion_adicional debe ser un string", 400);
    }

    if (informacion_adicional.length > MAX_CARACTERES_TOTAL) {
      return respuestaError(
        `La información adicional supera el límite de ${MAX_CARACTERES_TOTAL} caracteres totales`,
        400
      );
    }

    const charsSinEspacios = contarCaracteres(informacion_adicional);
    if (charsSinEspacios > MAX_CARACTERES_SIN_ESPACIOS) {
      return respuestaError(
        `La información adicional supera el límite de ${MAX_CARACTERES_SIN_ESPACIOS} caracteres (sin contar espacios)`,
        400
      );
    }

    informacionAdicional = informacion_adicional;
  } else {
    informacionAdicional = informacion_adicional;
  }

  // Fechas estrictas YYYY-MM-DD: nochesEntre también descarta calendarios inexistentes.
  const noches = nochesEntre(fecha_inicio, fecha_fin);
  if (!noches.ok) {
    return respuestaMotivo(noches.motivo);
  }

  // Precio, temporada y cotización salen siempre del servidor, nunca del cliente.
  const resultado = await estimarEstadia(id, fecha_inicio, fecha_fin);

  let estadia: EstadiaCalculada | null = null;
  if (!resultado.ok) {
    if (resultado.motivo === "SIN_PRECIO") {
      // Sin precio la pre-reserva se crea igual: snapshot null y "El valor se consulta.".
      estadia = null;
    } else {
      return respuestaMotivo(resultado.motivo);
    }
  } else {
    estadia = resultado.estadia;
  }

  try {
    const propiedad = await prisma.propiedad.findUnique({
      where: { id },
      select: { nombre: true },
    });

    if (!propiedad) {
      return respuestaMotivo("CABANA_NO_ENCONTRADA");
    }

    // Medianoche UTC: evita corrimientos de zona horaria en las columnas @db.Date.
    const fechaIn = new Date(`${fecha_inicio}T00:00:00.000Z`);
    const fechaFin = new Date(`${fecha_fin}T00:00:00.000Z`);

    if (isNaN(fechaIn.getTime()) || isNaN(fechaFin.getTime())) {
      return respuestaMotivo("FECHAS_INVALIDAS");
    }

    const snapshot = snapshotDesdeEstadia(estadia);

    // Sin validación de conflicto de fechas: por decisión de producto el administrador gestiona las superposiciones entre pre-reservas.
    const reserva = await prisma.reserva.create({
      data: {
        propiedadId: id,
        huespedNombre: nombreLimpio,
        huespedTelefono: "",
        fechaIngreso: fechaIn,
        fechaSalida: fechaFin,
        personas,
        diasEstadia: noches.noches,
        notas: informacionAdicional?.trim() || undefined,
        ...snapshot,
      },
    });

    const mensaje = armarMensajePreReserva({
      id: reserva.id,
      nombreCabana: propiedad.nombre,
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin,
      noches: noches.noches,
      estadia,
    });

    return respuestaJson(
      {
        id: reserva.id,
        mensaje,
        propiedad_nombre: propiedad.nombre,
        fecha_inicio,
        fecha_fin,
        personas,
        dias_estadia: noches.noches,
      },
      201
    );
  } catch (error) {
    console.error("Error al crear la pre-reserva:", error);
    return respuestaError("Error interno al crear la pre-reserva", 500);
  }
}
