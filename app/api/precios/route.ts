import { type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function validarFechas(fechaInicio: Date, fechaFin: Date): boolean {
  return fechaInicio < fechaFin;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propiedadId = searchParams.get("propiedadId");

    const where: Prisma.PrecioWhereInput = {};

    if (propiedadId) {
      where.propiedadId = propiedadId;
    }

    const precios = await prisma.precio.findMany({
      where,
      include: {
        propiedad: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaInicio: "asc",
      },
    });

    return NextResponse.json(precios);
  } catch (error) {
    console.error("Error al obtener precios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener precios." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { propiedadId, nombre, fechaInicio, fechaFin, precioPorNoche, tipoDia, activo } = body;

    if (!propiedadId || !nombre || !fechaInicio || !fechaFin || precioPorNoche === undefined) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: propiedadId, nombre, fechaInicio, fechaFin, precioPorNoche." },
        { status: 400 }
      );
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return NextResponse.json(
        { error: "Las fechas deben tener un formato válido (ISO 8601)." },
        { status: 400 }
      );
    }

    if (!validarFechas(inicio, fin)) {
      return NextResponse.json(
        { error: "fechaInicio debe ser anterior a fechaFin." },
        { status: 400 }
      );
    }

    const propiedad = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
    });

    if (!propiedad) {
      return NextResponse.json(
        { error: "La propiedad especificada no existe." },
        { status: 404 }
      );
    }

    const precio = await prisma.precio.create({
      data: {
        propiedadId,
        nombre,
        fechaInicio: inicio,
        fechaFin: fin,
        precioPorNoche,
        tipoDia: tipoDia || "TODOS",
        activo: activo !== undefined ? activo : true,
      },
      include: {
        propiedad: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(precio, { status: 201 });
  } catch (error) {
    console.error("Error al crear precio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al crear el precio." },
      { status: 500 }
    );
  }
}