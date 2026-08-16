import { EstadoReserva, Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ESTADOS_PERMITIDOS = ["PENDIENTE", "CONFIRMADA", "RECHAZADA", "CANCELADA"];

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const estadoFilter = searchParams.get("estado");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (
    isNaN(page) || page < 1 ||
    isNaN(limit) || limit < 1
  ) {
    return NextResponse.json(
      { error: "Parámetros inválidos: page y limit deben ser números positivos" },
      { status: 400 }
    );
  }

  if (estadoFilter && !ESTADOS_PERMITIDOS.includes(estadoFilter)) {
    return NextResponse.json(
      { error: `Estado inválido. Valores permitidos: ${ESTADOS_PERMITIDOS.join(", ")}` },
      { status: 400 }
    );
  }

  const where: Prisma.ReservaWhereInput = {};

  if (estadoFilter) {
    where.estado = estadoFilter as EstadoReserva;
  }

  const [reservas, total] = await prisma.$transaction([
    prisma.reserva.findMany({
      where,
      include: {
        propiedad: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaIngreso: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reserva.count({ where }),
  ]);

  return NextResponse.json({
    reservas,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}