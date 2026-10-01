import { EstadoConsulta } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const ESTADOS_VALIDOS = Object.values(EstadoConsulta);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const consulta = await prisma.consulta.findUnique({
      where: { id },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: "Consulta no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(consulta, { status: 200 });
  } catch (error) {
    console.error("Error al obtener la consulta:", error);
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

    const existingConsulta = await prisma.consulta.findUnique({
      where: { id },
    });

    if (!existingConsulta) {
      return NextResponse.json(
        { error: "Consulta no encontrada." },
        { status: 404 }
      );
    }

    const { nombre, email, mensaje, estado } = body;

    if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        { error: `estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(", ")}.` },
        { status: 400 }
      );
    }

    const consulta = await prisma.consulta.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(email !== undefined && { email }),
        ...(mensaje !== undefined && { mensaje }),
        ...(estado !== undefined && { estado }),
      },
    });

    return NextResponse.json(consulta, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar la consulta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar la consulta." },
      { status: 500 }
    );
  }
}