import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El body debe ser un JSON válido." },
        { status: 400 }
      );
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "El body debe ser un objeto JSON." },
        { status: 400 }
      );
    }

    const payload = body as {
      nombre?: unknown;
      descripcion?: unknown;
      capacidad?: unknown;
      precioBase?: unknown;
      servicios?: unknown;
      activa?: unknown;
    };

    const { nombre, descripcion, capacidad, precioBase, servicios, activa } =
      payload;

    const propiedadExistente = await prisma.propiedad.findUnique({
      where: { id },
    });

    if (!propiedadExistente) {
      return NextResponse.json(
        { error: "Propiedad no encontrada." },
        { status: 404 }
      );
    }

    const dataToUpdate: {
      nombre?: string;
      descripcion?: string;
      capacidad?: number;
      precioBase?: number;
      servicios?: string[];
      activa?: boolean;
    } = {};

    if (nombre !== undefined) {
      if (typeof nombre !== "string" || nombre.trim() === "") {
        return NextResponse.json(
          { error: "El campo nombre debe ser un texto no vacío." },
          { status: 400 }
        );
      }

      dataToUpdate.nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      if (typeof descripcion !== "string" || descripcion.trim() === "") {
        return NextResponse.json(
          { error: "El campo descripcion debe ser un texto no vacío." },
          { status: 400 }
        );
      }

      dataToUpdate.descripcion = descripcion.trim();
    }

    if (capacidad !== undefined) {
      if (
        typeof capacidad !== "number" ||
        !Number.isFinite(capacidad) ||
        !Number.isInteger(capacidad) ||
        capacidad <= 0
      ) {
        return NextResponse.json(
          {
            error: "El campo capacidad debe ser un número entero mayor a 0.",
          },
          { status: 400 }
        );
      }

      dataToUpdate.capacidad = capacidad;
    }

    if (precioBase !== undefined) {
      if (
        typeof precioBase !== "number" ||
        !Number.isFinite(precioBase) ||
        precioBase < 0
      ) {
        return NextResponse.json(
          {
            error:
              "El campo precioBase debe ser un número válido mayor o igual a 0.",
          },
          { status: 400 }
        );
      }

      dataToUpdate.precioBase = precioBase;
    }

    if (servicios !== undefined) {
      if (
        !Array.isArray(servicios) ||
        servicios.some((servicio) => typeof servicio !== "string")
      ) {
        return NextResponse.json(
          { error: "El campo servicios debe ser un array de strings." },
          { status: 400 }
        );
      }

      dataToUpdate.servicios = servicios
        .map((servicio) => servicio.trim())
        .filter((servicio) => servicio.length > 0);
    }

    if (activa !== undefined) {
      if (typeof activa !== "boolean") {
        return NextResponse.json(
          { error: "El campo activa debe ser un booleano." },
          { status: 400 }
        );
      }

      dataToUpdate.activa = activa;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "No se envió ningún campo válido para actualizar." },
        { status: 400 }
      );
    }

    const propiedadActualizada = await prisma.propiedad.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(propiedadActualizada, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar la propiedad:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor al actualizar la propiedad.",
      },
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
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const propiedad = await prisma.propiedad.findUnique({
      where: { id },
      include: {
        reservas: {
          where: {
            estado: {
              not: "CANCELADA",
            },
          },
        },
      },
    });

    if (!propiedad) {
      return NextResponse.json(
        { error: "Propiedad no encontrada." },
        { status: 404 }
      );
    }

    if (propiedad.reservas.length > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la propiedad porque tiene ${propiedad.reservas.length} reserva(s) activa(s).`,
        },
        { status: 409 }
      );
    }

    await prisma.propiedad.delete({
      where: { id },
    });

    return NextResponse.json(
      { mensaje: "Propiedad eliminada correctamente." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar la propiedad:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor al eliminar la propiedad.",
      },
      { status: 500 }
    );
  }
}
