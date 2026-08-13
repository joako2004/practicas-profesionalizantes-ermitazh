import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const propiedad = await prisma.propiedad.findUnique({
      where: { id },
    });

    if (!propiedad) {
      return NextResponse.json(
        { error: "Propiedad no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(propiedad, { status: 200 });
  } catch (error) {
    console.error("Error al obtener la propiedad:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
