import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ESTADOS_PERMITIDOS = ["PENDIENTE", "CONFIRMADA", "RECHAZADA", "CANCELADA"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resolvedParams = await params;
  const { estado } = await request.json();

  if (!estado || !ESTADOS_PERMITIDOS.includes(estado)) {
    return NextResponse.json(
      { error: `Estado inválido. Valores permitidos: ${ESTADOS_PERMITIDOS.join(", ")}` },
      { status: 400 }
    );
  }

  const reservaExistente = await prisma.reserva.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!reservaExistente) {
    return NextResponse.json(
      { error: "Reserva no encontrada" },
      { status: 404 }
    );
  }

  try {
    const reservaActualizada = await prisma.reserva.update({
      where: { id: resolvedParams.id },
      data: { estado },
      include: {
        propiedad: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({ reserva: reservaActualizada });
  } catch (error) {
    console.error("Error actualizando reserva:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar la reserva" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resolvedParams = await params;

  const reservaExistente = await prisma.reserva.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!reservaExistente) {
    return NextResponse.json(
      { error: "Reserva no encontrada" },
      { status: 404 }
    );
  }

  try {
    const reservaActualizada = await prisma.reserva.update({
      where: { id: resolvedParams.id },
      data: { estado: "CANCELADA" },
      include: {
        propiedad: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Reserva cancelada (soft-delete)",
      reserva: reservaActualizada,
    });
  } catch (error) {
    console.error("Error cancelando reserva:", error);
    return NextResponse.json(
      { error: "Error interno al cancelar la reserva" },
      { status: 500 }
    );
  }
}