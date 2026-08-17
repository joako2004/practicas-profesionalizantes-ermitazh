import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function validarFechas(fechaInicio: Date, fechaFin: Date): boolean {
  return fechaInicio < fechaFin;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const precio = await prisma.precio.findUnique({
      where: { id },
      include: {
        propiedad: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!precio) {
      return NextResponse.json(
        { error: "Rango de precio no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(precio, { status: 200 });
  } catch (error) {
    console.error("Error al obtener el precio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingPrecio = await prisma.precio.findUnique({
      where: { id },
    });

    if (!existingPrecio) {
      return NextResponse.json(
        { error: "Rango de precio no encontrado." },
        { status: 404 }
      );
    }

    const { propiedadId, nombre, fechaInicio, fechaFin, precioPorNoche, tipoDia, activo } = body;

    let inicio = existingPrecio.fechaInicio;
    let fin = existingPrecio.fechaFin;

    if (fechaInicio !== undefined) {
      inicio = new Date(fechaInicio);
      if (isNaN(inicio.getTime())) {
        return NextResponse.json(
          { error: "fechaInicio debe tener un formato válido (ISO 8601)." },
          { status: 400 }
        );
      }
    }

    if (fechaFin !== undefined) {
      fin = new Date(fechaFin);
      if (isNaN(fin.getTime())) {
        return NextResponse.json(
          { error: "fechaFin debe tener un formato válido (ISO 8601)." },
          { status: 400 }
        );
      }
    }

    if (!validarFechas(inicio, fin)) {
      return NextResponse.json(
        { error: "fechaInicio debe ser anterior a fechaFin." },
        { status: 400 }
      );
    }

    if (propiedadId !== undefined) {
      const propiedad = await prisma.propiedad.findUnique({
        where: { id: propiedadId },
      });

      if (!propiedad) {
        return NextResponse.json(
          { error: "La propiedad especificada no existe." },
          { status: 404 }
        );
      }
    }

    const precio = await prisma.precio.update({
      where: { id },
      data: {
        ...(propiedadId !== undefined && { propiedadId }),
        ...(nombre !== undefined && { nombre }),
        ...(fechaInicio !== undefined && { fechaInicio: inicio }),
        ...(fechaFin !== undefined && { fechaFin: fin }),
        ...(precioPorNoche !== undefined && { precioPorNoche }),
        ...(tipoDia !== undefined && { tipoDia }),
        ...(activo !== undefined && { activo }),
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

    return NextResponse.json(precio, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar el precio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar el precio." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingPrecio = await prisma.precio.findUnique({
      where: { id },
    });

    if (!existingPrecio) {
      return NextResponse.json(
        { error: "Rango de precio no encontrado." },
        { status: 404 }
      );
    }

    await prisma.precio.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Rango de precio eliminado correctamente." }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar el precio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al eliminar el precio." },
      { status: 500 }
    );
  }
}