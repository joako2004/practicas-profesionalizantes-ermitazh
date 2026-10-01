import { type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const TRAMOS_VALIDOS = ["UNA_NOCHE", "DE_DOS_A_SEIS", "SIETE_O_MAS"] as const;

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

    const {
      propiedadId,
      nombre,
      fechaInicio,
      fechaFin,
      precioPorNoche,
      tramoNoches,
      cantidadPersonas,
      tipoDia,
      activo,
    } = body;

    // Validar campos obligatorios
    if (!propiedadId || !nombre || !fechaInicio || !fechaFin || precioPorNoche === undefined) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: propiedadId, nombre, fechaInicio, fechaFin, precioPorNoche." },
        { status: 400 }
      );
    }

    // Validar tramoNoches
    if (!TRAMOS_VALIDOS.includes(tramoNoches)) {
      return NextResponse.json(
        { error: `El campo tramoNoches debe ser uno de: ${TRAMOS_VALIDOS.join(", ")}.` },
        { status: 400 }
      );
    }

    // Validar cantidadPersonas
    if (
      typeof cantidadPersonas !== "number" ||
      !Number.isInteger(cantidadPersonas) ||
      cantidadPersonas <= 0
    ) {
      return NextResponse.json(
        { error: "El campo cantidadPersonas es obligatorio y debe ser un entero mayor a 0." },
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
        tramoNoches,
        cantidadPersonas,
        precioPorNoche: Number(precioPorNoche),
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

function validarFechas(fechaInicio: Date, fechaFin: Date): boolean {
  return fechaInicio < fechaFin;
}