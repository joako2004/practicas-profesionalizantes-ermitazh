import { type Prisma } from "@prisma/client";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

export async function POST(request: NextRequest) {
  try {
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
    };

    const { nombre, descripcion, capacidad, precioBase, servicios } = payload;

    if (typeof nombre !== "string" || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El campo nombre es obligatorio y debe ser un texto válido." },
        { status: 400 }
      );
    }

    if (typeof descripcion !== "string" || descripcion.trim() === "") {
      return NextResponse.json(
        {
          error:
            "El campo descripcion es obligatorio y debe ser un texto válido.",
        },
        { status: 400 }
      );
    }

    if (
      typeof capacidad !== "number" ||
      !Number.isFinite(capacidad) ||
      !Number.isInteger(capacidad) ||
      capacidad <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "El campo capacidad es obligatorio y debe ser un número entero mayor a 0.",
        },
        { status: 400 }
      );
    }

    if (
      typeof precioBase !== "number" ||
      !Number.isFinite(precioBase) ||
      precioBase < 0
    ) {
      return NextResponse.json(
        {
          error:
            "El campo precioBase es obligatorio y debe ser un número válido.",
        },
        { status: 400 }
      );
    }

    if (
      servicios !== undefined &&
      (!Array.isArray(servicios) ||
        servicios.some((servicio) => typeof servicio !== "string"))
    ) {
      return NextResponse.json(
        {
          error:
            "El campo servicios, si se envía, debe ser un array de strings.",
        },
        { status: 400 }
      );
    }

    const serviciosValidos = Array.isArray(servicios)
      ? servicios
          .map((servicio) => servicio.trim())
          .filter((servicio) => servicio.length > 0)
      : [];

    const propiedad = await prisma.propiedad.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        capacidad,
        precioBase,
        fotos: [],
        servicios: serviciosValidos,
        activa: true,
      },
    });

    return NextResponse.json(propiedad, { status: 201 });
  } catch (error) {
    console.error("Error al crear propiedad:", error);

    return NextResponse.json(
      { error: "Error interno del servidor al crear la propiedad." },
      { status: 500 }
    );
  }
}