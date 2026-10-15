import { EstadoConsulta, type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const ESTADOS_VALIDOS = Object.values(EstadoConsulta);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    const where: Prisma.ConsultaWhereInput = {};

    if (estado) {
      if (!ESTADOS_VALIDOS.includes(estado as EstadoConsulta)) {
        return NextResponse.json(
          { error: `estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(", ")}.` },
          { status: 400 }
        );
      }
      where.estado = estado as EstadoConsulta;
    }

    const consultas = await prisma.consulta.findMany({
      where,
      orderBy: {
        creadaEn: "desc",
      },
    });

    return NextResponse.json(consultas);
  } catch (error) {
    console.error("Error al obtener consultas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener consultas." },
      { status: 500 }
    );
  }
}