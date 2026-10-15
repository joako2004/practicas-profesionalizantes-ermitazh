import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type Perfil = {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  rol: "ADMIN" | "HUESPED";
  creadoEn: Date;
  actualizadoEn: Date;
};

export type AuthUser = {
  id: string;
  email: string | null;
};

export async function obterUsuarioActual(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

export async function obterPerfilActual()
  : Promise<{ user: AuthUser; perfil: Perfil | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const perfil = await prisma.perfil.findUnique({
    where: { id: user.id },
  });

  return {
    user: { id: user.id, email: user.email ?? null },
    perfil,
  };
}

export async function esAdmin(): Promise<boolean> {
  try {
    const result = await obterPerfilActual();
    if (!result) return false;
    const { user, perfil } = result;
    if (!user || !perfil) return false;
    return perfil.rol === "ADMIN";
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const perfil = await prisma.perfil.findUnique({
    where: { id: user.id },
  });

  if (!perfil || perfil.rol !== "ADMIN") {
    redirect("/");
  }

  return { user: { id: user.id, email: user.email ?? null }, perfil };
}

export type PerfilAuthResult =
  | { ok: true; user: AuthUser; perfil: Perfil }
  | { ok: false; response: NextResponse };

export async function requireAdminApi(): Promise<PerfilAuthResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "No autenticado" },
          { status: 401 }
        ),
      };
    }

    const perfil = await prisma.perfil.findUnique({
      where: { id: user.id },
    });

    if (!perfil || perfil.rol !== "ADMIN") {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        ),
      };
    }

    return { ok: true, user: { id: user.id, email: user.email ?? null }, perfil };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Error de autorización" }, { status: 500 }) };
  }
}