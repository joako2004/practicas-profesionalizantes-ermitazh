import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resena = await prisma.resena.findUnique({
      where: { id },
    });

    if (!resena) {
      return NextResponse.json(
        { error: "Reseña no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(resena, { status: 200 });
  } catch (error) {
    console.error("Error al obtener la reseña:", error);
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

    const existingResena = await prisma.resena.findUnique({
      where: { id },
    });

    if (!existingResena) {
      return NextResponse.json(
        { error: "Reseña no encontrada." },
        { status: 404 }
      );
    }

    const { autor, texto, puntuacion, publicada } = body;

    if (
      puntuacion !== undefined &&
      (typeof puntuacion !== "number" || puntuacion < 1 || puntuacion > 5)
    ) {
      return NextResponse.json(
        { error: "puntuacion debe ser un número entre 1 y 5." },
        { status: 400 }
      );
    }

    const resena = await prisma.resena.update({
      where: { id },
      data: {
        ...(autor !== undefined && { autor }),
        ...(texto !== undefined && { texto }),
        ...(puntuacion !== undefined && { puntuacion }),
        ...(publicada !== undefined && { publicada }),
      },
    });

    return NextResponse.json(resena, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar la reseña:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar la reseña." },
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

    const existingResena = await prisma.resena.findUnique({
      where: { id },
    });

    if (!existingResena) {
      return NextResponse.json(
        { error: "Reseña no encontrada." },
        { status: 404 }
      );
    }

    await prisma.resena.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Reseña eliminada correctamente." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar la reseña:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al eliminar la reseña." },
      { status: 500 }
    );
  }
}