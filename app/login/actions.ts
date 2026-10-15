"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { destinoSeguro } from "@/lib/auth/destino";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const nextCampo = formData.get("next");
  const destino = destinoSeguro(
    typeof nextCampo === "string" ? nextCampo.trim() : "",
  );
  const sufijoNext =
    destino === "/" ? "" : `&next=${encodeURIComponent(destino)}`;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect(`/login?error=credenciales-invalidas${sufijoNext}`);
  }

  const perfil = await prisma.perfil.findUnique({
    where: { id: data.user.id },
    select: { rol: true },
  });

  if (perfil?.rol === "ADMIN") {
    redirect("/admin");
  }

  redirect(destino);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
