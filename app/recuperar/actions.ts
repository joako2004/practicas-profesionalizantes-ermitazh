"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function solicitarRecuperacion(formData: FormData) {
  const emailCampo = formData.get("email");
  const email = typeof emailCampo === "string" ? emailCampo.trim() : "";

  if (email.length === 0 || email.length > 254 || !EMAIL_REGEX.test(email)) {
    redirect("/recuperar?error=email-invalido");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error("recuperar: falta NEXT_PUBLIC_SITE_URL");
    redirect("/recuperar?error=no-se-pudo-enviar");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl.replace(/\/+$/, "")}/auth/callback`,
  });

  if (error) {
    console.error("recuperar: fallo el envio", error.status);
  }

  redirect("/recuperar?enviado=1");
}
