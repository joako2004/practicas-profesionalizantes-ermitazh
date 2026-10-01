import { type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicada = searchParams.get("publicada");
    const reservaId = searchParams.get("reservaId");

    const where: Prisma.ResenaWhereInput = {};

    if (publicada !== null) {
      if (publicada !== "true" && publicada !== "false") {
        return NextResponse.json(
          { error: "publicada debe ser 'true' o 'false'." },
          { status: 400 }
        );
      }
      where.publicada = publicada === "true";
    }

    if (reservaId) {
      where.reservaId = reservaId;
    }

    const resenas = await prisma.resena.findMany({
      where,
      orderBy: {
        creadaEn: "desc",
      },
    });

    return NextResponse.json(resenas);
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener reseñas." },
      { status: 500 }
    );
  }
}
