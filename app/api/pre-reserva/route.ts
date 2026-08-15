import { prisma } from "@/lib/prisma";
import { hayConflictoFecha } from "@/lib/disponibilidad";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Body inválido o JSON esperado" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const {
    propiedad_id,
    fecha_inicio,
    fecha_fin,
    huesped_nombre,
    huesped_telefono,
    personas,
  } = body;

  // 1. Validar campos requeridos
  if (
    !propiedad_id ||
    !fecha_inicio ||
    !fecha_fin ||
    !huesped_nombre ||
    !huesped_telefono ||
    !personas ||
    typeof personas !== "number" || personas <= 0
  ) {
    return new Response(
      JSON.stringify({ error: "Faltan campos requeridos o inválidos: propiedad_id, fecha_inicio, fecha_fin, huesped_nombre, huesped_telefono, personas (number > 0)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Validar que la fecha de inicio sea anterior a la fecha de fin
  const fechaIn = new Date(fecha_inicio);
  const fechaFin = new Date(fecha_fin);

  if (isNaN(fechaIn.getTime()) || isNaN(fechaFin.getTime())) {
    return new Response(
      JSON.stringify({ error: "Formato de fecha inválido" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (fechaIn >= fechaFin) {
    return new Response(
      JSON.stringify({ error: "La fecha de inicio debe ser anterior a la fecha de fin" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Validar que la propiedad existe
  const propiedadExistente = await prisma.propiedad.findUnique({
    where: { id: propiedad_id },
  });

  if (!propiedadExistente) {
    return new Response(
      JSON.stringify({ error: "Propiedad no encontrada" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Verificar conflicto de fechas (usando función compartida)
  const conflicto = await hayConflictoFecha(propiedad_id, fechaIn, fechaFin);
  if (conflicto) {
    return new Response(
      JSON.stringify({ error: "Ya existe una reserva pendiente para estas fechas" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5. Calcular diasEstadia automáticamente
  const diasEstadia = Math.ceil((fechaFin.getTime() - fechaIn.getTime()) / (1000 * 60 * 60 * 24));

  // 6. Crear la pre-reserva con estado PENDIENTE
  try {
    const reserva = await prisma.reserva.create({
      data: {
        propiedadId: propiedad_id,
        huespedNombre: huesped_nombre,
        huespedTelefono: huesped_telefono,
        fechaIngreso: fechaIn,
        fechaSalida: fechaFin,
        personas,
        diasEstadia,
      },
    });

    // 7. Retornar datos para WhatsApp redirect
    const mensaje = `Hola, quiero confirmar mi pre-reserva #${reserva.id} para ${fecha_inicio} al ${fecha_fin}`;

    return new Response(
      JSON.stringify({
        id: reserva.id,
        mensaje,
        propiedad_nombre: propiedadExistente.nombre,
        fecha_inicio: fecha_inicio,
        fecha_fin: fecha_fin,
        personas,
        dias_estadia: diasEstadia,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al crear reserva:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al crear la pre-reserva" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}