"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { destinoSeguro } from "@/lib/auth/destino";
import { redirect } from "next/navigation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === "string" ? valor.trim() : "";
}

export async function registrar(formData: FormData) {
  const nombre = texto(formData.get("nombre"));
  const apellido = texto(formData.get("apellido"));
  const telefono = texto(formData.get("telefono"));
  const email = texto(formData.get("email")).toLowerCase();
  const destino = destinoSeguro(texto(formData.get("next")));
  const sufijoNext =
    destino === "/" ? "" : `&next=${encodeURIComponent(destino)}`;
  const passwordCampo = formData.get("password");
  const password = typeof passwordCampo === "string" ? passwordCampo : "";

  const datosValidos =
    nombre.length > 0 &&
    nombre.length <= 80 &&
    apellido.length > 0 &&
    apellido.length <= 80 &&
    telefono.length <= 30 &&
    email.length <= 254 &&
    EMAIL_REGEX.test(email) &&
    password.length >= 8 &&
    password.length <= 72;

  if (!datosValidos) {
    redirect(`/registro?error=datos-invalidos${sufijoNext}`);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error("registro: signUp falló", error.code);
    redirect(`/registro?error=no-se-pudo-crear${sufijoNext}`);
  }

  if (!data.user || !data.session) {
    console.error("registro: signUp sin sesión (¿confirmación de email activa?)");
    redirect(`/registro?error=no-se-pudo-crear${sufijoNext}`);
  }

  await prisma.perfil.upsert({
    where: { id: data.user.id },
    create: {
      id: data.user.id,
      email,
      nombre,
      apellido,
      telefono: telefono === "" ? null : telefono,
      rol: "HUESPED",
    },
    update: {},
  });

  redirect(destino);
}