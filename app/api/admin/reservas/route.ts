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

  const where: any = {};

  if (estadoFilter) {
    where.estado = estadoFilter;
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