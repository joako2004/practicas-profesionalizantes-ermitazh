import { type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const capacidadParam = searchParams.get("capacidad");
    const servicioParam = searchParams.get("servicio");

    const where: Prisma.PropiedadWhereInput = {
      activa: true,
    };

    if (capacidadParam !== null) {
      const capacidad = Number(capacidadParam);

      if (!Number.isFinite(capacidad) || capacidad < 0) {
        return NextResponse.json(
          { error: "El parámetro capacidad debe ser un número válido." },
          { status: 400 }
        );
      }

      where.capacidad = {
        gte: capacidad,
      };
    }

    if (servicioParam !== null) {
      const servicio = servicioParam.trim();

      if (!servicio) {
        return NextResponse.json(
          { error: "El parámetro servicio no puede estar vacío." },
          { status: 400 }
        );
      }

      where.servicios = {
        has: servicio,
      };
    }

    const propiedades = await prisma.propiedad.findMany({
      where,
      orderBy: {
        creadaEn: "desc",
      },
    });

    return NextResponse.json(propiedades);
  } catch (error) {
  console.error("Error al obtener propiedades:", error);
  return NextResponse.json(
    { error: "Error interno del servidor al obtener propiedades." },
    { status: 500 }
  );
}
}